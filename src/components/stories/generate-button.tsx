"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, Loader2 } from "lucide-react";

export function GenerateButton() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function handleGenerate() {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/stories/generate", { method: "POST" });

      let body: { storyId?: string; error?: string } = {};
      try {
        body = (await res.json()) as typeof body;
      } catch {
        setError(`Server error (${res.status}). Please try again.`);
        return;
      }

      if (!res.ok || !body.storyId) {
        setError(
          res.status === 429
            ? "AI rate limit reached — wait ~60 seconds and try again."
            : (body.error ?? "Something went wrong. Please try again."),
        );
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
    <div className="flex flex-col items-start gap-2">
      <button
        type="button"
        onClick={handleGenerate}
        disabled={loading}
        className="inline-flex items-center gap-2 rounded-full bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:opacity-60"
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
          </>
        )}
      </button>
      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}
    </div>
  );
}
