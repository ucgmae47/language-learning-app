"use client";

import { useState, useCallback, useTransition } from "react";
import {
  ThumbsUp,
  ThumbsDown,
  Shuffle,
  ChevronDown,
  ChevronUp,
  Music,
  ExternalLink,
  Loader2,
  MapPin,
  Calendar,
  Mic2,
} from "lucide-react";
import { saveMusicLike } from "@/app/actions/music";
import type { MusicRecommendation } from "@/app/api/music/recommend/route";
import type { Language, MusicLike } from "@/lib/supabase/types";

// ── Types ────────────────────────────────────────────────────────────────────

type LoadedSong = MusicRecommendation & {
  videoId: string | null;
  lyrics: string | null;
};

// ── Helpers ──────────────────────────────────────────────────────────────────

const LANG_META: Record<Language, { name: string; flag: string }> = {
  es: { name: "Spanish", flag: "🇪🇸" },
  fr: { name: "French", flag: "🇫🇷" },
};

function youtubeSearchUrl(title: string, artist: string) {
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(`${artist} ${title} official`)}`;
}

// ── Loading skeleton ─────────────────────────────────────────────────────────

function LoadingSkeleton() {
  return (
    <div className="flex flex-col gap-4 animate-pulse">
      <div className="aspect-video w-full rounded-2xl bg-white/5" />
      <div className="h-7 w-2/3 rounded-lg bg-white/5" />
      <div className="h-4 w-1/3 rounded-lg bg-white/5" />
      <div className="h-20 w-full rounded-xl bg-white/5" />
      <div className="flex gap-3">
        <div className="h-12 flex-1 rounded-2xl bg-white/5" />
        <div className="h-12 flex-1 rounded-2xl bg-white/5" />
        <div className="h-12 flex-1 rounded-2xl bg-white/5" />
      </div>
    </div>
  );
}

// ── Collapsible section ───────────────────────────────────────────────────────

function CollapsibleSection({
  title,
  icon,
  children,
  defaultOpen = false,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="rounded-2xl border border-white/8 bg-white/3 overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between px-4 py-3 text-left transition hover:bg-white/4"
      >
        <div className="flex items-center gap-2">
          {icon}
          <span className="text-sm font-bold text-white">{title}</span>
        </div>
        {open ? (
          <ChevronUp className="h-4 w-4 text-slate-500" />
        ) : (
          <ChevronDown className="h-4 w-4 text-slate-500" />
        )}
      </button>
      {open && <div className="border-t border-white/8 px-4 py-4">{children}</div>}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

type Props = {
  language: Language;
  cefrLevel: string;
  initialLikes: MusicLike[];
};

export function MusicPlayer({ language, cefrLevel, initialLikes }: Props) {
  const meta = LANG_META[language];

  // Derive liked/seen from initial data
  const [likedSongs, setLikedSongs] = useState<{ title: string; artist: string }[]>(
    initialLikes.filter((l) => l.liked).map((l) => ({ title: l.song_title, artist: l.artist })),
  );
  const [seenSongs, setSeenSongs] = useState<{ title: string; artist: string }[]>(
    initialLikes.map((l) => ({ title: l.song_title, artist: l.artist })),
  );

  const [song, setSong] = useState<LoadedSong | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPendingSave, startSave] = useTransition();

  const fetchSong = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // 1. Get AI recommendation
      const recRes = await fetch("/api/music/recommend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ language, cefrLevel, likedSongs, seenSongs }),
      });
      if (!recRes.ok) throw new Error("Failed to fetch recommendation");
      const rec = await recRes.json() as MusicRecommendation;

      // 2. Fetch YouTube video ID + lyrics in parallel
      const [ytRes, lyricsRes] = await Promise.all([
        fetch(`/api/music/youtube?q=${encodeURIComponent(`${rec.artist} ${rec.title} official music video`)}`),
        fetch(`/api/music/lyrics?artist=${encodeURIComponent(rec.artist)}&title=${encodeURIComponent(rec.title)}`),
      ]);

      const { videoId } = (await ytRes.json()) as { videoId: string | null };
      const { lyrics } = (await lyricsRes.json()) as { lyrics: string | null };

      setSong({ ...rec, videoId, lyrics });

      // Track this song as seen
      setSeenSongs((prev) => {
        const key = `${rec.title}|${rec.artist}`;
        if (prev.some((s) => `${s.title}|${s.artist}` === key)) return prev;
        return [...prev, { title: rec.title, artist: rec.artist }];
      });
    } catch (err) {
      console.error(err);
      setError("Couldn't load a recommendation. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, [language, cefrLevel, likedSongs, seenSongs]);

  function handleReaction(liked: boolean) {
    if (!song || isPendingSave) return;
    const { title, artist, genre, videoId } = song;

    startSave(async () => {
      await saveMusicLike(title, artist, genre, videoId, liked);
      if (liked) {
        setLikedSongs((prev) => {
          const key = `${title}|${artist}`;
          if (prev.some((s) => `${s.title}|${s.artist}` === key)) return prev;
          return [...prev, { title, artist }];
        });
      }
      // Fetch next song automatically after reacting
      void fetchSong();
    });
  }

  // Initial empty state
  if (!song && !isLoading && !error) {
    return (
      <div className="flex flex-col items-center justify-center gap-5 rounded-3xl border border-dashed border-white/10 py-24 text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-pink-500 to-rose-600 shadow-xl shadow-pink-500/30">
          <Music className="h-9 w-9 text-white" aria-hidden="true" />
        </div>
        <div>
          <p className="text-xl font-extrabold text-white">
            {meta.flag} {meta.name} Music
          </p>
          <p className="mt-1 max-w-xs text-sm text-slate-400">
            Discover songs at your level with lyrics, fun facts, and vocabulary
            highlights.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void fetchSong()}
          className="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-pink-500 to-rose-600 px-8 py-3 text-base font-bold text-white shadow-lg shadow-pink-500/30 transition hover:scale-105"
        >
          <Music className="h-5 w-5" aria-hidden="true" />
          Get My First Song
        </button>
        {likedSongs.length > 0 && (
          <p className="text-xs text-slate-500">
            {likedSongs.length} song{likedSongs.length !== 1 ? "s" : ""} liked ·
            Recommendations are personalised
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Error */}
      {error && (
        <div className="flex items-center justify-between gap-3 rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3">
          <p className="text-sm text-red-400">{error}</p>
          <button
            type="button"
            onClick={() => void fetchSong()}
            className="shrink-0 rounded-xl bg-red-500/20 px-3 py-1.5 text-xs font-bold text-red-300 transition hover:bg-red-500/30"
          >
            Retry
          </button>
        </div>
      )}

      {isLoading ? (
        <LoadingSkeleton />
      ) : song ? (
        <>
          {/* ── YouTube embed ─────────────────────────────────────────── */}
          {song.videoId ? (
            <div className="overflow-hidden rounded-2xl shadow-xl shadow-black/40">
              <div className="relative aspect-video w-full">
                <iframe
                  src={`https://www.youtube-nocookie.com/embed/${song.videoId}?rel=0&modestbranding=1`}
                  title={`${song.title} — ${song.artist}`}
                  className="absolute inset-0 h-full w-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            </div>
          ) : (
            <a
              href={youtubeSearchUrl(song.title, song.artist)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex aspect-video w-full items-center justify-center gap-3 rounded-2xl border border-white/10 bg-white/4 transition hover:bg-white/6"
            >
              <div className="text-center">
                <p className="text-5xl" aria-hidden="true">▶️</p>
                <p className="mt-2 text-sm font-semibold text-white">
                  Watch on YouTube
                </p>
                <p className="mt-0.5 flex items-center justify-center gap-1 text-xs text-slate-400">
                  <ExternalLink className="h-3 w-3" /> Opens in new tab
                </p>
              </div>
            </a>
          )}

          {/* ── Song info ─────────────────────────────────────────────── */}
          <div className="flex flex-col gap-1">
            <h2 className="text-2xl font-extrabold leading-tight text-white">
              {song.title}
            </h2>
            <div className="flex flex-wrap items-center gap-2 text-sm text-slate-400">
              <span className="flex items-center gap-1 font-semibold text-slate-200">
                <Mic2 className="h-3.5 w-3.5" aria-hidden="true" />
                {song.artist}
              </span>
              <span className="text-slate-600">·</span>
              <span className="rounded-lg bg-pink-500/20 px-2 py-0.5 text-xs font-semibold text-pink-300">
                {song.genre}
              </span>
              <span className="flex items-center gap-1 text-xs">
                <Calendar className="h-3 w-3" aria-hidden="true" />
                {song.year}
              </span>
              <span className="flex items-center gap-1 text-xs">
                <MapPin className="h-3 w-3" aria-hidden="true" />
                {song.country}
              </span>
            </div>
          </div>

          {/* ── Description + learning tip ────────────────────────────── */}
          <div className="rounded-2xl border border-white/8 bg-white/3 px-4 py-4">
            <p className="text-sm leading-relaxed text-slate-300">{song.description}</p>
            <div className="mt-3 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-3 py-2.5">
              <p className="text-xs font-bold text-emerald-400">
                📚 Why it&apos;s great for {meta.name} learners ({cefrLevel})
              </p>
              <p className="mt-1 text-xs leading-relaxed text-emerald-200/80">
                {song.why_good_for_learning}
              </p>
            </div>
          </div>

          {/* ── Fun facts ─────────────────────────────────────────────── */}
          <CollapsibleSection
            title="Fun Facts"
            icon={<span className="text-base" aria-hidden="true">✨</span>}
            defaultOpen
          >
            <ul className="flex flex-col gap-2.5">
              {song.fun_facts.map((fact, i) => (
                <li key={i} className="flex gap-2 text-sm text-slate-300">
                  <span className="mt-0.5 shrink-0 text-base" aria-hidden="true">
                    {["🎸", "🎤", "🌟"][i % 3]}
                  </span>
                  {fact}
                </li>
              ))}
            </ul>
          </CollapsibleSection>

          {/* ── Lyrics ────────────────────────────────────────────────── */}
          <CollapsibleSection
            title="Lyrics"
            icon={<span className="text-base" aria-hidden="true">🎤</span>}
            defaultOpen
          >
            {/* Full lyrics from lyrics.ovh if available, else AI excerpt */}
            {song.lyrics ? (
              <pre className="max-h-80 overflow-y-auto whitespace-pre-wrap font-sans text-sm leading-7 text-slate-200">
                {song.lyrics.trim()}
              </pre>
            ) : (
              <>
                <p className="mb-2 text-xs text-slate-500">
                  Featured excerpt (full lyrics may vary):
                </p>
                <pre className="whitespace-pre-wrap font-sans text-sm leading-7 italic text-slate-200">
                  {song.featured_lyrics}
                </pre>
                <a
                  href={`https://genius.com/search?q=${encodeURIComponent(`${song.artist} ${song.title}`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 flex items-center gap-1 text-xs text-slate-500 transition hover:text-slate-300"
                >
                  <ExternalLink className="h-3 w-3" />
                  Find full lyrics on Genius
                </a>
              </>
            )}
          </CollapsibleSection>

          {/* ── Vocabulary ────────────────────────────────────────────── */}
          <CollapsibleSection
            title="Vocabulary"
            icon={<span className="text-base" aria-hidden="true">📖</span>}
            defaultOpen
          >
            <pre className="whitespace-pre-wrap font-sans text-sm leading-7 text-slate-300">
              {song.vocabulary_notes}
            </pre>
          </CollapsibleSection>

          {/* ── Actions ───────────────────────────────────────────────── */}
          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={() => handleReaction(true)}
              disabled={isPendingSave || isLoading}
              className="flex flex-1 items-center justify-center gap-2 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 py-3 text-sm font-bold text-emerald-400 transition hover:bg-emerald-500/20 active:scale-95 disabled:opacity-50"
            >
              <ThumbsUp className="h-4 w-4" aria-hidden="true" />
              Like
            </button>
            <button
              type="button"
              onClick={() => handleReaction(false)}
              disabled={isPendingSave || isLoading}
              className="flex flex-1 items-center justify-center gap-2 rounded-2xl border border-rose-500/30 bg-rose-500/10 py-3 text-sm font-bold text-rose-400 transition hover:bg-rose-500/20 active:scale-95 disabled:opacity-50"
            >
              <ThumbsDown className="h-4 w-4" aria-hidden="true" />
              Not for me
            </button>
            <button
              type="button"
              onClick={() => void fetchSong()}
              disabled={isLoading || isPendingSave}
              className="flex flex-1 items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 py-3 text-sm font-bold text-slate-300 transition hover:bg-white/10 active:scale-95 disabled:opacity-50"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              ) : (
                <Shuffle className="h-4 w-4" aria-hidden="true" />
              )}
              New Song
            </button>
          </div>

          {/* Liked count */}
          {likedSongs.length > 0 && (
            <p className="text-center text-xs text-slate-600">
              ❤️ {likedSongs.length} song{likedSongs.length !== 1 ? "s" : ""} liked ·
              Recommendations update as you listen
            </p>
          )}
        </>
      ) : null}
    </div>
  );
}
