/**
 * Background chat-starter pre-generation.
 *
 * Uses the service-role Supabase client (runs inside after() callbacks where
 * request cookies are no longer available) and the recommendation engine to
 * produce topic-personalised starters that are ready before the user arrives.
 */

import { createServiceClient } from "@/lib/supabase/service";
import { buildPersonalizedTopics } from "@/lib/stories/recommendation";
import { generateChatStarters } from "@/lib/chat/generate-starters";
import type { CefrLevel, Language } from "@/lib/supabase/types";

const REFRESH_INTERVAL_MS = 45 * 60 * 1000; // 45 minutes

/**
 * Generates a fresh set of personalised starters and upserts them into
 * `queued_chat_starters` for the given user + language.
 *
 * Skips if a row already exists and is less than 45 minutes old — prevents
 * unnecessary AI calls when the user opens the chat multiple times in one
 * session.
 */
export async function generateAndQueueStarters(
  userId: string,
  language: Language,
  cefrLevel: CefrLevel,
  displayName: string,
): Promise<void> {
  const supabase = createServiceClient();

  // ── Guard: skip if we generated starters recently ─────────────────────────
  const { data: existing } = await supabase
    .from("queued_chat_starters")
    .select("created_at")
    .eq("user_id", userId)
    .eq("language", language)
    .maybeSingle<{ created_at: string }>();

  if (existing) {
    const ageMs = Date.now() - new Date(existing.created_at).getTime();
    if (ageMs < REFRESH_INTERVAL_MS) return;
  }

  // ── Build recommendation signals ──────────────────────────────────────────
  let hints;
  try {
    const { primaryGenre, interestTopics } = await buildPersonalizedTopics(
      supabase,
      userId,
      language,
    );
    hints = { primaryGenre, interestTopics };
  } catch {
    hints = undefined; // non-fatal: fall back to interest-only starters
  }

  // ── Fetch user interests for the prompt ───────────────────────────────────
  const { data: interestsData } = await supabase
    .from("user_interests")
    .select("topic")
    .eq("user_id", userId)
    .order("weight", { ascending: false })
    .limit(3);

  const interests = (interestsData ?? []).map(
    (r: { topic: string }) => r.topic,
  );

  // ── Generate starters ─────────────────────────────────────────────────────
  const starters = await generateChatStarters(
    displayName,
    cefrLevel,
    interests,
    language,
    hints,
  );

  // ── Upsert (one row per user per language) ────────────────────────────────
  await supabase
    .from("queued_chat_starters")
    .upsert(
      {
        user_id: userId,
        language,
        starters,
        created_at: new Date().toISOString(),
      },
      { onConflict: "user_id,language" },
    );
}
