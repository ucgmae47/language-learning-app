"use client";

import { useActionState } from "react";
import { TrendingUp, TrendingDown, CheckCircle, Loader2 } from "lucide-react";
import { applyCefrAdaptation } from "@/app/actions/cefr-adapt";
import type { AdaptationSuggestion } from "@/app/actions/cefr-adapt";
import type { CefrLevel, Language } from "@/lib/supabase/types";

type Props = {
  data: AdaptationSuggestion;
};

type ActionState = { error?: string; applied?: boolean } | null;

export function CefrAdaptBanner({ data }: Props) {
  const { suggestion, avgScore, attemptCount, currentLevel, suggestedLevel, language } = data;

  const boundAction = async (
    _prev: ActionState,
    _formData: FormData,
  ): Promise<ActionState> => {
    // Mark parameters as used to avoid unused-var warnings; they are part of
    // the action signature and not used currently.
    void _prev; void _formData;
    if (!suggestedLevel) return null;
    return applyCefrAdaptation(suggestedLevel as CefrLevel, language as Language);
  };

  const [state, formAction, isPending] = useActionState(boundAction, null);

  if (!suggestion && !state?.error) return null;

  const isUpgrade = suggestion === "upgrade";
  const Icon = isUpgrade ? TrendingUp : TrendingDown;
  const scoreLabel = Math.round(avgScore);

  const colors = isUpgrade
    ? {
        border: "border-emerald-500/25",
        bg: "bg-emerald-500/10",
        icon: "text-emerald-400",
        heading: "text-emerald-300",
        body: "text-emerald-200/70",
        button: "from-emerald-500 to-teal-500 shadow-emerald-500/30",
      }
    : {
        border: "border-amber-500/25",
        bg: "bg-amber-500/10",
        icon: "text-amber-400",
        heading: "text-amber-300",
        body: "text-amber-200/70",
        button: "from-amber-500 to-orange-500 shadow-amber-500/30",
      };

  const heading = isUpgrade
    ? `Ready to level up to ${suggestedLevel}?`
    : `${suggestedLevel} might suit you better right now`;

  const body = isUpgrade
    ? `Your last ${attemptCount} sessions averaged ${scoreLabel}% — you're crushing ${currentLevel} content!`
    : `Your last ${attemptCount} sessions averaged ${scoreLabel}% — ${currentLevel} may be a bit challenging right now.`;

  if (state?.applied) {
    return (
      <div className="mb-6 flex items-center gap-3 rounded-2xl border border-emerald-500/25 bg-emerald-500/10 px-5 py-4">
        <CheckCircle className="h-5 w-5 flex-shrink-0 text-emerald-400" />
        <p className="text-sm font-semibold text-emerald-300">
          Level updated to <strong>{suggestedLevel}</strong>. Your next story will match your new level!
        </p>
      </div>
    );
  }

  return (
    <div className={`mb-6 flex items-start gap-4 rounded-2xl border px-5 py-4 ${colors.border} ${colors.bg}`}>
      <span className={`mt-0.5 flex-shrink-0 ${colors.icon}`}>
        <Icon className="h-5 w-5" aria-hidden="true" />
      </span>

      <div className="min-w-0 flex-1">
        <p className={`text-sm font-bold ${colors.heading}`}>{heading}</p>
        <p className={`mt-0.5 text-sm ${colors.body}`}>{body}</p>
        {state?.error && (
          <p className="mt-1 text-xs text-red-400">{state.error}</p>
        )}
      </div>

      <form action={formAction} className="flex-shrink-0">
        <button
          type="submit"
          disabled={isPending}
          className={`flex items-center gap-1.5 rounded-xl bg-gradient-to-r px-4 py-2 text-sm font-bold text-white shadow-lg transition hover:scale-105 active:scale-95 disabled:opacity-60 ${colors.button}`}
        >
          {isPending ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
          ) : null}
          Switch to {suggestedLevel} →
        </button>
      </form>
    </div>
  );
}
