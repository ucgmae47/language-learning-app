"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { CefrLevel, Language } from "@/lib/supabase/types";

const LEVEL_ORDER: CefrLevel[] = ["A1", "A2", "B1", "B2", "C1", "C2"];

export type AdaptationSuggestion = {
  suggestion: "upgrade" | "downgrade" | null;
  avgScore: number; // 0–100
  attemptCount: number;
  currentLevel: CefrLevel;
  suggestedLevel: CefrLevel | null;
  language: Language;
};

/**
 * Looks at the user's last 7 days of session_metrics.
 * Requires ≥ 3 scored sessions before making any suggestion.
 *
 * avg < 50  → downgrade suggestion (content is too hard)
 * avg ≥ 90  → upgrade suggestion   (content is too easy)
 */
export async function getCefrAdaptationSuggestion(): Promise<AdaptationSuggestion | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const [profileResult, metricsResult] = await Promise.all([
    supabase
      .from("profiles")
      .select("cefr_level, language")
      .eq("id", user.id)
      .single<{ cefr_level: CefrLevel; language: Language }>(),

    supabase
      .from("session_metrics")
      .select("quiz_score_avg")
      .eq("user_id", user.id)
      .gte("date", sevenDaysAgo.toISOString().slice(0, 10))
      .gt("stories_read", 0), // only days where a story was read
  ]);

  const currentLevel: CefrLevel = profileResult.data?.cefr_level ?? "B1";
  const language: Language = profileResult.data?.language ?? "es";
  const rows = (metricsResult.data ?? []) as { quiz_score_avg: number }[];

  if (rows.length < 3) return null; // not enough data

  const avgScore =
    rows.reduce((sum, r) => sum + (r.quiz_score_avg ?? 0), 0) / rows.length;

  const currentIdx = LEVEL_ORDER.indexOf(currentLevel);

  if (avgScore < 50 && currentIdx > 0) {
    return {
      suggestion: "downgrade",
      avgScore,
      attemptCount: rows.length,
      currentLevel,
      suggestedLevel: LEVEL_ORDER[currentIdx - 1] ?? null,
      language,
    };
  }

  if (avgScore >= 90 && currentIdx < LEVEL_ORDER.length - 1) {
    return {
      suggestion: "upgrade",
      avgScore,
      attemptCount: rows.length,
      currentLevel,
      suggestedLevel: LEVEL_ORDER[currentIdx + 1] ?? null,
      language,
    };
  }

  return null;
}

/**
 * Applies a CEFR level change to both `profiles` and `language_profiles`.
 */
export async function applyCefrAdaptation(
  newLevel: CefrLevel,
  language: Language,
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated." };

  const [profileUpdate, langProfileUpdate] = await Promise.all([
    supabase
      .from("profiles")
      .update({ cefr_level: newLevel })
      .eq("id", user.id),
    supabase
      .from("language_profiles")
      .update({ cefr_level: newLevel })
      .eq("user_id", user.id)
      .eq("language", language),
  ]);

  if (profileUpdate.error) return { error: profileUpdate.error.message };
  if (langProfileUpdate.error) return { error: langProfileUpdate.error.message };

  revalidatePath("/dashboard");
  return {};
}
