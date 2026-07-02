"use client";

import { useReducer, useRef, useEffect } from "react";
import { CheckCircle, XCircle, ChevronRight, Trophy, RefreshCw, BookOpen } from "lucide-react";
import { updateWeakness } from "@/app/actions/drills";
import { CONCEPTS_ES } from "@/lib/drills/questions-es";
import { CONCEPTS_FR } from "@/lib/drills/questions-fr";
import type { DrillQuestion, DrillConcept } from "@/lib/drills/types";
import type { Language, GrammarWeakness } from "@/lib/supabase/types";

// ─── Types ───────────────────────────────────────────────────────────────────

type Phase = "answering" | "checking" | "feedback" | "done";

type FeedbackData = {
  correct: boolean;
  feedback: string;
  correctAnswer: string;
};

type State = {
  phase: Phase;
  selectedConcept: string; // "" means "all"
  queue: DrillQuestion[];
  currentIndex: number;
  answer: string;
  feedback: FeedbackData | null;
  correctCount: number;
  errorCount: number;
};

type Action =
  | { type: "SELECT_CONCEPT"; concept: string; queue: DrillQuestion[] }
  | { type: "TYPE"; value: string }
  | { type: "SUBMIT" }
  | { type: "SET_FEEDBACK"; payload: FeedbackData }
  | { type: "NEXT" }
  | { type: "RESTART" };

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Shuffle an array (Fisher-Yates). */
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j]!, a[i]!];
  }
  return a;
}

/**
 * Build a weighted drill queue. Concepts with a higher error rate bubble to
 * the top by having more of their questions included.
 */
function buildQueue(
  questions: DrillQuestion[],
  conceptFilter: string,
  weaknesses: GrammarWeakness[],
): DrillQuestion[] {
  const pool = conceptFilter
    ? questions.filter((q) => q.concept === conceptFilter)
    : questions;

  const weakMap = new Map<string, number>();
  weaknesses.forEach((w) => {
    if (w.attempt_count > 0) {
      weakMap.set(w.concept, w.error_count / w.attempt_count);
    }
  });

  // Sort by descending error rate so weaker concepts appear first.
  const sorted = [...pool].sort((a, b) => {
    const ra = weakMap.get(a.concept) ?? 0;
    const rb = weakMap.get(b.concept) ?? 0;
    return rb - ra;
  });

  // Shuffle within same-rate groups (top weak questions stay first, rest randomised).
  const weak = sorted.filter((q) => (weakMap.get(q.concept) ?? 0) > 0);
  const rest = shuffle(sorted.filter((q) => (weakMap.get(q.concept) ?? 0) === 0));
  return [...shuffle(weak), ...rest].slice(0, 10);
}

// ─── Reducer ─────────────────────────────────────────────────────────────────

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "SELECT_CONCEPT":
      return {
        ...state,
        selectedConcept: action.concept,
        queue: action.queue,
        currentIndex: 0,
        answer: "",
        feedback: null,
        phase: "answering",
        correctCount: 0,
        errorCount: 0,
      };
    case "TYPE":
      return state.phase === "answering" ? { ...state, answer: action.value } : state;
    case "SUBMIT":
      return state.phase === "answering" && state.answer.trim()
        ? { ...state, phase: "checking" }
        : state;
    case "SET_FEEDBACK":
      return {
        ...state,
        phase: "feedback",
        feedback: action.payload,
        correctCount: action.payload.correct ? state.correctCount + 1 : state.correctCount,
        errorCount: action.payload.correct ? state.errorCount : state.errorCount + 1,
      };
    case "NEXT": {
      const next = state.currentIndex + 1;
      if (next >= state.queue.length) {
        return { ...state, phase: "done", feedback: null };
      }
      return { ...state, phase: "answering", currentIndex: next, answer: "", feedback: null };
    }
    case "RESTART":
      return {
        ...state,
        phase: "answering",
        currentIndex: 0,
        answer: "",
        feedback: null,
        correctCount: 0,
        errorCount: 0,
      };
    default:
      return state;
  }
}

// ─── Component ───────────────────────────────────────────────────────────────

type Props = {
  language: Language;
  questions: DrillQuestion[];
  weaknesses: GrammarWeakness[];
};

export function DrillSession({ language, questions, weaknesses }: Props) {
  const concepts: DrillConcept[] = language === "es" ? CONCEPTS_ES : CONCEPTS_FR;

  const initialQueue = buildQueue(questions, "", weaknesses);

  const [state, dispatch] = useReducer(reducer, {
    phase: "answering",
    selectedConcept: "",
    queue: initialQueue,
    currentIndex: 0,
    answer: "",
    feedback: null,
    correctCount: 0,
    errorCount: 0,
  });

  const inputRef = useRef<HTMLInputElement>(null);

  // Refocus input after feedback phase clears.
  useEffect(() => {
    if (state.phase === "answering") {
      inputRef.current?.focus();
    }
  }, [state.phase, state.currentIndex]);

  const currentQuestion = state.queue[state.currentIndex];

  // ── Concept selection ────────────────────────────────────────────────────

  function handleConceptChange(concept: string) {
    const queue = buildQueue(questions, concept, weaknesses);
    dispatch({ type: "SELECT_CONCEPT", concept, queue });
  }

  // ── Answer submission ────────────────────────────────────────────────────

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!currentQuestion || state.phase !== "answering" || !state.answer.trim()) return;
    dispatch({ type: "SUBMIT" });

    try {
      const res = await fetch("/api/drills/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          questionId: currentQuestion.id,
          userAnswer: state.answer.trim(),
          language,
        }),
      });

      const data = (await res.json()) as {
        correct: boolean;
        feedback: string;
        correctAnswer: string;
      };

      dispatch({ type: "SET_FEEDBACK", payload: data });

      // Fire-and-forget weakness update.
      void updateWeakness(language, currentQuestion.concept, data.correct);
    } catch {
      // Network error — show pre-written explanation as fallback.
      dispatch({
        type: "SET_FEEDBACK",
        payload: {
          correct: false,
          feedback: currentQuestion.explanation,
          correctAnswer: currentQuestion.answer,
        },
      });
      void updateWeakness(language, currentQuestion.concept, false);
    }
  }

  // ── Render ───────────────────────────────────────────────────────────────

  const flag = language === "es" ? "🇪🇸" : "🇫🇷";
  const langName = language === "es" ? "Spanish" : "French";
  const total = state.queue.length;
  const progress = Math.round(
    ((state.currentIndex + (state.phase === "done" ? 1 : 0)) / total) * 100,
  );

  // ── Done screen ──────────────────────────────────────────────────────────

  if (state.phase === "done" || total === 0) {
    const score = Math.round((state.correctCount / total) * 100);
    return (
      <div className="flex flex-col items-center gap-6 py-12 text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-indigo-100">
          <Trophy className="h-10 w-10 text-indigo-600" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Session complete!</h2>
          <p className="mt-1 text-slate-500">
            {flag} {langName} · {state.selectedConcept
              ? concepts.find((c) => c.key === state.selectedConcept)?.label
              : "Mixed"}
          </p>
        </div>
        <div className="grid grid-cols-3 gap-6">
          {[
            { label: "Correct", value: state.correctCount, color: "text-green-600" },
            { label: "Score", value: `${score}%`, color: "text-indigo-600" },
            { label: "Errors", value: state.errorCount, color: "text-red-500" },
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
            Redo session
          </button>
          <button
            onClick={() => handleConceptChange("")}
            className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 transition-colors"
          >
            <BookOpen className="h-4 w-4" />
            New session
          </button>
        </div>
      </div>
    );
  }

  if (!currentQuestion) return null;

  return (
    <div className="flex flex-col gap-6">
      {/* Concept filter pills */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => handleConceptChange("")}
          className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
            state.selectedConcept === ""
              ? "bg-indigo-600 text-white"
              : "border border-slate-200 text-slate-600 hover:bg-slate-50"
          }`}
        >
          All topics
        </button>
        {concepts.map((c) => (
          <button
            key={c.key}
            onClick={() => handleConceptChange(c.key)}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              state.selectedConcept === c.key
                ? "bg-indigo-600 text-white"
                : "border border-slate-200 text-slate-600 hover:bg-slate-50"
            }`}
          >
            {c.label}
          </button>
        ))}
      </div>

      {/* Progress bar */}
      <div className="space-y-1">
        <div className="flex justify-between text-xs text-slate-500">
          <span>
            Question {state.currentIndex + 1} of {total}
          </span>
          <span>{progress}%</span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full rounded-full bg-indigo-500 transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Question card */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-medium text-indigo-700">
            {currentQuestion.conceptLabel}
          </span>
        </div>

        <p className="text-lg font-semibold text-slate-800">{currentQuestion.prompt}</p>

        {currentQuestion.sentence && (
          <p className="rounded-lg bg-slate-50 px-4 py-3 text-slate-700 italic border border-slate-100">
            {currentQuestion.sentence}
          </p>
        )}

        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={state.answer}
            onChange={(e) => dispatch({ type: "TYPE", value: e.target.value })}
            disabled={state.phase !== "answering"}
            placeholder="Type your answer…"
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck={false}
            className="flex-1 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-slate-800 placeholder:text-slate-400 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100 disabled:bg-slate-50 disabled:text-slate-400 transition"
          />
          <button
            type="submit"
            disabled={state.phase !== "answering" || !state.answer.trim()}
            className="rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50 transition-colors"
          >
            {state.phase === "checking" ? (
              <span className="flex items-center gap-2">
                <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                Checking
              </span>
            ) : (
              "Check"
            )}
          </button>
        </form>

        {/* Feedback */}
        {state.phase === "feedback" && state.feedback && (
          <div
            className={`rounded-xl border p-4 space-y-2 ${
              state.feedback.correct
                ? "border-green-200 bg-green-50"
                : "border-red-200 bg-red-50"
            }`}
          >
            <div className="flex items-center gap-2">
              {state.feedback.correct ? (
                <CheckCircle className="h-5 w-5 text-green-600 shrink-0" />
              ) : (
                <XCircle className="h-5 w-5 text-red-500 shrink-0" />
              )}
              <p
                className={`font-semibold ${
                  state.feedback.correct ? "text-green-800" : "text-red-700"
                }`}
              >
                {state.feedback.correct ? "Correct!" : `The answer is: ${state.feedback.correctAnswer}`}
              </p>
            </div>
            <p className="text-sm text-slate-600 leading-relaxed">{state.feedback.feedback}</p>
            <button
              onClick={() => dispatch({ type: "NEXT" })}
              className="flex items-center gap-1.5 rounded-lg bg-slate-800 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 transition-colors mt-1"
            >
              Next question
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
