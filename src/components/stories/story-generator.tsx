"use client";

import { useEffect, useState } from "react";
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
  isBusy: boolean;
};

type Props = {
  queuedStory?: Pick<Story, "id" | "title" | "topics"> | null;
  /** True while a recommended story is being generated/translated in the background. */
  isPreparingNext?: boolean;
};

export function StoryGenerator({
  queuedStory: initialQueuedStory,
  isPreparingNext = false,
}: Props) {
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [opening, setOpening] = useState(false);
  const [error, setError] = useState<ErrorState | null>(null);
  // Optimistically hide the "ready" card as soon as the user taps it.
  const [queuedStory, setQueuedStory] = useState(initialQueuedStory ?? null);
  const router = useRouter();

  // Keep the ready/preparing card in sync when the server re-renders.
  useEffect(() => {
    setQueuedStory(initialQueuedStory ?? null);
  }, [initialQueuedStory]);

  // While a recommended story is preparing, refresh until it becomes ready.
  useEffect(() => {
    if (queuedStory || !isPreparingNext) return;

    const id = window.setInterval(() => {
      router.refresh();
    }, 4000);

    return () => window.clearInterval(id);
  }, [queuedStory, isPreparingNext, router]);

  // ── Open the pre-queued story instantly ─────────────────────────────────────
  async function handleOpenQueued() {
    if (!queuedStory || opening || loading) return;
    const id = queuedStory.id;
    setOpening(true);
    setError(null);
    try {
      // Await consume so is_queued is cleared and next generation is scheduled
      // before we leave the page — otherwise returning can still show this story.
      await consumeQueuedStory(id);
      setQueuedStory(null);
      router.push(`/stories/${id}`);
      router.refresh();
    } catch {
      setError({
        message: "Couldn't open that story. Please try again.",
        isBusy: false,
      });
    } finally {
      setOpening(false);
    }
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

      let body: {
        storyId?: string;
        error?: string;
        fromQueue?: boolean;
        isBusy?: boolean;
      } = {};
      try {
        body = (await res.json()) as typeof body;
      } catch {
        setError({
          message:
            "We couldn't create your story just now. Please try again in a moment.",
          isBusy: res.status === 429 || res.status === 503,
        });
        return;
      }

      if (!res.ok || !body.storyId) {
        setError({
          message:
            body.error ??
            "We couldn't create your story just now. Please try again in a moment.",
          isBusy: Boolean(body.isBusy) || res.status === 429 || res.status === 503,
        });
        return;
      }

      // If we received a story from the queue, remove the "ready" card too.
      if (body.fromQueue) setQueuedStory(null);

      router.push(`/stories/${body.storyId}`);
    } catch {
      setError({
        message: "Network error. Please check your connection and try again.",
        isBusy: false,
      });
    } finally {
      setLoading(false);
    }
  }

  const hasQueuedStory = !!queuedStory;
  const showPreparing = !hasQueuedStory && isPreparingNext;

  return (
    <div className="flex flex-col gap-5">
      {/* ── Pre-queued story card ("Your story is ready!") ─────────────────── */}
      {hasQueuedStory && (
        <div className="relative overflow-hidden rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-emerald-500/10 via-teal-500/5 to-transparent p-4">
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
                  Personalised for you ·{" "}
                  {queuedStory.topics
                    .slice(0, 2)
                    .map((t) => (
                      <span key={t} className="capitalize">
                        {t}
                      </span>
                    ))
                    .reduce<React.ReactNode[]>(
                      (acc, el, i) => (i === 0 ? [el] : [...acc, ", ", el]),
                      [],
                    )}
                </p>
              )}
            </div>

            <button
              type="button"
              onClick={() => void handleOpenQueued()}
              disabled={opening || loading}
              className="flex shrink-0 items-center gap-1.5 rounded-xl bg-emerald-500 px-4 py-2 text-sm font-bold text-white shadow-lg shadow-emerald-500/30 transition hover:bg-emerald-400 active:scale-95 disabled:opacity-60"
            >
              {opening ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
                  Opening…
                </>
              ) : (
                "Read now"
              )}
            </button>
          </div>
        </div>
      )}

      {/* ── Preparing recommended story ───────────────────────────────────── */}
      {showPreparing && (
        <div className="relative overflow-hidden rounded-2xl border border-violet-500/25 bg-gradient-to-br from-violet-500/10 via-fuchsia-500/5 to-transparent p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-violet-500/20">
              <Loader2
                className="h-5 w-5 animate-spin text-violet-300"
                aria-hidden="true"
              />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold uppercase tracking-wider text-violet-300">
                Preparing your next story
              </p>
              <p className="mt-0.5 text-sm text-slate-300">
                Writing and translating a personalised passage — this can take a
                moment.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ── Genre selector ─────────────────────────────────────────────────── */}
      <div>
        <p className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-400">
          {hasQueuedStory
            ? "Or pick a genre to generate a different story"
            : showPreparing
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
            hasQueuedStory || showPreparing
              ? "bg-gradient-to-r from-slate-600 to-slate-700 shadow-slate-500/20 hover:from-slate-500 hover:to-slate-600"
              : "bg-gradient-to-r from-emerald-500 to-teal-600 shadow-emerald-500/30 hover:from-emerald-400 hover:to-teal-500"
          }`}
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              Generating your story — this can take a moment…
            </>
          ) : (
            <>
              {hasQueuedStory || showPreparing ? (
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

        {error && (
          <div
            className={`flex items-start gap-2.5 rounded-xl border px-4 py-3 text-sm ${
              error.isBusy
                ? "border-amber-500/20 bg-amber-500/10 text-amber-300"
                : "border-red-500/20 bg-red-500/10 text-red-400"
            }`}
          >
            {error.isBusy ? (
              <Clock className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            ) : (
              <AlertCircle
                className="mt-0.5 h-4 w-4 shrink-0"
                aria-hidden="true"
              />
            )}
            <div>
              <p className="font-semibold">
                {error.isBusy ? "Writer is busy" : "Couldn't generate story"}
              </p>
              <p className="mt-0.5 text-xs opacity-80">{error.message}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
