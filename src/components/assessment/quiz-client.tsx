"use client";

import { useReducer, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle, ChevronRight, Loader2 } from "lucide-react";
import { calculateCefrLevel, LEVEL_DESCRIPTIONS } from "@/lib/assessment/questions";
import type { Question } from "@/lib/assessment/questions";
import { saveAssessmentResult } from "@/app/actions/assessment";
import type { CefrLevel, Language } from "@/lib/supabase/types";

type QuizState = {
  currentIndex: number;
  answers: Record<number, string>;
  phase: "quiz" | "submitting" | "done";
  result: CefrLevel | null;
  error: string | null;
};

type QuizAction =
  | { type: "ANSWER"; questionId: number; value: string }
  | { type: "NEXT" }
  | { type: "SUBMIT_START" }
  | { type: "SUBMIT_DONE"; result: CefrLevel }
  | { type: "ERROR"; message: string };

const initialState: QuizState = {
  currentIndex: 0,
  answers: {},
  phase: "quiz",
  result: null,
  error: null,
};

function quizReducer(state: QuizState, action: QuizAction): QuizState {
  switch (action.type) {
    case "ANSWER":
      return { ...state, answers: { ...state.answers, [action.questionId]: action.value } };
    case "NEXT":
      return { ...state, currentIndex: state.currentIndex + 1 };
    case "SUBMIT_START":
      return { ...state, phase: "submitting", error: null };
    case "SUBMIT_DONE":
      return { ...state, phase: "done", result: action.result };
    case "ERROR":
      return { ...state, phase: "quiz", error: action.message };
    default:
      return state;
  }
}

const BAND_LABELS: Record<string, string> = {
  A2: "Elementary",
  B1: "Intermediate",
  B2: "Upper-Intermediate",
};

const RESULT_COLORS: Record<CefrLevel, string> = {
  A1: "from-slate-500 to-slate-700",
  A2: "from-sky-500 to-sky-700",
  B1: "from-emerald-500 to-emerald-700",
  B2: "from-violet-500 to-violet-700",
  C1: "from-amber-500 to-amber-700",
  C2: "from-rose-500 to-rose-700",
};

type Props = {
  questions: Question[];
  language: Language;
};

export function QuizClient({ questions, language }: Props) {
  const [state, dispatch] = useReducer(quizReducer, initialState);
  const [, startTransition] = useTransition();
  const router = useRouter();

  const question = questions[state.currentIndex];
  const isLast = state.currentIndex === questions.length - 1;
  const selectedAnswer = question ? state.answers[question.id] : undefined;
  const progress = (state.currentIndex / questions.length) * 100;

  function handleSelect(value: string) {
    if (!question || state.phase !== "quiz") return;
    dispatch({ type: "ANSWER", questionId: question.id, value });
  }

  function handleNext() {
    if (!selectedAnswer) return;
    if (isLast) {
      handleSubmit();
    } else {
      dispatch({ type: "NEXT" });
    }
  }

  function handleSubmit() {
    const level = calculateCefrLevel(state.answers, questions);
    dispatch({ type: "SUBMIT_START" });
    startTransition(async () => {
      const { error, hasInterests } = await saveAssessmentResult(language, level);
      if (error) {
        dispatch({ type: "ERROR", message: error });
      } else {
        dispatch({ type: "SUBMIT_DONE", result: level });
        // Redirect after a short display delay so the user sees their result.
        setTimeout(() => {
          router.push(hasInterests ? "/dashboard" : "/onboarding/interests");
        }, 3500);
      }
    });
  }

  if (state.phase === "submitting") {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-emerald-600" />
        <p className="text-slate-600">Calculating your level…</p>
      </div>
    );
  }

  if (state.phase === "done" && state.result) {
    const level = state.result;
    const langFlag = language === "fr" ? "🇫🇷" : "🇪🇸";
    const langName = language === "fr" ? "French" : "Spanish";
    return (
      <div className="mx-auto max-w-md text-center">
        <div
          className={`mx-auto mb-6 flex h-28 w-28 items-center justify-center rounded-full bg-gradient-to-br ${RESULT_COLORS[level]} shadow-lg`}
        >
          <span className="text-4xl font-bold text-white">{level}</span>
        </div>

        <h2 className="text-2xl font-bold text-slate-900">
          Your {langFlag} {langName} level: {level}
        </h2>
        <p className="mt-2 text-slate-600">{LEVEL_DESCRIPTIONS[level]}</p>

        <div className="mt-6 rounded-2xl border border-emerald-100 bg-emerald-50 p-5 text-left">
          <p className="text-sm font-medium text-emerald-800">What happens next?</p>
          <p className="mt-1 text-sm text-emerald-700">
            Stories, quizzes, and chatbot prompts will now be tailored to your{" "}
            <strong>{level}</strong> {langName} level. Redirecting you now…
          </p>
        </div>

        <div className="mt-4 flex items-center justify-center gap-2 text-sm text-slate-400">
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          Taking you to the next step…
        </div>
      </div>
    );
  }

  if (!question) return null;

  const bandLabel = BAND_LABELS[question.band] ?? question.band;

  return (
    <div className="mx-auto max-w-xl">
      {/* Progress bar */}
      <div className="mb-6">
        <div className="mb-1.5 flex items-center justify-between text-xs text-slate-500">
          <span>
            Question {state.currentIndex + 1} of {questions.length}
          </span>
          <span className="rounded-full border border-slate-200 bg-white px-2 py-0.5 font-medium">
            {bandLabel}
          </span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-slate-200">
          <div
            className="h-full rounded-full bg-emerald-500 transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Question card */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-base font-medium leading-7 text-slate-900">
          {question.prompt}
        </p>

        <ul className="mt-5 flex flex-col gap-3">
          {question.options.map((opt) => {
            const isSelected = selectedAnswer === opt.value;
            return (
              <li key={opt.value}>
                <button
                  type="button"
                  onClick={() => handleSelect(opt.value)}
                  className={`flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left text-sm font-medium transition
                    ${
                      isSelected
                        ? "border-emerald-500 bg-emerald-50 text-emerald-900 ring-2 ring-emerald-500/20"
                        : "border-slate-200 bg-white text-slate-700 hover:border-emerald-300 hover:bg-slate-50"
                    }`}
                >
                  <span
                    className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-xs font-bold
                      ${isSelected ? "border-emerald-500 bg-emerald-500 text-white" : "border-slate-300 text-slate-400"}`}
                  >
                    {isSelected ? (
                      <CheckCircle className="h-4 w-4" />
                    ) : (
                      opt.value
                    )}
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

        <button
          type="button"
          disabled={!selectedAnswer}
          onClick={handleNext}
          className="mt-5 flex w-full items-center justify-center gap-2 rounded-full bg-emerald-600 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:opacity-40"
        >
          {isLast ? "See my result" : "Next question"}
          <ChevronRight className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
