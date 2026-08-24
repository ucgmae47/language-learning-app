"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { saveInterests } from "@/app/actions/interests";
import { INTEREST_TOPICS } from "@/lib/interests/topics";
import type { InterestTopic } from "@/lib/supabase/types";

export function InterestPicker() {
  const [selected, setSelected] = useState<Set<InterestTopic>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function toggle(id: InterestTopic) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
    setError(null);
  }

  function handleContinue() {
    if (selected.size === 0) {
      setError("Please choose at least one topic.");
      return;
    }
    startTransition(async () => {
      const result = await saveInterests(Array.from(selected));
      if (result.error) {
        setError(result.error);
      } else {
        router.push("/dashboard");
      }
    });
  }

  function handleSkip() {
    router.push("/dashboard");
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
        {INTEREST_TOPICS.map((topic) => {
          const isSelected = selected.has(topic.id);
          return (
            <button
              key={topic.id}
              type="button"
              onClick={() => toggle(topic.id)}
              disabled={isPending}
              className={`flex flex-col items-center gap-2 rounded-2xl border-2 px-4 py-5 text-sm font-medium transition disabled:opacity-50 ${
                isSelected
                  ? "border-emerald-500 bg-emerald-500/15 text-emerald-300 shadow-lg shadow-emerald-500/10 ring-2 ring-emerald-500/25"
                  : "border-white/10 bg-white/5 text-slate-300 hover:border-emerald-500/40 hover:bg-white/8 hover:text-white"
              }`}
            >
              <span className="text-3xl" role="img" aria-label={topic.label}>
                {topic.emoji}
              </span>
              {topic.label}
            </button>
          );
        })}
      </div>

      <p className="text-center text-sm text-slate-500">
        {selected.size === 0
          ? "Select everything that interests you"
          : `${selected.size} topic${selected.size > 1 ? "s" : ""} selected`}
      </p>

      {error && (
        <p className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-center text-sm text-red-300">
          {error}
        </p>
      )}

      <div className="flex flex-col gap-3">
        <button
          type="button"
          onClick={handleContinue}
          disabled={isPending || selected.size === 0}
          className="flex w-full items-center justify-center gap-2 rounded-full bg-emerald-600 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-600/20 transition hover:bg-emerald-500 disabled:opacity-40"
        >
          {isPending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              Saving…
            </>
          ) : (
            "Let's go →"
          )}
        </button>

        <button
          type="button"
          onClick={handleSkip}
          disabled={isPending}
          className="text-sm text-slate-500 transition hover:text-slate-300 disabled:opacity-50"
        >
          Skip for now
        </button>
      </div>
    </div>
  );
}
