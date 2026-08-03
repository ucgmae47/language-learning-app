"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { schedulePresetRefresh } from "@/lib/personalization/refresh-presets";
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
 * - When interests already exist, regenerates personalised story + chat starters.
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
      {
        user_id: user.id,
        language,
        cefr_level: level,
        updated_at: new Date().toISOString(),
      },
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
  const [{ data: interests }, { data: profile }] = await Promise.all([
    supabase
      .from("user_interests")
      .select("id")
      .eq("user_id", user.id)
      .limit(1),
    supabase
      .from("profiles")
      .select("display_name")
      .eq("id", user.id)
      .maybeSingle<{ display_name: string | null }>(),
  ]);

  const hasInterests = (interests?.length ?? 0) > 0;

  // Returning users: refresh presets for the new level immediately.
  // First-time users refresh after they pick interests.
  if (hasInterests) {
    schedulePresetRefresh({
      userId: user.id,
      language,
      cefrLevel: level,
      displayName:
        profile?.display_name?.trim() ||
        (user.user_metadata?.display_name as string | undefined)?.trim() ||
        "Learner",
    });
  }

  revalidatePath("/", "layout");
  revalidatePath("/dashboard");
  revalidatePath("/settings");
  revalidatePath("/stories");
  revalidatePath("/chat");

  return { hasInterests };
}
