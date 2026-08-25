import type { CefrLevel } from "@/lib/supabase/types";

const CEFR_ORDER: CefrLevel[] = ["A1", "A2", "B1", "B2", "C1", "C2"];

function levelDistance(a: CefrLevel, b: CefrLevel): number {
  return Math.abs(CEFR_ORDER.indexOf(a) - CEFR_ORDER.indexOf(b));
}

function interestScore(
  topics: string[],
  genreWeights: Map<string, number>,
): number {
  return topics.reduce(
    (max, topic) => Math.max(max, genreWeights.get(topic) ?? 0),
    0,
  );
}

export type StoryProgressSummary = {
  story_id: string;
  percent_read: number;
  finished: boolean;
  updated_at: string;
};

export type StoryAttemptSummary = {
  story_id: string;
  score: number;
};

export type RecommendableStory = {
  id: string;
  title: string;
  cefr_level: CefrLevel;
  topics: string[];
  word_count: number | null;
  created_at: string;
};

export type RecommendedStory = RecommendableStory & {
  reason: "continue" | "quiz" | "next";
  percent_read: number;
};

/**
 * Picks the next library story to nudge the learner toward.
 * Priority: in-progress reads → finished but no quiz → unstarted at level → any unstarted.
 */
export function pickNextRecommendedStory(
  stories: RecommendableStory[],
  progressByStory: Map<string, StoryProgressSummary>,
  attemptByStory: Map<string, StoryAttemptSummary>,
  userCefrLevel: CefrLevel,
  genreWeights: Map<string, number> = new Map(),
): RecommendedStory | null {
  if (stories.length === 0) return null;

  const byId = new Map(stories.map((s) => [s.id, s]));

  // 1. Most recently updated in-progress read (opened but not finished).
  const inProgress = [...progressByStory.values()]
    .filter((p) => byId.has(p.story_id) && !p.finished && p.percent_read > 0 && p.percent_read < 100)
    .sort((a, b) => b.updated_at.localeCompare(a.updated_at));

  const continueStory = inProgress[0];
  if (continueStory) {
    const story = byId.get(continueStory.story_id)!;
    return {
      ...story,
      reason: "continue",
      percent_read: continueStory.percent_read,
    };
  }

  // 2. Finished reading but no quiz attempt yet.
  const awaitingQuiz = [...progressByStory.values()]
    .filter(
      (p) =>
        byId.has(p.story_id) &&
        (p.finished || p.percent_read >= 100) &&
        !attemptByStory.has(p.story_id),
    )
    .sort((a, b) => b.updated_at.localeCompare(a.updated_at));

  const quizStory = awaitingQuiz[0];
  if (quizStory) {
    const story = byId.get(quizStory.story_id)!;
    return {
      ...story,
      reason: "quiz",
      percent_read: quizStory.percent_read,
    };
  }

  // 3. Unstarted stories, ranked closest-level-first then by interest.
  const ranked = rankUnstartedStories(
    stories,
    progressByStory,
    attemptByStory,
    userCefrLevel,
    genreWeights,
  );
  const pick = ranked[0];
  if (!pick) return null;

  return {
    ...pick,
    reason: "next",
    percent_read: 0,
  };
}

/**
 * Full queue of unstarted stories, best match first: closest CEFR level to
 * the learner, then highest interest-genre weight, then most recent. Used
 * both for pickNextRecommendedStory's step 3 and for "skip to next" in the
 * story-first focus view, so skipping cycles through real alternatives
 * instead of jumping back to array order (which always lands on A1).
 */
export function rankUnstartedStories(
  stories: RecommendableStory[],
  progressByStory: Map<string, StoryProgressSummary>,
  attemptByStory: Map<string, StoryAttemptSummary>,
  userCefrLevel: CefrLevel,
  genreWeights: Map<string, number> = new Map(),
): RecommendableStory[] {
  const unstarted = stories.filter((s) => {
    const progress = progressByStory.get(s.id);
    if (progress && (progress.finished || progress.percent_read > 0)) return false;
    if (attemptByStory.has(s.id)) return false;
    return true;
  });

  return [...unstarted].sort((a, b) => {
    const distDiff =
      levelDistance(a.cefr_level, userCefrLevel) -
      levelDistance(b.cefr_level, userCefrLevel);
    if (distDiff !== 0) return distDiff;

    const interestDiff =
      interestScore(b.topics, genreWeights) -
      interestScore(a.topics, genreWeights);
    if (interestDiff !== 0) return interestDiff;

    return b.created_at.localeCompare(a.created_at);
  });
}
