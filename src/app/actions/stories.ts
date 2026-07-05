"use server";

import { after } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { updateGenreInterest } from "@/app/actions/interests";
import { generateQueuedStory } from "@/lib/stories/queue";
import type { CefrLevel, Language } from "@/lib/supabase/types";

export type AttemptResult = {
  error?: string;
};

export async function saveStoryAttempt(
  storyId: string,
  score: number,
  answers: Record<number, string>,
): Promise<AttemptResult> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Not authenticated." };

  const today = new Date().toISOString().slice(0, 10);

  // Fetch the story's topics and the user's active language in parallel with
  // the write operations so we can update genre interests afterwards.
  const [attemptResult, storyResult, profileResult] = await Promise.all([
    supabase.from("story_attempts").upsert(
      { user_id: user.id, story_id: storyId, score, answers },
      { onConflict: "user_id,story_id", ignoreDuplicates: false },
    ),

    supabase
      .from("stories")
      .select("topics")
      .eq("id", storyId)
      .single<{ topics: string[] }>(),

    supabase
      .from("profiles")
      .select("language")
      .eq("id", user.id)
      .single<{ language: Language }>(),

    supabase.rpc("increment_stories_read", { uid: user.id }),

    supabase
      .from("session_metrics")
      .upsert(
        {
          user_id: user.id,
          date: today,
          stories_read: 1,
          quiz_score_avg: (score / 5) * 100,
          drills_completed: 0,
          chat_turns: 0,
          minutes_active: 0,
        },
        { onConflict: "user_id,date", ignoreDuplicates: false },
      ),
  ]);

  if (attemptResult.error) {
    return { error: attemptResult.error.message };
  }

  // ── Behavioural interest graph: record quiz-completion signal ────────────
  // +1 for completing the quiz; +1 bonus if score ≥ 4/5.
  const storyTopics: string[] = storyResult.data?.topics ?? [];
  const language: Language = profileResult.data?.language ?? "es";
  const bonusDelta = score >= 4 ? 1 : 0;

  for (const genre of storyTopics) {
    void updateGenreInterest(genre, 1 + bonusDelta, language);
  }

  return {};
}

/**
 * Marks a pre-queued story as consumed and schedules generation of the next
 * queued story in the background (after the action response is sent).
 *
 * Called from the StoryGenerator "Your story is ready!" card.
 */
export async function consumeQueuedStory(storyId: string): Promise<void> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return;

  await supabase
    .from("stories")
    .update({ is_queued: false })
    .eq("id", storyId)
    .eq("user_id", user.id);

  // Kick off the next pre-generation after this action completes.
  after(async () => {
    const service = createServiceClient();
    const { data: profile } = await service
      .from("profiles")
      .select("language, cefr_level")
      .eq("id", user.id)
      .single<{ language: Language; cefr_level: CefrLevel }>();

    if (profile) {
      await generateQueuedStory(user.id, profile.language, profile.cefr_level);
    }
  });
}

