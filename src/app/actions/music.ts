"use server";

import { createClient } from "@/lib/supabase/server";
import { updateGenreInterest } from "@/app/actions/interests";
import type { Language, MusicLike } from "@/lib/supabase/types";

export async function saveMusicLike(
  songTitle: string,
  artist: string,
  genre: string | null,
  youtubeId: string | null,
  liked: boolean,
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { data: profile } = await supabase
    .from("profiles")
    .select("language")
    .eq("id", user.id)
    .single();

  const language: Language = profile?.language ?? "es";

  const { error } = await supabase.from("music_likes").insert({
    user_id: user.id,
    language,
    song_title: songTitle,
    artist,
    genre: genre ?? null,
    youtube_id: youtubeId ?? null,
    liked,
  });

  if (error) return { error: error.message };

  // ── Propagate signal into the shared behavioural interest graph ────────────
  // Music genre preference feeds the same genre_interests table used by the
  // story recommendation engine and the AI context builder, so a user who
  // loves reggaeton will start seeing more music-culture stories and the
  // chatbot will reference those artists naturally.
  if (genre) {
    void updateGenreInterest(genre, liked ? 2 : -1, language);
  }

  return {};
}

export async function getLikedSongs(language: Language): Promise<MusicLike[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data } = await supabase
    .from("music_likes")
    .select("*")
    .eq("user_id", user.id)
    .eq("language", language)
    .order("created_at", { ascending: false })
    .returns<MusicLike[]>();

  return data ?? [];
}
