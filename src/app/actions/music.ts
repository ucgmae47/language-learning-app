"use server";

import { createClient } from "@/lib/supabase/server";
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
