"use client";

import { useReducer, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle, ChevronRight, Flag, HelpCircle, Loader2 } from "lucide-react";
import {
  calculateCefrLevel,
  LEVEL_DESCRIPTIONS,
  NOT_SURE,
} from "@/lib/assessment/questions";
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

const BAND_LABELS: Record<CefrLevel, string> = {
  A1: "Beginner",
  A2: "Elementary",
  B1: "Intermediate",
  B2: "Upper-Intermediate",
  C1: "Advanced",
  C2: "Mastery",
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
  /**
   * True when a Supabase session exists (server-rendered).
   * False for first-time visitors who haven't created an account yet.
   * Controls whether the quiz result is saved directly or encoded in a
   * signup URL so it can be applied after account creation.
   */
  isAuthenticated: boolean;
};

function fillUnansweredAsNotSure(
  answers: Record<number, string>,
  questions: Question[],
): Record<number, string> {
  const filled = { ...answers };
  for (const q of questions) {
    if (!filled[q.id]) filled[q.id] = NOT_SURE;
  }
  return filled;
}

export function QuizClient({ questions, language, isAuthenticated }: Props) {
  const [state, dispatch] = useReducer(quizReducer, initialState);
  const [, startTransition] = useTransition();
  const router = useRouter();

  const question = questions[state.currentIndex];
  const isLast = state.currentIndex === questions.length - 1;
  const selectedAnswer = question ? state.answers[question.id] : undefined;
  const progress = ((state.currentIndex + (selectedAnswer ? 1 : 0)) / questions.length) * 100;
  const canFinishEarly = state.currentIndex > 0 || !!selectedAnswer;

  function handleSelect(value: string) {
    if (!question || state.phase !== "quiz") return;
    dispatch({ type: "ANSWER", questionId: question.id, value });
  }

  function handleNext() {
    if (!selectedAnswer) return;
    if (isLast) {
      handleSubmit(state.answers);
    } else {
      dispatch({ type: "NEXT" });
    }
  }

  function handleFinishEarly() {
    if (!canFinishEarly || state.phase !== "quiz") return;
    const filled = fillUnansweredAsNotSure(state.answers, questions);
    handleSubmit(filled);
  }

  function handleSubmit(answers: Record<number, string>) {
    const level = calculateCefrLevel(answers, questions);
    dispatch({ type: "SUBMIT_START" });

    if (!isAuthenticated) {
      dispatch({ type: "SUBMIT_DONE", result: level });
      setTimeout(() => {
        router.push(`/signup?assessment=${language}:${level}`);
      }, 3500);
      return;
    }

    startTransition(async () => {
      const { error, hasInterests } = await saveAssessmentResult(language, level);
      if (error) {
        dispatch({ type: "ERROR", message: error });
      } else {
        dispatch({ type: "SUBMIT_DONE", result: level });
        setTimeout(() => {
          router.push(hasInterests ? "/dashboard" : "/onboarding/interests");
          router.refresh();
        }, 3500);
      }
    });
  }

  if (state.phase === "submitting") {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-emerald-600" />
        <p className="text-slate-400">Calculating your level…</p>
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

        <h2 className="text-2xl font-bold text-white">
          Your {langFlag} {langName} level: {level}
        </h2>
        <p className="mt-2 text-slate-400">{LEVEL_DESCRIPTIONS[level]}</p>

        <div className="mt-6 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-5 text-left">
          <p className="text-sm font-medium text-emerald-300">What happens next?</p>
          <p className="mt-1 text-sm text-emerald-200">
            {isAuthenticated
              ? <>Stories, quizzes, and chatbot prompts will be tailored to your <strong>{level}</strong> {langName} level. Redirecting you now…</>
              : <>Create your free account and everything will be personalised to your <strong>{level}</strong> {langName} level from day one. Redirecting you now…</>
            }
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
  const isNotSureSelected = selectedAnswer === NOT_SURE;

  return (
    <div className="mx-auto max-w-xl">
      {/* Progress bar */}
      <div className="mb-6">
        <div className="mb-1.5 flex items-center justify-between text-xs text-slate-500">
          <span>
            Question {state.currentIndex + 1} of {questions.length}
          </span>
          <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 font-medium text-slate-300">
            {question.band} · {bandLabel}
          </span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full rounded-full bg-emerald-500 transition-all duration-300"
            style={{ width: `${Math.min(progress, 100)}%` }}
          />
        </div>
      </div>

      {/* Question card */}
      <div className="rounded-2xl border border-white/10 bg-white p-6 shadow-sm">
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

          <li>
            <button
              type="button"
              onClick={() => handleSelect(NOT_SURE)}
              className={`flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left text-sm font-medium transition
                ${
                  isNotSureSelected
                    ? "border-slate-400 bg-slate-100 text-slate-800 ring-2 ring-slate-400/20"
                    : "border-dashed border-slate-300 bg-slate-50 text-slate-600 hover:border-slate-400 hover:bg-slate-100"
                }`}
            >
              <span
                className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-xs
                  ${isNotSureSelected ? "border-slate-500 bg-slate-500 text-white" : "border-slate-300 text-slate-400"}`}
              >
                {isNotSureSelected ? (
                  <CheckCircle className="h-4 w-4" />
                ) : (
                  <HelpCircle className="h-3.5 w-3.5" />
                )}
              </span>
              Not sure
            </button>
          </li>
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

        {canFinishEarly && !isLast && (
          <button
            type="button"
            onClick={handleFinishEarly}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-full border border-slate-200 bg-white py-2.5 text-sm font-medium text-slate-600 transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-800"
          >
            <Flag className="h-3.5 w-3.5" aria-hidden="true" />
            Too hard — finish now &amp; see my level
          </button>
        )}
      </div>

      <p className="mt-3 text-center text-xs text-slate-500">
        Prefer &ldquo;Not sure&rdquo; over guessing — lucky guesses can inflate your level.
      </p>
    </div>
  );
}
