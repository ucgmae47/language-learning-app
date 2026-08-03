"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { schedulePresetRefresh } from "@/lib/personalization/refresh-presets";
import type { CefrLevel, Language } from "@/lib/supabase/types";

export type SettingsFormState = {
  success?: boolean;
  error?: string;
};

const CEFR_LEVELS: CefrLevel[] = ["A1", "A2", "B1", "B2", "C1", "C2"];
const LANGUAGES: Language[] = ["es", "fr"];

function isCefrLevel(value: string): value is CefrLevel {
  return (CEFR_LEVELS as string[]).includes(value);
}

function isLanguage(value: string): value is Language {
  return (LANGUAGES as string[]).includes(value);
}

export async function updateSettings(
  _prev: SettingsFormState,
  formData: FormData,
): Promise<SettingsFormState> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Not authenticated." };

  const displayName = (formData.get("display_name") as string | null)?.trim();
  const emailNotifications = formData.get("email_notifications") === "on";

  if (!displayName) return { error: "Display name cannot be empty." };
  if (displayName.length > 60) return { error: "Display name must be 60 characters or fewer." };

  const { error } = await supabase
    .from("profiles")
    .update({
      display_name: displayName,
      updated_at: new Date().toISOString(),
    })
    .eq("id", user.id);

  if (error) return { error: error.message };

  // Persist the email preference in Supabase Auth user metadata so the cron
  // job can read it without a separate table.
  const { error: metaError } = await supabase.auth.updateUser({
    data: { wotd_emails: emailNotifications },
  });

  if (metaError) return { error: metaError.message };

  revalidatePath("/settings");
  revalidatePath("/dashboard");

  return { success: true };
}

/**
 * Manually override the CEFR level for a language the user has already assessed.
 * Syncs both `language_profiles` and `profiles` when that language is active.
 */
export async function updateLanguageLevel(
  _prev: SettingsFormState,
  formData: FormData,
): Promise<SettingsFormState> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Not authenticated." };

  const languageRaw = (formData.get("language") as string | null) ?? "";
  const levelRaw = (formData.get("cefr_level") as string | null) ?? "";

  if (!isLanguage(languageRaw)) return { error: "Invalid language." };
  if (!isCefrLevel(levelRaw)) return { error: "Invalid CEFR level." };

  const language = languageRaw;
  const level = levelRaw;
  const now = new Date().toISOString();

  const { error: lpError } = await supabase
    .from("language_profiles")
    .upsert(
      {
        user_id: user.id,
        language,
        cefr_level: level,
        updated_at: now,
      },
      { onConflict: "user_id,language" },
    );

  if (lpError) return { error: lpError.message };

  const { data: profile } = await supabase
    .from("profiles")
    .select("language")
    .eq("id", user.id)
    .single<{ language: Language }>();

  if (profile?.language === language) {
    const { error: profileError } = await supabase
      .from("profiles")
      .update({ cefr_level: level, updated_at: now })
      .eq("id", user.id);

    if (profileError) return { error: profileError.message };
  }

  const { data: profileRow } = await supabase
    .from("profiles")
    .select("display_name, language")
    .eq("id", user.id)
    .maybeSingle<{ display_name: string | null; language: Language }>();

  // Refresh presets for the language whose level changed (may not be active).
  schedulePresetRefresh({
    userId: user.id,
    language,
    cefrLevel: level,
    displayName:
      profileRow?.display_name?.trim() ||
      (user.user_metadata?.display_name as string | undefined)?.trim() ||
      "Learner",
  });

  revalidatePath("/", "layout");
  revalidatePath("/settings");
  revalidatePath("/dashboard");
  revalidatePath("/stories");
  revalidatePath("/chat");

  return { success: true };
}
