"use server";

import { createClient } from "@/lib/supabase/server";
import type { Language } from "@/lib/supabase/types";

/**
 * Upserts a grammar_weaknesses row after each drill attempt.
 * Called from the client after the /api/drills/check response is received.
 */
export async function updateWeakness(
  language: Language,
  concept: string,
  wasCorrect: boolean,
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Not authenticated." };

  // Fetch current row (if any).
  const { data: existing } = await supabase
    .from("grammar_weaknesses")
    .select("id, error_count, attempt_count")
    .eq("user_id", user.id)
    .eq("language", language)
    .eq("concept", concept)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase
      .from("grammar_weaknesses")
      .update({
        attempt_count: existing.attempt_count + 1,
        error_count: wasCorrect ? existing.error_count : existing.error_count + 1,
        last_seen: new Date().toISOString(),
      })
      .eq("id", existing.id);

    return error ? { error: error.message } : {};
  }

  // First attempt for this concept.
  const { error } = await supabase.from("grammar_weaknesses").insert({
    user_id: user.id,
    language,
    concept,
    attempt_count: 1,
    error_count: wasCorrect ? 0 : 1,
    last_seen: new Date().toISOString(),
  });

  return error ? { error: error.message } : {};
}
