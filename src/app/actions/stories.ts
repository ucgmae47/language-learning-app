"use server";

import { after } from "next/server";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { generateQueuedStory } from "@/lib/stories/queue";
import { isPersonalStoryQueueEnabled } from "@/lib/stories/personal-queue-enabled";
import { insertEvent } from "@/lib/events/log-event";
import { normalizeStoryGenre, WEIGHTS } from "@/lib/events/taxonomy";
import { aggregateTopicScores } from "@/lib/events/aggregate";
import { markDailyActivity } from "@/lib/streak/track";
import type { CefrLevel, Language } from "@/lib/supabase/types";

export type AttemptResult = {
  error?: string;
};

export type ProgressResult = {
  error?: string;
};

/**
 * Upserts reading progress so the library can show % read and recommend a next story.
 */
export async function saveStoryProgress(
  storyId: string,
  percentRead: number,
  sentenceIndex: number,
  finished: boolean,
): Promise<ProgressResult> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Not authenticated." };

  const percent = Math.max(0, Math.min(100, Math.round(percentRead)));
  const index = Math.max(0, Math.floor(sentenceIndex));

  const { error } = await supabase.from("story_progress").upsert(
    {
      user_id: user.id,
      story_id: storyId,
      percent_read: percent,
      sentence_index: index,
      finished,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id,story_id", ignoreDuplicates: false },
  );

  if (error) return { error: error.message };

  // Reading a story counts as activity for the daily streak. This action runs
  // on a 400ms debounce per sentence, so the bookkeeping goes after the
  // response — it must never add latency to the reader.
  after(async () => {
    await markDailyActivity(supabase, user.id);
  });

  return {};
}

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

  // ── Behavioural interest engine: record quiz-completion signal ───────────
  const storyTopics: string[] = storyResult.data?.topics ?? [];
  const language: Language = profileResult.data?.language ?? "es";

  for (const genre of storyTopics) {
    const canonical = normalizeStoryGenre(genre);
    if (!canonical) continue;

    const bonusPoints = score >= 4 ? WEIGHTS.STORY_QUIZ_BONUS * (score - 2) : 0;
    void insertEvent(supabase, user.id, {
      language,
      source: "story",
      event_type: "quiz_completed",
      topic: canonical,
      raw_topic: genre,
      weight: WEIGHTS.STORY_QUIZ_COMPLETED + bonusPoints,
    });
  }

  // Finishing a quiz is activity too. Kept as its own `after()` callback so it
  // is independent of the topic-score aggregation below.
  after(async () => {
    await markDailyActivity(supabase, user.id);
  });

  after(async () => {
    await aggregateTopicScores(user.id, language);
  });

  return {};
}

/**
 * Marks a pre-queued story as consumed and schedules generation of the next
 * queued story in the background (after the action response is sent).
 *
 * Called from the StoryGenerator "Your story is ready!" card.
 */
export async function consumeQueuedStory(storyId: string): Promise<void> {
  if (!isPersonalStoryQueueEnabled()) return;

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return;

  const { error } = await supabase
    .from("stories")
    .update({ is_queued: false })
    .eq("id", storyId)
    .eq("user_id", user.id)
    .eq("is_queued", true);

  if (error) {
    console.error("[consumeQueuedStory] Failed to mark consumed:", error.message);
    return;
  }

  // So returning to /stories never shows this story as "ready" again.
  revalidatePath("/stories");

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
      // New queued story is ready — refresh the list for the next visit.
      revalidatePath("/stories");
    }
  });
}

