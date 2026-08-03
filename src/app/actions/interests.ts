"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { isInterestTopic } from "@/lib/interests/topics";
import { schedulePresetRefresh } from "@/lib/personalization/refresh-presets";
import type { CefrLevel, InterestTopic, Language } from "@/lib/supabase/types";

// ── Onboarding: explicit interest selection ──────────────────────────────────

/**
 * Saves the user's onboarding interest selections to user_interests.
 * Called from the interest-picker component after the CEFR assessment.
 * Also regenerates personalised story + chat starters for the active language.
 */
export async function saveInterests(
  topics: InterestTopic[],
): Promise<{ error?: string }> {
  if (topics.length === 0) return { error: "Please select at least one topic." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Not authenticated." };

  const uniqueTopics = [...new Set(topics.filter(isInterestTopic))];
  if (uniqueTopics.length === 0) {
    return { error: "Please select at least one topic." };
  }

  // Replace the full set so deselected topics are removed.
  await supabase.from("user_interests").delete().eq("user_id", user.id);

  const rows = uniqueTopics.map((topic) => ({
    user_id: user.id,
    topic,
    weight: 5, // baseline weight for explicitly chosen interests
  }));

  const { error } = await supabase.from("user_interests").insert(rows);

  if (error) return { error: error.message };

  const { data: profile } = await supabase
    .from("profiles")
    .select("language, cefr_level, display_name")
    .eq("id", user.id)
    .maybeSingle<{
      language: Language;
      cefr_level: CefrLevel;
      display_name: string | null;
    }>();

  if (profile) {
    schedulePresetRefresh({
      userId: user.id,
      language: profile.language ?? "es",
      cefrLevel: profile.cefr_level ?? "B1",
      displayName:
        profile.display_name?.trim() ||
        (user.user_metadata?.display_name as string | undefined)?.trim() ||
        "Learner",
    });
  }

  revalidatePath("/settings");
  revalidatePath("/dashboard");
  revalidatePath("/stories");
  revalidatePath("/chat");

  return {};
}

export type InterestsFormState = {
  success?: boolean;
  error?: string;
};

/**
 * Settings form action: replace the user's interest topics from FormData.
 */
export async function updateUserInterests(
  _prev: InterestsFormState,
  formData: FormData,
): Promise<InterestsFormState> {
  const raw = formData.getAll("topics").map(String);
  const topics = raw.filter(isInterestTopic);
  const result = await saveInterests(topics);
  if (result.error) return { error: result.error };
  return { success: true };
}

const WEIGHT_MIN = 0;
const WEIGHT_MAX = 20;

/**
 * Upserts a genre_interests row, incrementing the weight by `delta`.
 * Weight is clamped to [0, 20]. Non-fatal — silently logs errors.
 *
 * Called from the story generate route and the quiz submission action.
 */
export async function updateGenreInterest(
  genre: string,
  delta: number,
  language: Language,
): Promise<void> {
  if (!genre.trim()) return;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return;

  const normalised = genre.trim().toLowerCase();

  // Fetch current row (if any) to calculate new weight.
  const { data: existing } = await supabase
    .from("genre_interests")
    .select("id, weight")
    .eq("user_id", user.id)
    .eq("language", language)
    .eq("genre", normalised)
    .maybeSingle<{ id: string; weight: number }>();

  if (existing) {
    const newWeight = Math.min(
      WEIGHT_MAX,
      Math.max(WEIGHT_MIN, existing.weight + delta),
    );
    await supabase
      .from("genre_interests")
      .update({ weight: newWeight, last_updated: new Date().toISOString() })
      .eq("id", existing.id);
  } else {
    const initialWeight = Math.min(
      WEIGHT_MAX,
      Math.max(WEIGHT_MIN, delta),
    );
    await supabase.from("genre_interests").insert({
      user_id: user.id,
      language,
      genre: normalised,
      weight: initialWeight,
    });
  }
}
