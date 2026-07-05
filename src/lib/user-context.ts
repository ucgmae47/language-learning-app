/**
 * Unified learner context builder.
 *
 * Aggregates every interest and preference signal from across the app into a
 * single structured object.  The `contextString` field is a pre-formatted
 * block that can be injected verbatim into any AI prompt so the model always
 * has a consistent view of who the learner is.
 *
 * Signal sources (all read in parallel):
 *   1. user_interests        – explicit topics selected during onboarding
 *   2. genre_interests       – behavioural genre weights from stories, music, etc.
 *   3. music_likes           – liked songs → genre and artist preferences
 *   4. stories               – recent topics read (recency awareness)
 *   5. profiles              – CEFR level, language (passed in, not re-fetched)
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type { CefrLevel, Language } from "@/lib/supabase/types";

export type UserContext = {
  language: Language;
  cefrLevel: CefrLevel;
  displayName: string;
  /** Topics explicitly selected during onboarding (food, travel, …) */
  explicitInterests: string[];
  /** Genres / topics the user gravitates toward based on behaviour */
  topBehavioralGenres: string[];
  /** Music genres the user has liked */
  likedMusicGenres: string[];
  /** Artists the user has liked */
  likedArtists: string[];
  /** Topics from the last few stories they read (for variety + relevance) */
  recentStoryTopics: string[];
  /**
   * Pre-formatted multi-line block ready to insert into any AI prompt.
   * Empty string when there is not enough data to build context yet.
   */
  contextString: string;
};

export async function getUserContext(
  // Accepts any Supabase client — works with both session and service-role clients.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: SupabaseClient<any>,
  userId: string,
  language: Language,
  cefrLevel: CefrLevel,
  displayName: string,
): Promise<UserContext> {
  const [interestsRes, genreRes, musicRes, storiesRes] = await Promise.all([
    // 1. Explicit onboarding interests
    supabase
      .from("user_interests")
      .select("topic, weight")
      .eq("user_id", userId)
      .order("weight", { ascending: false })
      .limit(6),

    // 2. Behavioural genre weights (covers story genres AND music genres
    //    once music signals are written here too)
    supabase
      .from("genre_interests")
      .select("genre, weight")
      .eq("user_id", userId)
      .eq("language", language)
      .order("weight", { ascending: false })
      .limit(10),

    // 3. Recent liked songs
    supabase
      .from("music_likes")
      .select("genre, artist")
      .eq("user_id", userId)
      .eq("language", language)
      .eq("liked", true)
      .order("created_at", { ascending: false })
      .limit(12),

    // 4. Recent story topics
    supabase
      .from("stories")
      .select("topics")
      .eq("user_id", userId)
      .eq("is_queued", false)
      .order("created_at", { ascending: false })
      .limit(5),
  ]);

  // ── Explicit interests ─────────────────────────────────────────────────────
  const explicitInterests = (interestsRes.data ?? []).map(
    (r: { topic: string }) => r.topic,
  );

  // ── Behavioural genres ─────────────────────────────────────────────────────
  const topBehavioralGenres = (genreRes.data ?? []).map(
    (r: { genre: string }) => r.genre,
  );

  // ── Music preferences ──────────────────────────────────────────────────────
  const genreSet = new Set<string>();
  const artistSet = new Set<string>();
  for (const row of musicRes.data ?? []) {
    if (row.genre) genreSet.add(row.genre as string);
    if (row.artist) artistSet.add(row.artist as string);
  }
  const likedMusicGenres = [...genreSet].slice(0, 5);
  const likedArtists = [...artistSet].slice(0, 5);

  // ── Recent story topics ────────────────────────────────────────────────────
  const recentStoryTopics = [
    ...new Set(
      (storiesRes.data ?? []).flatMap(
        (s: { topics: string[] }) => s.topics ?? [],
      ),
    ),
  ].slice(0, 8);

  // ── Build the AI-ready context string ─────────────────────────────────────
  const lines: string[] = [];

  if (explicitInterests.length > 0) {
    lines.push(
      `• Stated interests: ${explicitInterests.join(", ")}`,
    );
  }

  if (topBehavioralGenres.length > 0) {
    lines.push(
      `• Favourite genres/styles (learned from behaviour): ${topBehavioralGenres.slice(0, 6).join(", ")}`,
    );
  }

  const musicParts: string[] = [];
  if (likedMusicGenres.length > 0)
    musicParts.push(`genres — ${likedMusicGenres.join(", ")}`);
  if (likedArtists.length > 0)
    musicParts.push(`artists — ${likedArtists.join(", ")}`);
  if (musicParts.length > 0) {
    lines.push(`• Music taste: ${musicParts.join("; ")}`);
  }

  if (recentStoryTopics.length > 0) {
    lines.push(
      `• Recently read about: ${recentStoryTopics.join(", ")}`,
    );
  }

  const contextString =
    lines.length > 0
      ? `LEARNER PROFILE — use this to personalise every response:\n${lines.join("\n")}`
      : "";

  return {
    language,
    cefrLevel,
    displayName,
    explicitInterests,
    topBehavioralGenres,
    likedMusicGenres,
    likedArtists,
    recentStoryTopics,
    contextString,
  };
}
