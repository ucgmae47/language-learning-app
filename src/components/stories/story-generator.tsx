"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, Loader2, AlertCircle, Clock } from "lucide-react";

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

export function StoryGenerator() {
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<ErrorState | null>(null);
  const router = useRouter();

  async function handleGenerate() {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/stories/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic: selectedTopic }),
      });

      let body: { storyId?: string; error?: string } = {};
      try {
        body = (await res.json()) as typeof body;
      } catch {
        setError({ message: `Server error (${res.status}). Please try again.`, isRateLimit: false });
        return;
      }

      if (!res.ok || !body.storyId) {
        setError({
          message: body.error ?? "Something went wrong. Please try again.",
          isRateLimit: res.status === 429,
        });
        return;
      }

      router.push(`/stories/${body.storyId}`);
    } catch {
      setError({ message: "Network error. Please check your connection.", isRateLimit: false });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Topic chips */}
      <div>
        <p className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-400">
          Pick a genre (optional)
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

      {/* Generate button */}
      <div className="flex flex-col gap-3">
        <button
          type="button"
          onClick={handleGenerate}
          disabled={loading}
          className="inline-flex w-fit items-center gap-2 rounded-full bg-gradient-to-r from-emerald-500 to-teal-600 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-emerald-500/30 transition hover:from-emerald-400 hover:to-teal-500 disabled:opacity-60"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              Generating your story…
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4" aria-hidden="true" />
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
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            )}
            <div>
              <p className="font-semibold">
                {error.isRateLimit ? "AI rate limit reached" : "Generation failed"}
              </p>
              <p className="mt-0.5 text-xs opacity-80">{error.message}</p>
              {error.isRateLimit && (
                <p className="mt-1 text-xs opacity-70">
                  The Gemini free tier allows ~20 requests/minute. Wait 60 seconds and try again — your existing stories are still available below.
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
