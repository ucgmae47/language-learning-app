"use server";

import { after } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { insertEvent } from "@/lib/events/log-event";
import { musicGenreToCanonical, WEIGHTS } from "@/lib/events/taxonomy";
import { aggregateTopicScores } from "@/lib/events/aggregate";
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

  // ── Propagate signal into the behavioural interest engine ─────────────────
  // Music likes/dislikes go through the event log so anti-binge rules apply
  // and the topic only promotes to genre_interests once a pattern is confirmed.
  const canonical = musicGenreToCanonical();
  void insertEvent(supabase, user.id, {
    language,
    source: "music",
    event_type: liked ? "song_liked" : "song_disliked",
    topic: canonical,
    raw_topic: genre ?? "music",
    weight: liked ? WEIGHTS.MUSIC_SONG_LIKED : WEIGHTS.MUSIC_SONG_DISLIKED,
  });

  const userId = user.id;
  after(async () => {
    await aggregateTopicScores(userId, language);
  });

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
