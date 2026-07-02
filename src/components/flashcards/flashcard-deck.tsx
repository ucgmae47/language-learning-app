"use client";

import { useReducer } from "react";
import { RotateCcw, CheckCircle, XCircle, Trophy, RefreshCw } from "lucide-react";
import type { Idiom } from "@/lib/flashcards/types";

// ─── Types ───────────────────────────────────────────────────────────────────

type CardPhase = "front" | "back";
type DeckPhase = "active" | "done";

type State = {
  deckPhase: DeckPhase;
  cardPhase: CardPhase;
  remaining: Idiom[];   // cards still to review
  reviewAgain: Idiom[]; // cards the user flagged for another pass
  currentIdx: number;
  knownCount: number;
};

type Action =
  | { type: "FLIP" }
  | { type: "MARK_KNOWN" }
  | { type: "MARK_REVIEW" }
  | { type: "RESTART" }
  | { type: "REVIEW_AGAIN" };

// ─── Helpers ─────────────────────────────────────────────────────────────────

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j]!, a[i]!];
  }
  return a;
}

function advance(state: State, knew: boolean): State {
  const nextIdx = state.currentIdx + 1;
  if (nextIdx >= state.remaining.length) {
    return {
      ...state,
      deckPhase: "done",
      cardPhase: "front",
      knownCount: state.knownCount + (knew ? 1 : 0),
      reviewAgain: knew ? state.reviewAgain : [...state.reviewAgain, state.remaining[state.currentIdx]!],
    };
  }
  return {
    ...state,
    cardPhase: "front",
    currentIdx: nextIdx,
    knownCount: state.knownCount + (knew ? 1 : 0),
    reviewAgain: knew ? state.reviewAgain : [...state.reviewAgain, state.remaining[state.currentIdx]!],
  };
}

// ─── Reducer ─────────────────────────────────────────────────────────────────

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "FLIP":
      return state.cardPhase === "front"
        ? { ...state, cardPhase: "back" }
        : state;
    case "MARK_KNOWN":
      return state.cardPhase === "back" ? advance(state, true) : state;
    case "MARK_REVIEW":
      return state.cardPhase === "back" ? advance(state, false) : state;
    case "RESTART":
      return {
        deckPhase: "active",
        cardPhase: "front",
        remaining: shuffle(state.remaining),
        reviewAgain: [],
        currentIdx: 0,
        knownCount: 0,
      };
    case "REVIEW_AGAIN":
      return state.reviewAgain.length > 0
        ? {
            deckPhase: "active",
            cardPhase: "front",
            remaining: shuffle(state.reviewAgain),
            reviewAgain: [],
            currentIdx: 0,
            knownCount: 0,
          }
        : state;
    default:
      return state;
  }
}

// ─── Component ───────────────────────────────────────────────────────────────

type Props = {
  idioms: Idiom[];
  language: "es" | "fr";
};

export function FlashcardDeck({ idioms, language }: Props) {
  const flag = language === "es" ? "🇪🇸" : "🇫🇷";
  const langName = language === "es" ? "Spanish" : "French";

  const [state, dispatch] = useReducer(reducer, {
    deckPhase: "active",
    cardPhase: "front",
    remaining: shuffle(idioms),
    reviewAgain: [],
    currentIdx: 0,
    knownCount: 0,
  });

  const current = state.remaining[state.currentIdx];
  const total = state.remaining.length;
  const progress = total > 0 ? Math.round(((state.currentIdx) / total) * 100) : 100;

  // ── Done screen ──────────────────────────────────────────────────────────

  if (state.deckPhase === "done") {
    const score = Math.round((state.knownCount / total) * 100);
    return (
      <div className="flex flex-col items-center gap-6 py-12 text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-indigo-100">
          <Trophy className="h-10 w-10 text-indigo-600" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Deck complete!</h2>
          <p className="mt-1 text-slate-500">{flag} {langName} idioms</p>
        </div>
        <div className="grid grid-cols-3 gap-6">
          {[
            { label: "Known", value: state.knownCount, color: "text-green-600" },
            { label: "Score", value: `${score}%`, color: "text-indigo-600" },
            { label: "Review", value: state.reviewAgain.length, color: "text-amber-600" },
          ].map(({ label, value, color }) => (
            <div key={label} className="text-center">
              <p className={`text-3xl font-bold ${color}`}>{value}</p>
              <p className="text-sm text-slate-500">{label}</p>
            </div>
          ))}
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => dispatch({ type: "RESTART" })}
            className="flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
          >
            <RefreshCw className="h-4 w-4" />
            Start over
          </button>
          {state.reviewAgain.length > 0 && (
            <button
              onClick={() => dispatch({ type: "REVIEW_AGAIN" })}
              className="flex items-center gap-2 rounded-lg bg-amber-500 px-4 py-2 text-sm font-medium text-white hover:bg-amber-600 transition-colors"
            >
              <RotateCcw className="h-4 w-4" />
              Review {state.reviewAgain.length} again
            </button>
          )}
        </div>
      </div>
    );
  }

  if (!current) return null;

  const isFlipped = state.cardPhase === "back";

  return (
    <div className="flex flex-col gap-6">
      {/* Progress */}
      <div className="space-y-1">
        <div className="flex justify-between text-xs text-slate-500">
          <span>Card {state.currentIdx + 1} of {total}</span>
          <span>{progress}%</span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full rounded-full bg-indigo-500 transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Card — flip on click */}
      <div
        className="group relative cursor-pointer"
        style={{ perspective: "1200px" }}
        onClick={() => dispatch({ type: "FLIP" })}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === " " && dispatch({ type: "FLIP" })}
        aria-label={isFlipped ? "Card (flipped — translation visible)" : "Card (click to reveal)"}
      >
        <div
          className="relative transition-transform duration-500"
          style={{
            transformStyle: "preserve-3d",
            transform: isFlipped ? "rotateY(180deg)" : "rotateY(0deg)",
            minHeight: "240px",
          }}
        >
          {/* Front */}
          <div
            className="absolute inset-0 flex flex-col items-center justify-center rounded-2xl border-2 border-indigo-100 bg-white p-8 shadow-lg gap-3"
            style={{ backfaceVisibility: "hidden" }}
          >
            <span className="text-4xl">{flag}</span>
            <p className="text-center text-2xl font-bold text-slate-800 leading-snug">
              {current.expression}
            </p>
            {current.literal && (
              <p className="text-center text-sm text-slate-400 italic">
                Literally: &ldquo;{current.literal}&rdquo;
              </p>
            )}
            <p className="mt-3 text-xs text-slate-400">Click to reveal translation</p>
          </div>

          {/* Back */}
          <div
            className="absolute inset-0 flex flex-col items-center justify-center rounded-2xl border-2 border-green-100 bg-green-50 p-8 shadow-lg gap-3"
            style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
          >
            <p className="text-center text-xl font-bold text-green-800">
              {current.translation}
            </p>
            <div className="w-full max-w-sm rounded-xl border border-green-200 bg-white p-4 text-sm text-slate-600 space-y-1">
              <p className="font-medium text-slate-700">{current.exampleTarget}</p>
              <p className="text-slate-500 italic">{current.exampleEnglish}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Action buttons — only shown after flip */}
      {isFlipped && (
        <div className="flex gap-3">
          <button
            onClick={() => dispatch({ type: "MARK_REVIEW" })}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl border-2 border-red-200 bg-red-50 py-3 text-sm font-semibold text-red-700 hover:bg-red-100 transition-colors"
          >
            <XCircle className="h-5 w-5" />
            Still learning
          </button>
          <button
            onClick={() => dispatch({ type: "MARK_KNOWN" })}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl border-2 border-green-200 bg-green-50 py-3 text-sm font-semibold text-green-700 hover:bg-green-100 transition-colors"
          >
            <CheckCircle className="h-5 w-5" />
            Got it!
          </button>
        </div>
      )}
    </div>
  );
}
