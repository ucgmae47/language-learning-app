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
    if (!suggestedLevel) return null;
    return applyCefrAdaptation(suggestedLevel as CefrLevel, language as Language);
  };

  const [state, formAction, isPending] = useActionState(boundAction, null);

  if (state?.applied || (!suggestion && !state?.error)) return null;

  const isUpgrade = suggestion === "upgrade";
  const Icon = isUpgrade ? TrendingUp : TrendingDown;
  const scoreLabel = Math.round(avgScore);

  const colorClasses = isUpgrade
    ? "border-emerald-200 bg-emerald-50"
    : "border-amber-200 bg-amber-50";
  const iconColor = isUpgrade ? "text-emerald-600" : "text-amber-600";
  const buttonClasses = isUpgrade
    ? "bg-emerald-600 hover:bg-emerald-700 text-white"
    : "bg-amber-600 hover:bg-amber-700 text-white";
  const headingColor = isUpgrade ? "text-emerald-900" : "text-amber-900";
  const textColor = isUpgrade ? "text-emerald-800" : "text-amber-800";

  const heading = isUpgrade
    ? `Ready for ${suggestedLevel}?`
    : `${suggestedLevel} might suit you better`;

  const body = isUpgrade
    ? `Your last ${attemptCount} quiz sessions averaged ${scoreLabel}% — you're consistently acing ${currentLevel} content.`
    : `Your last ${attemptCount} quiz sessions averaged ${scoreLabel}% — ${currentLevel} content may be a bit challenging right now.`;

  if (state?.applied) {
    return (
      <div className="mb-6 flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4">
        <CheckCircle className="h-5 w-5 flex-shrink-0 text-emerald-600" />
        <p className="text-sm font-medium text-emerald-900">
          Level updated to <strong>{suggestedLevel}</strong>. Your next story will reflect your new level.
        </p>
      </div>
    );
  }

  return (
    <div className={`mb-6 flex items-start gap-4 rounded-2xl border px-5 py-4 ${colorClasses}`}>
      <span className={`mt-0.5 flex-shrink-0 ${iconColor}`}>
        <Icon className="h-5 w-5" aria-hidden="true" />
      </span>

      <div className="min-w-0 flex-1">
        <p className={`text-sm font-semibold ${headingColor}`}>{heading}</p>
        <p className={`mt-0.5 text-sm ${textColor}`}>{body}</p>
        {state?.error && (
          <p className="mt-1 text-xs text-red-600">{state.error}</p>
        )}
      </div>

      <form action={formAction} className="flex-shrink-0">
        <button
          type="submit"
          disabled={isPending}
          className={`flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-sm font-semibold shadow-sm transition disabled:opacity-60 ${buttonClasses}`}
        >
          {isPending ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
          ) : null}
          Switch to {suggestedLevel}
        </button>
      </form>
    </div>
  );
}
