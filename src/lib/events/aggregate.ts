/**
 * Behavioral Interest Engine — aggregation layer.
 *
 * `aggregateTopicScores(userId, language)` is meant to run inside an `after()`
 * callback so it never blocks the main response.  It:
 *
 *  1. Reads all user_events for (user, language) from the last 90 days.
 *  2. Groups events by topic, then applies:
 *       - Session diminishing returns (same source in same 30-min window → 25%)
 *       - Time decay (0.95 per week since the event)
 *       - Source diversity bonus (≥3 distinct sources → ×1.5)
 *  3. Upserts topic_scores with the new score, event_count, distinct_days.
 *  4. For each promoted topic, upserts genre_interests (only if new weight
 *     is higher than whatever is already stored, so onboarding selections
 *     are never degraded).
 */

import { createServiceClient } from "@/lib/supabase/service";
import type { Language } from "@/lib/supabase/types";
import {
  PROMOTION_TIERS,
  DECAY_PER_WEEK,
  BINGE_FACTOR,
  SOURCE_DIVERSITY_THRESHOLD,
  SOURCE_DIVERSITY_MULTIPLIER,
} from "./taxonomy";

type RawEvent = {
  topic: string;
  source: string;
  weight: number;
  session_key: string | null;
  created_at: string;
};

export async function aggregateTopicScores(
  userId: string,
  language: Language,
): Promise<void> {
  const supabase = createServiceClient();

  // ── 1. Fetch recent events ─────────────────────────────────────────────────
  const since = new Date(Date.now() - 90 * 24 * 3600 * 1000).toISOString();
  const { data: rows, error } = await supabase
    .from("user_events")
    .select("topic, source, weight, session_key, created_at")
    .eq("user_id", userId)
    .eq("language", language)
    .gte("created_at", since)
    .returns<RawEvent[]>();

  if (error) {
    console.error("[aggregate] fetch events failed:", error.message);
    return;
  }
  if (!rows || rows.length === 0) return;

  // ── 2. Group events by topic ───────────────────────────────────────────────
  const byTopic = new Map<
    string,
    { events: RawEvent[]; sources: Set<string>; days: Set<string> }
  >();

  for (const row of rows) {
    if (!byTopic.has(row.topic)) {
      byTopic.set(row.topic, { events: [], sources: new Set(), days: new Set() });
    }
    const bucket = byTopic.get(row.topic)!;
    bucket.events.push(row);
    bucket.sources.add(row.source);
    bucket.days.add(row.created_at.slice(0, 10)); // YYYY-MM-DD
  }

  const now = Date.now();

  for (const [topic, { events, sources, days }] of byTopic) {
    // ── 3a. Session diminishing returns ──────────────────────────────────────
    // Track (session_key + source) pairs — after the first event in that pair,
    // subsequent ones score at BINGE_FACTOR.
    const sessionSourceSeen = new Set<string>();
    let rawScore = 0;

    for (const ev of events) {
      const sessionId = `${ev.session_key ?? "none"}::${ev.source}`;
      const isFirstInSession = !sessionSourceSeen.has(sessionId);
      sessionSourceSeen.add(sessionId);

      const bingeFactor = isFirstInSession ? 1 : BINGE_FACTOR;

      // ── 3b. Time decay ────────────────────────────────────────────────────
      const ageMs = now - new Date(ev.created_at).getTime();
      const ageWeeks = ageMs / (7 * 24 * 3600 * 1000);
      const decayFactor = Math.pow(DECAY_PER_WEEK, ageWeeks);

      rawScore += ev.weight * bingeFactor * decayFactor;
    }

    // ── 3c. Source diversity bonus ────────────────────────────────────────────
    const diversityMultiplier =
      sources.size >= SOURCE_DIVERSITY_THRESHOLD
        ? SOURCE_DIVERSITY_MULTIPLIER
        : 1;

    const finalScore = rawScore * diversityMultiplier;
    const distinctDays = days.size;
    const eventCount = events.length;

    // ── 4. Upsert topic_scores ────────────────────────────────────────────────
    const { error: upsertErr } = await supabase
      .from("topic_scores")
      .upsert(
        {
          user_id: userId,
          language,
          topic,
          score: finalScore,
          event_count: eventCount,
          distinct_days: distinctDays,
          last_event_at: new Date().toISOString(),
        },
        { onConflict: "user_id,language,topic" },
      );

    if (upsertErr) {
      console.error("[aggregate] upsert topic_scores failed:", upsertErr.message);
      continue;
    }

    // ── 5. Promotion threshold check ─────────────────────────────────────────
    const tier = PROMOTION_TIERS.find(
      (t) => finalScore >= t.minScore && distinctDays >= t.minDays,
    );
    if (!tier) continue;

    // Fetch current genre_interests weight (if any) — only promote if higher.
    const { data: existing } = await supabase
      .from("genre_interests")
      .select("id, weight")
      .eq("user_id", userId)
      .eq("language", language)
      .eq("genre", topic)
      .maybeSingle<{ id: string; weight: number }>();

    const currentWeight = existing?.weight ?? 0;
    if (tier.genreWeight <= currentWeight) continue; // already at or above this tier

    if (existing) {
      await supabase
        .from("genre_interests")
        .update({ weight: tier.genreWeight, last_updated: new Date().toISOString() })
        .eq("id", existing.id);
    } else {
      await supabase.from("genre_interests").insert({
        user_id: userId,
        language,
        genre: topic,
        weight: tier.genreWeight,
      });
    }

    console.log(
      `[aggregate] promoted ${topic} → genre_interests weight=${tier.genreWeight} (score=${finalScore.toFixed(1)}, days=${distinctDays})`,
    );
  }
}
