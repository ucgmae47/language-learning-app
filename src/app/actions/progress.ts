"use server";

import { createClient } from "@/lib/supabase/server";

type ProgressStats = {
  profile: {
    display_name: string;
    streak_count: number;
    stories_read: number;
    cefr_level: string;
  };
  storyAttempts: { count: number; avg_score: number };
  journalEntries: { count: number };
  sentenceAttempts: { count: number; correct: number };
  vocabStats: { total: number; mastered: number };
  recentActivity: { date: string; label: string; emoji: string }[];
};

export async function getProgressStats(): Promise<ProgressStats | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const [
    profileResult,
    storyAttemptsResult,
    journalResult,
    sentenceResult,
    vocabResult,
    recentStoriesResult,
    recentJournalResult,
    recentSentenceResult,
  ] = await Promise.all([
    supabase
      .from("profiles")
      .select("display_name, streak_count, stories_read, cefr_level")
      .eq("id", user.id)
      .single<{
        display_name: string | null;
        streak_count: number;
        stories_read: number;
        cefr_level: string;
      }>(),
    supabase
      .from("story_attempts")
      .select("score")
      .eq("user_id", user.id)
      .returns<{ score: number }[]>(),
    supabase
      .from("journal_entries")
      .select("id", { count: "exact" })
      .eq("user_id", user.id),
    supabase
      .from("sentence_attempts")
      .select("correct")
      .eq("user_id", user.id)
      .returns<{ correct: boolean }[]>(),
    supabase
      .from("vocabulary_cards")
      .select("interval_days")
      .eq("user_id", user.id)
      .returns<{ interval_days: number }[]>(),
    supabase
      .from("story_attempts")
      .select("completed_at")
      .eq("user_id", user.id)
      .order("completed_at", { ascending: false })
      .limit(5)
      .returns<{ completed_at: string }[]>(),
    supabase
      .from("journal_entries")
      .select("created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(3)
      .returns<{ created_at: string }[]>(),
    supabase
      .from("sentence_attempts")
      .select("created_at, correct")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(5)
      .returns<{ created_at: string; correct: boolean }[]>(),
  ]);

  const profile = profileResult.data;
  const attempts = storyAttemptsResult.data ?? [];
  const sentences = sentenceResult.data ?? [];
  const vocab = vocabResult.data ?? [];

  const avgScore =
    attempts.length > 0
      ? Math.round(attempts.reduce((sum, a) => sum + a.score, 0) / attempts.length)
      : 0;

  const correctSentences = sentences.filter((s) => s.correct).length;
  const vocabMastered = vocab.filter((v) => v.interval_days >= 21).length;

  // Build recent activity list (last 10 actions)
  const activity: { date: string; label: string; emoji: string }[] = [];

  for (const s of recentStoriesResult.data ?? []) {
    activity.push({ date: s.completed_at, label: "Completed a story quiz", emoji: "📖" });
  }
  for (const j of recentJournalResult.data ?? []) {
    activity.push({ date: j.created_at, label: "Wrote a journal entry", emoji: "📝" });
  }
  for (const sa of recentSentenceResult.data ?? []) {
    activity.push({
      date: sa.created_at,
      label: sa.correct ? "Correct sentence" : "Sentence attempt",
      emoji: sa.correct ? "✅" : "✏️",
    });
  }

  activity.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return {
    profile: {
      display_name: profile?.display_name ?? "Learner",
      streak_count: profile?.streak_count ?? 0,
      stories_read: profile?.stories_read ?? 0,
      cefr_level: profile?.cefr_level ?? "A1",
    },
    storyAttempts: { count: attempts.length, avg_score: avgScore },
    journalEntries: { count: journalResult.count ?? 0 },
    sentenceAttempts: { count: sentences.length, correct: correctSentences },
    vocabStats: { total: vocab.length, mastered: vocabMastered },
    recentActivity: activity.slice(0, 10),
  };
}
