"use client";

import { useReducer, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle, XCircle, ChevronRight, Loader2, Trophy } from "lucide-react";
import { saveStoryAttempt } from "@/app/actions/stories";
import type { StoryQuizQuestion } from "@/lib/supabase/types";

type Props = {
  storyId: string;
  questions: StoryQuizQuestion[];
};

type QuizState = {
  currentIndex: number;
  answers: Record<number, string>;
  revealed: boolean;
  phase: "quiz" | "submitting" | "done";
  score: number | null;
  error: string | null;
};

type QuizAction =
  | { type: "SELECT"; value: string }
  | { type: "REVEAL" }
  | { type: "NEXT" }
  | { type: "SUBMIT_START" }
  | { type: "SUBMIT_DONE"; score: number }
  | { type: "ERROR"; message: string };

function quizReducer(state: QuizState, action: QuizAction): QuizState {
  switch (action.type) {
    case "SELECT":
      if (state.revealed) return state;
      return { ...state, answers: { ...state.answers, [state.currentIndex]: action.value } };
    case "REVEAL":
      return { ...state, revealed: true };
    case "NEXT":
      return { ...state, currentIndex: state.currentIndex + 1, revealed: false };
    case "SUBMIT_START":
      return { ...state, phase: "submitting", error: null };
    case "SUBMIT_DONE":
      return { ...state, phase: "done", score: action.score };
    case "ERROR":
      return { ...state, phase: "quiz", error: action.message };
    default:
      return state;
  }
}

const SCORE_MESSAGES = [
  "Keep practising — you'll improve!",
  "A solid start. Re-read the story and try again.",
  "Good effort! You understood the main points.",
  "Great work! Strong comprehension.",
  "Excellent! Near-perfect understanding.",
  "Perfect score! Outstanding reading.",
];

export function StoryQuiz({ storyId, questions }: Props) {
  const [state, dispatch] = useReducer(quizReducer, {
    currentIndex: 0,
    answers: {},
    revealed: false,
    phase: "quiz",
    score: null,
    error: null,
  });
  const [, startTransition] = useTransition();
  const router = useRouter();

  const question = questions[state.currentIndex];
  const selected = question ? state.answers[state.currentIndex] : undefined;
  const isLast = state.currentIndex === questions.length - 1;
  const progress = ((state.currentIndex) / questions.length) * 100;

  function handleReveal() {
    dispatch({ type: "REVEAL" });
  }

  function handleNext() {
    if (isLast) {
      handleSubmit();
    } else {
      dispatch({ type: "NEXT" });
    }
  }

  function handleSubmit() {
    const score = questions.reduce((acc, q, i) => {
      return state.answers[i] === q.correct ? acc + 1 : acc;
    }, 0);

    dispatch({ type: "SUBMIT_START" });
    startTransition(async () => {
      const { error } = await saveStoryAttempt(storyId, score, state.answers);
      if (error) {
        dispatch({ type: "ERROR", message: error });
      } else {
        dispatch({ type: "SUBMIT_DONE", score });
      }
    });
  }

  if (state.phase === "submitting") {
    return (
      <div className="flex min-h-[320px] flex-col items-center justify-center gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-emerald-600" />
        <p className="text-slate-600">Saving your results…</p>
      </div>
    );
  }

  if (state.phase === "done" && state.score !== null) {
    const pct = Math.round((state.score / questions.length) * 100);
    const msg = SCORE_MESSAGES[state.score] ?? "";
    const isGood = state.score >= 4;

    return (
      <div className="mx-auto max-w-md text-center">
        <div
          className={`mx-auto mb-6 flex h-28 w-28 items-center justify-center rounded-full shadow-lg ${isGood ? "bg-gradient-to-br from-emerald-400 to-emerald-700" : "bg-gradient-to-br from-slate-400 to-slate-600"}`}
        >
          <Trophy className="h-12 w-12 text-white" aria-hidden="true" />
        </div>

        <h2 className="text-2xl font-bold text-slate-900">
          {state.score}/{questions.length} correct
        </h2>
        <p className="mt-1 text-lg font-semibold text-emerald-700">{pct}%</p>
        <p className="mt-2 text-slate-500">{msg}</p>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <button
            type="button"
            onClick={() => router.push(`/stories/${storyId}`)}
            className="rounded-full border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-slate-300"
          >
            Review story
          </button>
          <button
            type="button"
            onClick={() => router.push("/stories")}
            className="rounded-full bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700"
          >
            Read another story
          </button>
        </div>
      </div>
    );
  }

  if (!question) return null;

  return (
    <div className="mx-auto max-w-xl">
      {/* Progress */}
      <div className="mb-6">
        <div className="mb-1.5 flex justify-between text-xs text-slate-500">
          <span>Question {state.currentIndex + 1} of {questions.length}</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-slate-200">
          <div
            className="h-full rounded-full bg-emerald-500 transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-base font-medium leading-7 text-slate-900">
          {question.question}
        </p>

        <ul className="mt-5 flex flex-col gap-3">
          {question.options.map((opt) => {
            const isSelected = selected === opt.value;
            const isCorrect = opt.value === question.correct;
            const showCorrect = state.revealed && isCorrect;
            const showWrong = state.revealed && isSelected && !isCorrect;

            return (
              <li key={opt.value}>
                <button
                  type="button"
                  disabled={state.revealed}
                  onClick={() => dispatch({ type: "SELECT", value: opt.value })}
                  className={`flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left text-sm font-medium transition
                    ${showCorrect ? "border-emerald-500 bg-emerald-50 text-emerald-900 ring-2 ring-emerald-500/20"
                    : showWrong ? "border-red-400 bg-red-50 text-red-800"
                    : isSelected ? "border-emerald-400 bg-emerald-50 text-emerald-900 ring-2 ring-emerald-400/20"
                    : "border-slate-200 bg-white text-slate-700 hover:border-emerald-300 hover:bg-slate-50 disabled:hover:border-slate-200 disabled:hover:bg-white"}`}
                >
                  <span
                    className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-xs font-bold
                      ${showCorrect ? "border-emerald-500 bg-emerald-500 text-white"
                      : showWrong ? "border-red-400 bg-red-400 text-white"
                      : isSelected ? "border-emerald-400 bg-emerald-400 text-white"
                      : "border-slate-300 text-slate-400"}`}
                  >
                    {showCorrect ? <CheckCircle className="h-4 w-4" /> : showWrong ? <XCircle className="h-4 w-4" /> : opt.value}
                  </span>
                  {opt.label}
                </button>
              </li>
            );
          })}
        </ul>

        {state.error && (
          <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
            {state.error}
          </p>
        )}

        <div className="mt-5 flex gap-3">
          {!state.revealed && selected && (
            <button
              type="button"
              onClick={handleReveal}
              className="flex-1 rounded-full border border-slate-200 bg-white py-2.5 text-sm font-semibold text-slate-700 transition hover:border-slate-300"
            >
              Check answer
            </button>
          )}
          {state.revealed && (
            <button
              type="button"
              onClick={handleNext}
              className="flex flex-1 items-center justify-center gap-2 rounded-full bg-emerald-600 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700"
            >
              {isLast ? "See results" : "Next question"}
              <ChevronRight className="h-4 w-4" aria-hidden="true" />
            </button>
          )}
          {!selected && !state.revealed && (
            <button
              type="button"
              disabled
              className="flex-1 rounded-full bg-emerald-600 py-2.5 text-sm font-semibold text-white opacity-40"
            >
              Select an answer
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
