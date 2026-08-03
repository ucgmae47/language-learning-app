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
import { getUserContext } from "@/lib/user-context";
import type { CefrLevel, Language } from "@/lib/supabase/types";

const REFRESH_INTERVAL_MS = 45 * 60 * 1000; // 45 minutes

/**
 * Generates a fresh set of personalised starters and upserts them into
 * `queued_chat_starters` for the given user + language.
 *
 * Skips if a row already exists and is less than 45 minutes old — unless
 * `force` is true (used when CEFR level or interests change).
 */
export async function generateAndQueueStarters(
  userId: string,
  language: Language,
  cefrLevel: CefrLevel,
  displayName: string,
  options: { force?: boolean } = {},
): Promise<void> {
  const supabase = createServiceClient();

  // ── Guard: skip if we generated starters recently ─────────────────────────
  if (!options.force) {
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
  }

  // ── Build full cross-app learner context (includes music, stories, genres) ─
  const userCtx = await getUserContext(
    supabase,
    userId,
    language,
    cefrLevel,
    displayName,
  );

  // ── Build recommendation signals for genre-aware starters ─────────────────
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

  // ── Generate starters (enriched with full learner context) ────────────────
  const starters = await generateChatStarters(
    displayName,
    cefrLevel,
    userCtx.explicitInterests,
    language,
    hints,
    userCtx.contextString,
  );

  // ── Upsert (one row per user per language) ────────────────────────────────
  const { error: upsertError } = await supabase
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

  if (upsertError) {
    console.error("[chat-queue] upsert starters failed:", upsertError.message);
  }
}
