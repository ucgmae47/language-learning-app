import type { SupabaseClient } from "@supabase/supabase-js";
import type { Language } from "@/lib/supabase/types";

// ── Candidate genre pool ────────────────────────────────────────────────────
// Superset of the UI genre chips plus a few extras that get discovered via
// exploration. All lowercase for consistent DB matching.
const ALL_GENRES = [
  "fantasy",
  "mystery",
  "horror",
  "romance",
  "adventure",
  "science fiction",
  "history",
  "news",
  "food & culture",
  "travel",
  "sports",
  "nature",
  "thriller",
  "comedy",
  "drama",
];

// ── Recency multipliers ─────────────────────────────────────────────────────
// story_position[0] = most recent story. Heavy penalty for topics that just
// appeared; the penalty fades across the next 4 stories.
const RECENCY_PENALTY_BY_POSITION = [0.15, 0.35, 0.55, 0.75, 0.9];

// ── Epsilon for exploration ─────────────────────────────────────────────────
// 15 % of the time we randomly select a topic from the lower half of the
// ranked list — this prevents the engine from converging on a single genre.
const EPSILON = 0.15;

type GenreScore = { genre: string; score: number };

/**
 * Builds a personalised genre and topic selection for story pre-generation.
 *
 * Algorithm (in order of priority):
 * 1. Start with each genre's behavioural interest weight from `genre_interests`
 *    (or a default of 1 for genres that have never been seen).
 * 2. Apply a recency penalty to genres that featured in the user's last 5
 *    stories so we never serve the same genre back-to-back.
 * 3. Use ε-greedy selection:
 *    - 85 % exploitation — pick randomly from the top-3 scored genres.
 *    - 15 % exploration  — pick randomly from the lower half of the list.
 *
 * Returns:
 * - `primaryGenre`   – the genre to centre the story around (passed as
 *                      selectedTopic to buildStoryPrompt).
 * - `secondaryGenre` – a supporting genre hint (passed as topGenres[0]).
 * - `interestTopics` – the user's onboarding interest topics for the prompt.
 * - `reasoning`      – a human-readable explanation shown in the "ready" card.
 */
export async function buildPersonalizedTopics(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: SupabaseClient<any>,
  userId: string,
  language: Language,
): Promise<{
  primaryGenre: string;
  secondaryGenre: string | null;
  interestTopics: string[];
  reasoning: string;
}> {
  const [genreRes, interestRes, recentStoriesRes] = await Promise.all([
    supabase
      .from("genre_interests")
      .select("genre, weight")
      .eq("user_id", userId)
      .eq("language", language)
      .order("weight", { ascending: false }),

    supabase
      .from("user_interests")
      .select("topic")
      .eq("user_id", userId)
      .order("weight", { ascending: false })
      .limit(5),

    // Exclude queued stories so they don't skew the recency window.
    supabase
      .from("stories")
      .select("topics")
      .eq("user_id", userId)
      .eq("is_queued", false)
      .order("created_at", { ascending: false })
      .limit(5),
  ]);

  // ── Build genre-weight lookup ──────────────────────────────────────────────
  const weightMap = new Map<string, number>();
  for (const row of genreRes.data ?? []) {
    weightMap.set((row.genre as string).toLowerCase(), row.weight as number);
  }

  // ── Build recency-penalty lookup ───────────────────────────────────────────
  // If the same genre appears in multiple recent stories, keep the strongest
  // (i.e. lowest) multiplier.
  const recencyMap = new Map<string, number>();
  const recentStories = (recentStoriesRes.data ?? []) as { topics: string[] }[];
  for (let i = 0; i < recentStories.length; i++) {
    const penalty = RECENCY_PENALTY_BY_POSITION[i] ?? 0.9;
    const story = recentStories[i];
    for (const topic of story?.topics ?? []) {
      const key = topic.toLowerCase();
      const current = recencyMap.get(key) ?? 1.0;
      recencyMap.set(key, Math.min(current, penalty));
    }
  }

  // ── Score every candidate genre ────────────────────────────────────────────
  const scores: GenreScore[] = ALL_GENRES.map((genre) => {
    const base = weightMap.get(genre) ?? 1.0;
    const recency = recencyMap.get(genre) ?? 1.0;
    return { genre, score: base * recency };
  });

  scores.sort((a, b) => b.score - a.score);

  // ── ε-greedy selection for primary genre ──────────────────────────────────
  let primaryGenre: string;
  if (Math.random() < EPSILON) {
    // Explore: random pick from the lower 2/3 of the list.
    const explorationPool = scores.slice(Math.floor(scores.length / 3));
    const exploredItem =
      explorationPool[Math.floor(Math.random() * explorationPool.length)];
    primaryGenre = exploredItem?.genre ?? scores[0]?.genre ?? ALL_GENRES[0]!;
  } else {
    // Exploit: random pick from the top 3 (adds slight variety within the best).
    const topPool = scores.slice(0, 3);
    const exploitedItem = topPool[Math.floor(Math.random() * topPool.length)];
    primaryGenre = exploitedItem?.genre ?? ALL_GENRES[0]!;
  }

  // Secondary genre: highest-scored genre that differs from primary.
  const secondaryGenre =
    scores.find((s) => s.genre !== primaryGenre)?.genre ?? null;

  // ── Assemble interest topics ───────────────────────────────────────────────
  const interestTopics = (interestRes.data ?? []).map(
    (r: { topic: string }) => r.topic,
  );

  // ── Build reasoning string for UI ─────────────────────────────────────────
  const primaryWeight = weightMap.get(primaryGenre) ?? 0;
  const parts: string[] = [];

  if (primaryWeight >= 3) {
    parts.push(`your interest in ${primaryGenre}`);
  }
  if (interestTopics.length > 0) {
    parts.push(interestTopics.slice(0, 2).join(" & "));
  }
  if (parts.length === 0) {
    parts.push("your profile");
  }

  const reasoning =
    `Prepared for you based on ${parts.join(" and ")}` +
    (recencyMap.has(primaryGenre)
      ? ` (variety pick — something a little different!)`
      : "");

  return { primaryGenre, secondaryGenre, interestTopics, reasoning };
}
