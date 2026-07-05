"use client";

import { useState } from "react";
import { RefreshCw, CheckCircle, AlertCircle, Loader2 } from "lucide-react";

type State = "idle" | "loading" | "done" | "error";

type Result = {
  processed: number;
  errors: number;
  total: number;
  message?: string;
};

export function BackfillButton({ count }: { count: number }) {
  const [state, setState] = useState<State>("idle");
  const [result, setResult] = useState<Result | null>(null);

  async function handleBackfill() {
    setState("loading");
    setResult(null);

    try {
      const res = await fetch("/api/stories/backfill-translations", {
        method: "POST",
      });
      const data = (await res.json()) as Result & { error?: string };

      if (!res.ok) {
        setState("error");
        setResult({ processed: 0, errors: 1, total: 0, message: data.error });
        return;
      }

      setState("done");
      setResult(data);
    } catch {
      setState("error");
      setResult({ processed: 0, errors: 1, total: 0, message: "Network error." });
    }
  }

  if (state === "done" && result?.processed === 0 && result?.message) {
    return null; // Already up to date — hide silently
  }

  return (
    <div className="mb-6 flex items-center justify-between gap-4 rounded-2xl border border-violet-500/20 bg-violet-500/5 px-4 py-3">
      <div className="flex items-center gap-2.5">
        {state === "done" ? (
          <CheckCircle className="h-4 w-4 shrink-0 text-emerald-400" />
        ) : state === "error" ? (
          <AlertCircle className="h-4 w-4 shrink-0 text-red-400" />
        ) : (
          <RefreshCw
            className={`h-4 w-4 shrink-0 text-violet-400 ${state === "loading" ? "animate-spin" : ""}`}
          />
        )}

        <div>
          {state === "idle" && (
            <p className="text-sm text-slate-300">
              <span className="font-semibold text-violet-300">
                {count} {count === 1 ? "story" : "stories"}
              </span>{" "}
              {count === 1 ? "is" : "are"} missing hover translations.
            </p>
          )}
          {state === "loading" && (
            <p className="text-sm text-slate-300">
              Generating translations… this takes ~3 s per story.
            </p>
          )}
          {state === "done" && result && (
            <p className="text-sm text-slate-300">
              <span className="font-semibold text-emerald-400">
                {result.processed} {result.processed === 1 ? "story" : "stories"}
              </span>{" "}
              updated.
              {result.errors > 0 && (
                <span className="text-amber-400"> {result.errors} failed (rate limit — try again in 60 s).</span>
              )}
            </p>
          )}
          {state === "error" && result && (
            <p className="text-sm text-red-400">{result.message ?? "Something went wrong."}</p>
          )}
        </div>
      </div>

      {(state === "idle" || state === "error") && (
        <button
          type="button"
          onClick={handleBackfill}
          className="shrink-0 rounded-xl bg-violet-600 px-4 py-1.5 text-sm font-bold text-white transition hover:bg-violet-500 active:scale-95"
        >
          {state === "error" ? "Retry" : "Add translations"}
        </button>
      )}

      {state === "loading" && (
        <Loader2 className="h-4 w-4 shrink-0 animate-spin text-violet-400" />
      )}
    </div>
  );
}
