"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, Loader2 } from "lucide-react";

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

export function StoryGenerator() {
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
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
        setError(`Server error (${res.status}). Please try again.`);
        return;
      }

      if (!res.ok || !body.storyId) {
        setError(body.error ?? "Something went wrong. Please try again.");
        return;
      }

      router.push(`/stories/${body.storyId}`);
    } catch {
      setError("Network error. Please check your connection.");
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
                  ? "border-emerald-500 bg-emerald-600 text-white"
                  : "border-slate-200 bg-white text-slate-600 hover:border-emerald-300 hover:text-emerald-700"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Generate button + error */}
      <div className="flex flex-col gap-2">
        <button
          type="button"
          onClick={handleGenerate}
          disabled={loading}
          className="inline-flex w-fit items-center gap-2 rounded-full bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:opacity-60"
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
        {error && <p className="text-sm text-red-600">{error}</p>}
      </div>
    </div>
  );
}
