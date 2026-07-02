"use server";

import { createClient } from "@/lib/supabase/server";
import type { Language } from "@/lib/supabase/types";

/**
 * Switches the user's active language on the dashboard.
 * Reads the stored cefr_level for that language from language_profiles
 * and syncs it back to profiles so all features use the correct level.
 */
export async function setActiveLanguage(
  language: Language,
): Promise<{ error?: string }> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Not authenticated." };

  const { data: lp, error: lpError } = await supabase
    .from("language_profiles")
    .select("cefr_level")
    .eq("user_id", user.id)
    .eq("language", language)
    .single();

  if (lpError || !lp) {
    return { error: "You haven't taken the assessment for that language yet." };
  }

  const { error } = await supabase
    .from("profiles")
    .update({
      language,
      cefr_level: lp.cefr_level,
      updated_at: new Date().toISOString(),
    })
    .eq("id", user.id);

  if (error) return { error: error.message };
  return {};
}
