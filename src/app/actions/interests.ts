"use server";

import { createClient } from "@/lib/supabase/server";
import type { InterestTopic, Language } from "@/lib/supabase/types";

// ── Onboarding: explicit interest selection ──────────────────────────────────

/**
 * Saves the user's onboarding interest selections to user_interests.
 * Called from the interest-picker component after the CEFR assessment.
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

  const rows = topics.map((topic) => ({
    user_id: user.id,
    topic,
    weight: 5, // baseline weight for explicitly chosen interests
  }));

  const { error } = await supabase
    .from("user_interests")
    .upsert(rows, { onConflict: "user_id,topic" });

  if (error) return { error: error.message };
  return {};
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
