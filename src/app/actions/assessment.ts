"use server";

import { createClient } from "@/lib/supabase/server";
import type { CefrLevel, Language } from "@/lib/supabase/types";

/**
 * Saves the result of a CEFR assessment for a specific language.
 *
 * - Upserts a row in `language_profiles` (user × language).
 * - Syncs `profiles.language` and `profiles.cefr_level` to the assessed language
 *   so every feature that reads the profile gets the active language automatically.
 * - Returns `hasInterests` so the client knows where to redirect:
 *   `false` → /onboarding/interests (first-time user)
 *   `true`  → /dashboard (returning user adding a second language)
 */
export async function saveAssessmentResult(
  language: Language,
  level: CefrLevel,
): Promise<{ error?: string; hasInterests?: boolean }> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Not authenticated." };

  // 1. Upsert the per-language profile.
  const { error: lpError } = await supabase
    .from("language_profiles")
    .upsert(
      { user_id: user.id, language, cefr_level: level },
      { onConflict: "user_id,language" },
    );

  if (lpError) return { error: lpError.message };

  // 2. Sync active language + level to the main profile row.
  const { error: profileError } = await supabase
    .from("profiles")
    .update({
      language,
      cefr_level: level,
      updated_at: new Date().toISOString(),
    })
    .eq("id", user.id);

  if (profileError) return { error: profileError.message };

  // 3. Check whether the user already has interests (determines redirect).
  const { data: interests } = await supabase
    .from("user_interests")
    .select("id")
    .eq("user_id", user.id)
    .limit(1);

  return { hasInterests: (interests?.length ?? 0) > 0 };
}
