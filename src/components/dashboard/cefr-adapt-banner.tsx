"use client";

import { useActionState, useEffect, useId, useState } from "react";
import { TrendingUp, TrendingDown, CheckCircle, Loader2, X } from "lucide-react";
import { applyCefrAdaptation } from "@/app/actions/cefr-adapt";
import type { AdaptationSuggestion } from "@/app/actions/cefr-adapt";
import type { CefrLevel, Language } from "@/lib/supabase/types";

type Props = {
  data: AdaptationSuggestion;
};

type ActionState = { error?: string; applied?: boolean } | null;

function dismissKey(data: AdaptationSuggestion): string {
  return `cefr-adapt-dismiss:${data.language}:${data.suggestion}:${data.suggestedLevel}`;
}

export function CefrAdaptBanner({ data }: Props) {
  const {
    suggestion,
    avgScore,
    attemptCount,
    currentLevel,
    suggestedLevel,
    language,
  } = data;

  const titleId = useId();
  const [dismissed, setDismissed] = useState(true); // start hidden until we check localStorage
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(dismissKey(data));
      setDismissed(stored === "1");
    } catch {
      setDismissed(false);
    }
    setReady(true);
  }, [data]);

  const boundAction = async (
    _prev: ActionState,
    _formData: FormData,
  ): Promise<ActionState> => {
    void _prev;
    void _formData;
    return applyCefrAdaptation(
      suggestedLevel as CefrLevel,
      language as Language,
    );
  };

  const [state, formAction, isPending] = useActionState(boundAction, null);

  function handleDismiss() {
    try {
      window.localStorage.setItem(dismissKey(data), "1");
    } catch {
      // ignore storage failures
    }
    setDismissed(true);
  }

  if (!ready || (dismissed && !state?.applied && !state?.error)) return null;

  const isUpgrade = suggestion === "upgrade";
  const Icon = isUpgrade ? TrendingUp : TrendingDown;
  const scoreLabel = Math.round(avgScore);

  const colors = isUpgrade
    ? {
        glow: "from-emerald-500/30 to-teal-500/10",
        iconBg: "bg-emerald-500/20 text-emerald-300",
        heading: "text-emerald-200",
        button: "from-emerald-500 to-teal-500 shadow-emerald-500/30",
      }
    : {
        glow: "from-amber-500/30 to-orange-500/10",
        iconBg: "bg-amber-500/20 text-amber-300",
        heading: "text-amber-200",
        button: "from-amber-500 to-orange-500 shadow-amber-500/30",
      };

  const heading = isUpgrade
    ? `Ready to level up to ${suggestedLevel}?`
    : `Would ${suggestedLevel} fit better right now?`;

  const body = isUpgrade
    ? `Your last ${attemptCount} story sessions averaged ${scoreLabel}%. You're breezing through ${currentLevel} content — bumping up will unlock more challenging material.`
    : `Your last ${attemptCount} story sessions averaged ${scoreLabel}%. ${currentLevel} may be a stretch right now — dropping to ${suggestedLevel} can make practice feel more productive.`;

  return (
    <div
      className="fixed inset-0 z-[80] flex items-end justify-center bg-black/60 p-4 sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
    >
      <div
        className={`relative w-full max-w-md overflow-hidden rounded-3xl border border-white/10 bg-[#12121f] shadow-2xl`}
      >
        <div className={`pointer-events-none absolute inset-x-0 top-0 h-32 bg-gradient-to-b ${colors.glow}`} />

        <button
          type="button"
          onClick={handleDismiss}
          aria-label="Dismiss"
          className="absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/5 text-slate-400 transition hover:text-white"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="relative px-6 pb-6 pt-8">
          {state?.applied ? (
            <div className="flex flex-col items-center text-center">
              <CheckCircle className="mb-3 h-10 w-10 text-emerald-400" />
              <p id={titleId} className="text-lg font-bold text-white">
                Level updated to {suggestedLevel}
              </p>
              <p className="mt-2 text-sm text-slate-400">
                Your next stories and practice will match your new level.
              </p>
              <button
                type="button"
                onClick={handleDismiss}
                className="mt-6 rounded-xl bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/15"
              >
                Got it
              </button>
            </div>
          ) : (
            <>
              <div
                className={`mb-4 flex h-12 w-12 items-center justify-center rounded-2xl ${colors.iconBg}`}
              >
                <Icon className="h-6 w-6" aria-hidden="true" />
              </div>

              <h2 id={titleId} className={`text-xl font-bold ${colors.heading}`}>
                {heading}
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-400">{body}</p>

              {state?.error && (
                <p className="mt-3 text-sm text-red-400">{state.error}</p>
              )}

              <div className="mt-6 flex flex-col gap-2 sm:flex-row-reverse">
                <form action={formAction} className="sm:flex-1">
                  <button
                    type="submit"
                    disabled={isPending}
                    className={`flex w-full items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r px-4 py-2.5 text-sm font-bold text-white shadow-lg transition hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60 ${colors.button}`}
                  >
                    {isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                    ) : null}
                    Switch to {suggestedLevel}
                  </button>
                </form>
                <button
                  type="button"
                  onClick={handleDismiss}
                  disabled={isPending}
                  className="rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-semibold text-slate-300 transition hover:bg-white/10 disabled:opacity-60 sm:flex-1"
                >
                  Keep {currentLevel}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
