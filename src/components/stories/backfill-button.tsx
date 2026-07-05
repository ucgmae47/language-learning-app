"use client";

import { useState } from "react";
import { RefreshCw, CheckCircle, AlertCircle, Loader2, Ban } from "lucide-react";

type State = "idle" | "loading" | "done" | "error";

type ApiResult = {
  processed: number;
  errors: number;
  total: number;
  message?: string;
  errorKind?: "rate_limit" | "quota" | "other" | null;
  firstErrorMsg?: string | null;
  error?: string;
};

function errorDetails(result: ApiResult): {
  label: string;
  detail: string;
  canRetry: boolean;
} {
  if (result.error) {
    return { label: "Request failed", detail: result.error, canRetry: true };
  }
  switch (result.errorKind) {
    case "quota":
      return {
        label: "Daily quota reached",
        detail:
          "Your Gemini free-tier daily limit is exhausted. It resets at midnight Pacific time (UTC-8). Come back tomorrow — or add a paid API key.",
        canRetry: false,
      };
    case "rate_limit":
      return {
        label: "Rate limit hit",
        detail:
          "Gemini allows ~20 requests/minute on the free tier. Wait 60 seconds and retry.",
        canRetry: true,
      };
    default:
      return {
        label: "Translation error",
        detail: result.firstErrorMsg ?? "An unexpected error occurred.",
        canRetry: true,
      };
  }
}

export function BackfillButton({ count }: { count: number }) {
  const [state, setState] = useState<State>("idle");
  const [result, setResult] = useState<ApiResult | null>(null);

  async function handleBackfill() {
    setState("loading");
    setResult(null);

    try {
      const res = await fetch("/api/stories/backfill-translations", {
        method: "POST",
      });
      const data = (await res.json()) as ApiResult;

      if (!res.ok) {
        setState("error");
        setResult(data);
        return;
      }

      setState(data.errors > 0 && data.processed === 0 ? "error" : "done");
      setResult(data);
    } catch {
      setState("error");
      setResult({
        processed: 0,
        errors: 1,
        total: 0,
        error: "Network error. Please check your connection.",
      });
    }
  }

  // All done with no errors — banner can disappear
  if (state === "done" && result?.message) return null;

  const err = result ? errorDetails(result) : null;

  return (
    <div className="mb-6 rounded-2xl border border-violet-500/20 bg-violet-500/5 px-4 py-3">
      {/* ── Idle ── */}
      {state === "idle" && (
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <RefreshCw className="h-4 w-4 shrink-0 text-violet-400" />
            <p className="text-sm text-slate-300">
              <span className="font-semibold text-violet-300">
                {count} {count === 1 ? "story" : "stories"}
              </span>{" "}
              {count === 1 ? "is" : "are"} missing hover translations.
            </p>
          </div>
          <button
            type="button"
            onClick={handleBackfill}
            className="shrink-0 rounded-xl bg-violet-600 px-4 py-1.5 text-sm font-bold text-white transition hover:bg-violet-500 active:scale-95"
          >
            Add translations
          </button>
        </div>
      )}

      {/* ── Loading ── */}
      {state === "loading" && (
        <div className="flex items-center gap-2.5">
          <Loader2 className="h-4 w-4 shrink-0 animate-spin text-violet-400" />
          <p className="text-sm text-slate-300">
            Generating translations… ~4 s per story.
          </p>
        </div>
      )}

      {/* ── Done (partial or full) ── */}
      {state === "done" && result && (
        <div className="flex items-start gap-2.5">
          <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
          <div>
            <p className="text-sm text-slate-300">
              <span className="font-semibold text-emerald-400">
                {result.processed} {result.processed === 1 ? "story" : "stories"} updated.
              </span>
              {result.errors > 0 && err && (
                <span className="text-amber-400">
                  {" "}{result.errors} failed — {err.detail}
                </span>
              )}
            </p>
            {result.errors > 0 && err?.canRetry && (
              <button
                type="button"
                onClick={handleBackfill}
                className="mt-2 rounded-lg bg-violet-600 px-3 py-1 text-xs font-bold text-white transition hover:bg-violet-500"
              >
                Retry failed
              </button>
            )}
          </div>
        </div>
      )}

      {/* ── Error (all failed) ── */}
      {state === "error" && result && err && (
        <div className="flex items-start gap-2.5">
          {err.canRetry ? (
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
          ) : (
            <Ban className="mt-0.5 h-4 w-4 shrink-0 text-red-400" />
          )}
          <div className="flex-1">
            <p className="text-sm font-semibold text-white">{err.label}</p>
            <p className="mt-0.5 text-xs text-slate-400">{err.detail}</p>
          </div>
          {err.canRetry && (
            <button
              type="button"
              onClick={handleBackfill}
              className="shrink-0 rounded-xl bg-violet-600 px-4 py-1.5 text-sm font-bold text-white transition hover:bg-violet-500 active:scale-95"
            >
              Retry
            </button>
          )}
        </div>
      )}
    </div>
  );
}
