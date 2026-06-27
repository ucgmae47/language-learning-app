"use server";

import { createClient } from "@/lib/supabase/server";

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

  // Persist the attempt, increment stories_read on the profile, and
  // upsert today's session metric row — all in parallel.
  const [attemptResult] = await Promise.all([
    supabase.from("story_attempts").upsert(
      { user_id: user.id, story_id: storyId, score, answers },
      { onConflict: "user_id,story_id", ignoreDuplicates: false },
    ),

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

  return {};
}

