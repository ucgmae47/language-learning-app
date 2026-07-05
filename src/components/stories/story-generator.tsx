"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, Loader2, AlertCircle, Clock, Zap, BookOpen } from "lucide-react";
import { consumeQueuedStory } from "@/app/actions/stories";
import type { Story } from "@/lib/supabase/types";

const TOPICS = [
  { id: "fantasy", label: "Fantasy" },
  { id: "mystery", label: "Mystery" },
  { id: "horror", label: "Horror" },
  { id: "romance", label: "Romance" },
  { id: "adventure", label: "Adventure" },
  { id: "science fiction", label: "Sci-Fi" },
  { id: "history", label: "History" },
  { id: "news", label: "News" },
  { id: "food & culture", label: "Food & Culture" },
  { id: "travel", label: "Travel" },
  { id: "sports", label: "Sports" },
  { id: "nature", label: "Nature" },
];

type ErrorState = {
  message: string;
  isRateLimit: boolean;
};

type Props = {
  queuedStory?: Pick<Story, "id" | "title" | "topics"> | null;
};

export function StoryGenerator({ queuedStory: initialQueuedStory }: Props) {
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<ErrorState | null>(null);
  // Optimistically hide the "ready" card as soon as the user taps it.
  const [queuedStory, setQueuedStory] = useState(initialQueuedStory ?? null);
  const router = useRouter();

  // ── Open the pre-queued story instantly ─────────────────────────────────────
  function handleOpenQueued() {
    if (!queuedStory) return;
    const id = queuedStory.id;
    setQueuedStory(null); // optimistic hide
    // Fire-and-forget: marks consumed + schedules next generation.
    void consumeQueuedStory(id);
    router.push(`/stories/${id}`);
  }

  // ── Generate on demand ────────────────────────────────────────────────────
  async function handleGenerate() {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/stories/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic: selectedTopic }),
      });

      let body: { storyId?: string; error?: string; fromQueue?: boolean } = {};
      try {
        body = (await res.json()) as typeof body;
      } catch {
        setError({
          message: `Server error (${res.status}). Please try again.`,
          isRateLimit: false,
        });
        return;
      }

      if (!res.ok || !body.storyId) {
        setError({
          message: body.error ?? "Something went wrong. Please try again.",
          isRateLimit: res.status === 429,
        });
        return;
      }

      // If we received a story from the queue, remove the "ready" card too.
      if (body.fromQueue) setQueuedStory(null);

      router.push(`/stories/${body.storyId}`);
    } catch {
      setError({
        message: "Network error. Please check your connection.",
        isRateLimit: false,
      });
    } finally {
      setLoading(false);
    }
  }

  const hasQueuedStory = !!queuedStory;

  return (
    <div className="flex flex-col gap-5">
      {/* ── Pre-queued story card ("Your story is ready!") ─────────────────── */}
      {hasQueuedStory && (
        <div className="relative overflow-hidden rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-emerald-500/10 via-teal-500/5 to-transparent p-4">
          {/* Decorative glow */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-emerald-500/10 blur-2xl"
          />

          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-500/20">
              <Zap className="h-5 w-5 text-emerald-400" aria-hidden="true" />
            </div>

            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                Your story is ready
              </p>
              <p className="mt-0.5 truncate font-bold text-white">
                {queuedStory.title}
              </p>
              {queuedStory.topics.length > 0 && (
                <p className="mt-1 text-xs text-slate-400">
                  Personalised for you · {queuedStory.topics.slice(0, 2).map((t) => (
                    <span key={t} className="capitalize">{t}</span>
                  )).reduce<React.ReactNode[]>((acc, el, i) => i === 0 ? [el] : [...acc, ", ", el], [])}
                </p>
              )}
            </div>

            <button
              type="button"
              onClick={handleOpenQueued}
              className="shrink-0 rounded-xl bg-emerald-500 px-4 py-2 text-sm font-bold text-white shadow-lg shadow-emerald-500/30 transition hover:bg-emerald-400 active:scale-95"
            >
              Read now
            </button>
          </div>
        </div>
      )}

      {/* ── Genre selector ─────────────────────────────────────────────────── */}
      <div>
        <p className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-400">
          {hasQueuedStory
            ? "Or pick a genre to generate a different story"
            : "Pick a genre (optional)"}
        </p>
        <div className="flex flex-wrap gap-2">
          {TOPICS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() =>
                setSelectedTopic((prev) => (prev === t.id ? null : t.id))
              }
              disabled={loading}
              className={`rounded-full border px-3 py-1 text-sm font-medium transition disabled:opacity-50 ${
                selectedTopic === t.id
                  ? "border-emerald-500 bg-emerald-600 text-white shadow-md shadow-emerald-500/30"
                  : "border-white/10 bg-white/5 text-slate-300 hover:border-emerald-500/40 hover:bg-white/10 hover:text-white"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Generate button ─────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-3">
        <button
          type="button"
          onClick={handleGenerate}
          disabled={loading}
          className={`inline-flex w-fit items-center gap-2 rounded-full px-5 py-2.5 text-sm font-bold text-white shadow-lg transition disabled:opacity-60 ${
            hasQueuedStory
              ? "bg-gradient-to-r from-slate-600 to-slate-700 shadow-slate-500/20 hover:from-slate-500 hover:to-slate-600"
              : "bg-gradient-to-r from-emerald-500 to-teal-600 shadow-emerald-500/30 hover:from-emerald-400 hover:to-teal-500"
          }`}
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              Generating your story…
            </>
          ) : (
            <>
              {hasQueuedStory ? (
                <BookOpen className="h-4 w-4" aria-hidden="true" />
              ) : (
                <Sparkles className="h-4 w-4" aria-hidden="true" />
              )}
              Generate new story
              {selectedTopic && (
                <span className="ml-1 opacity-80">
                  · {TOPICS.find((t) => t.id === selectedTopic)?.label}
                </span>
              )}
            </>
          )}
        </button>

        {/* Error banner */}
        {error && (
          <div
            className={`flex items-start gap-2.5 rounded-xl border px-4 py-3 text-sm ${
              error.isRateLimit
                ? "border-amber-500/20 bg-amber-500/10 text-amber-300"
                : "border-red-500/20 bg-red-500/10 text-red-400"
            }`}
          >
            {error.isRateLimit ? (
              <Clock className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            ) : (
              <AlertCircle
                className="mt-0.5 h-4 w-4 shrink-0"
                aria-hidden="true"
              />
            )}
            <div>
              <p className="font-semibold">
                {error.isRateLimit ? "AI rate limit reached" : "Generation failed"}
              </p>
              <p className="mt-0.5 text-xs opacity-80">{error.message}</p>
              {error.isRateLimit && (
                <p className="mt-1 text-xs opacity-70">
                  The Gemini free tier allows ~20 requests/minute. Wait 60
                  seconds and try again — your existing stories are still
                  available below.
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
