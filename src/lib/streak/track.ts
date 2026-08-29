/**
 * Daily reading streak — data helpers over the existing `session_metrics` table.
 *
 * `session_metrics` already has one row per (user, day) with UNIQUE(user_id, date)
 * and an index on (user_id, date DESC), so it is the activity calendar; no new
 * table or column is needed.
 *
 * `getStreakStatus` is the READ path used for display — it derives the streak
 * from that calendar rather than trusting `profiles.streak_count`, so a lapsed
 * streak renders as 0 immediately even when the stored count is stale.
 *
 * `markDailyActivity` is the WRITE path. It is fired from story reading/quiz
 * saves and must never fail them, so every error is swallowed and logged.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, SessionMetric } from "@/lib/supabase/types";
import { computeStreak, utcToday } from "./compute";

/** How far back to read the activity calendar. Comfortably longer than any
 *  streak we display, and bounded so the query stays a cheap index range scan. */
const LOOKBACK_DAYS = 60;

const DAY_MS = 24 * 60 * 60 * 1000;

export type StreakStatus = {
  /** Consecutive active days ending today or yesterday; 0 once lapsed. */
  streak: number;
  /** True when today already has a `session_metrics` row — the streak is safe. */
  activeToday: boolean;
};

/**
 * Reads the last ~60 days of activity for a user and derives their streak.
 * Also reports whether today is already counted, so a page can render both the
 * number and the "read today?" nudge from a single query.
 */
export async function getStreakStatus(
  supabase: SupabaseClient<Database>,
  userId: string,
): Promise<StreakStatus> {
  const today = utcToday();
  const since = new Date(Date.now() - LOOKBACK_DAYS * DAY_MS)
    .toISOString()
    .slice(0, 10);

  const { data, error } = await supabase
    .from("session_metrics")
    .select("date")
    .eq("user_id", userId)
    .gte("date", since)
    .order("date", { ascending: false })
    .returns<Pick<SessionMetric, "date">[]>();

  if (error) {
    console.error("[streak] fetch session_metrics failed:", error.message);
    return { streak: 0, activeToday: false };
  }

  const dates = (data ?? []).map((row) => row.date);

  return {
    streak: computeStreak(dates, today),
    activeToday: dates.includes(today),
  };
}

/**
 * Marks today as active and refreshes the stored `profiles.streak_count`.
 *
 * Called from the story progress autosave, which fires per sentence on a 400ms
 * debounce, so the common path (already active today) costs exactly one indexed
 * lookup on (user_id, date) and nothing else.
 *
 * Never throws — reading must not fail because the streak bookkeeping did.
 */
export async function markDailyActivity(
  supabase: SupabaseClient<Database>,
  userId: string,
): Promise<void> {
  try {
    const today = utcToday();

    // ── Cheap guard: the overwhelmingly common case is "already counted". ──
    const { data: existing, error: lookupError } = await supabase
      .from("session_metrics")
      .select("id")
      .eq("user_id", userId)
      .eq("date", today)
      .maybeSingle<Pick<SessionMetric, "id">>();

    if (lookupError) {
      console.error("[streak] today lookup failed:", lookupError.message);
      return;
    }
    if (existing) return;

    // First activity of the day. `ignoreDuplicates` keeps this safe against a
    // race with saveStoryAttempt's own upsert — reading is not a completed
    // story, so this row must never clobber the counters that action owns.
    const { error: insertError } = await supabase.from("session_metrics").upsert(
      {
        user_id: userId,
        date: today,
        stories_read: 0,
        quiz_score_avg: null,
        drills_completed: 0,
        chat_turns: 0,
        minutes_active: 0,
      },
      { onConflict: "user_id,date", ignoreDuplicates: true },
    );

    if (insertError) {
      console.error("[streak] mark today active failed:", insertError.message);
      return;
    }

    const { streak } = await getStreakStatus(supabase, userId);

    const { error: profileError } = await supabase
      .from("profiles")
      .update({ streak_count: streak })
      .eq("id", userId);

    if (profileError) {
      console.error("[streak] profile update failed:", profileError.message);
    }
  } catch (err) {
    console.error("[streak] markDailyActivity threw:", err);
  }
}
