"use client";

import { useMemo, useState, useTransition } from "react";
import {
  CheckCircle,
  XCircle,
  Trophy,
  Layers,
  Sparkles,
} from "lucide-react";
import {
  completeLessonQuiz,
  saveLessonProgress,
} from "@/app/actions/flashcards";
import type { Idiom } from "@/lib/flashcards/types";
import type { IdiomDailyLesson, Language } from "@/lib/supabase/types";

type Phase = "studying" | "quiz" | "completed";

type QuizQuestion = {
  idiom: Idiom;
  options: string[];
  correct: string;
};

type Props = {
  lesson: IdiomDailyLesson;
  cards: Idiom[];
  language: Language;
};

function shuffleInPlace<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j]!, a[i]!];
  }
  return a;
}

function buildQuiz(cards: Idiom[]): QuizQuestion[] {
  return cards.map((idiom) => {
    const distractors = shuffleInPlace(
      cards.filter((c) => c.id !== idiom.id).map((c) => c.translation),
    ).slice(0, 3);
    while (distractors.length < 3) {
      distractors.push(`Not: ${idiom.expression}`);
    }
    const options = shuffleInPlace([idiom.translation, ...distractors.slice(0, 3)]);
    return { idiom, options, correct: idiom.translation };
  });
}

function initialPhase(lesson: IdiomDailyLesson, cardCount: number): Phase {
  if (lesson.status === "completed") return "completed";
  if (lesson.status === "quiz") return "quiz";
  if (lesson.current_idx >= cardCount && cardCount > 0) return "quiz";
  return "studying";
}

export function FlashcardDeck({ lesson, cards, language }: Props) {
  const flag = language === "es" ? "🇪🇸" : "🇫🇷";
  const [phase, setPhase] = useState<Phase>(() =>
    initialPhase(lesson, cards.length),
  );
  const [currentIdx, setCurrentIdx] = useState(() =>
    Math.min(
      Math.max(0, lesson.current_idx),
      Math.max(0, cards.length - 1),
    ),
  );
  const [knownIds, setKnownIds] = useState<string[]>(lesson.known_ids ?? []);
  const [reviewIds, setReviewIds] = useState<string[]>(lesson.review_ids ?? []);
  const [flipped, setFlipped] = useState(false);
  const [quizIndex, setQuizIndex] = useState(0);
  const [quizAnswers, setQuizAnswers] = useState<Record<string, string>>(
    lesson.quiz_answers ?? {},
  );
  const [selected, setSelected] = useState<string | null>(null);
  const [quizScore, setQuizScore] = useState<number | null>(lesson.quiz_score);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const quiz = useMemo(() => buildQuiz(cards), [cards]);
  const total = cards.length;
  const current = cards[currentIdx];
  const progress =
    total > 0 ? Math.round((Math.min(currentIdx, total) / total) * 100) : 100;

  function persist(next: {
    currentIdx: number;
    knownIds: string[];
    reviewIds: string[];
    status?: Phase;
  }) {
    startTransition(async () => {
      const { error } = await saveLessonProgress({
        lessonId: lesson.id,
        currentIdx: next.currentIdx,
        knownIds: next.knownIds,
        reviewIds: next.reviewIds,
        status: next.status,
      });
      if (error) setSaveError(error);
    });
  }

  function markCard(knew: boolean) {
    if (!current || phase !== "studying") return;

    const nextKnown = knew
      ? knownIds.includes(current.id)
        ? knownIds
        : [...knownIds, current.id]
      : knownIds.filter((id) => id !== current.id);
    const nextReview = !knew
      ? reviewIds.includes(current.id)
        ? reviewIds
        : [...reviewIds, current.id]
      : reviewIds.filter((id) => id !== current.id);

    const isLast = currentIdx >= total - 1;
    if (isLast) {
      setKnownIds(nextKnown);
      setReviewIds(nextReview);
      setPhase("quiz");
      setFlipped(false);
      persist({
        currentIdx: total,
        knownIds: nextKnown,
        reviewIds: nextReview,
        status: "quiz",
      });
      return;
    }

    const nextIdx = currentIdx + 1;
    setKnownIds(nextKnown);
    setReviewIds(nextReview);
    setCurrentIdx(nextIdx);
    setFlipped(false);
    persist({
      currentIdx: nextIdx,
      knownIds: nextKnown,
      reviewIds: nextReview,
      status: "studying",
    });
  }

  function answerQuiz(choice: string) {
    const q = quiz[quizIndex];
    if (!q || selected) return;
    setSelected(choice);

    const nextAnswers = { ...quizAnswers, [q.idiom.id]: choice };
    setQuizAnswers(nextAnswers);

    window.setTimeout(() => {
      if (quizIndex >= quiz.length - 1) {
        const correctCount = quiz.filter(
          (item) => nextAnswers[item.idiom.id] === item.correct,
        ).length;
        const score = Math.round((correctCount / quiz.length) * 100);
        setQuizScore(score);
        setPhase("completed");
        startTransition(async () => {
          const { error } = await completeLessonQuiz({
            lessonId: lesson.id,
            answers: nextAnswers,
            score,
          });
          if (error) setSaveError(error);
        });
      } else {
        setQuizIndex((i) => i + 1);
        setSelected(null);
      }
    }, 650);
  }

  // ── Completed for the day ───────────────────────────────────────────────

  if (phase === "completed") {
    return (
      <div className="flex flex-col items-center gap-6 py-10 text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-fuchsia-500/15 ring-1 ring-fuchsia-400/30">
          <Trophy className="h-10 w-10 text-fuchsia-400" aria-hidden="true" />
        </div>
        <div>
          <h2 className="text-2xl font-black text-white">Lesson complete!</h2>
          <p className="mt-2 text-sm text-slate-400">
            Nice work — you&apos;ve finished today&apos;s idiom lesson.
            Come back tomorrow for a fresh set.
          </p>
        </div>
        <div className="grid w-full max-w-sm grid-cols-3 gap-3">
          {[
            { label: "Cards", value: String(total), color: "text-fuchsia-300" },
            {
              label: "Quiz",
              value: quizScore != null ? `${quizScore}%` : "—",
              color: "text-emerald-300",
            },
            {
              label: "Known",
              value: String(knownIds.length),
              color: "text-sky-300",
            },
          ].map((stat) => (
            <div
              key={stat.label}
              className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-4"
            >
              <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
              <p className="text-xs text-slate-500">{stat.label}</p>
            </div>
          ))}
        </div>
        <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-slate-400">
          <Sparkles className="h-4 w-4 text-fuchsia-400" aria-hidden="true" />
          Tomorrow&apos;s deck is prepared overnight after you finish.
        </div>
      </div>
    );
  }

  // ── Quiz ────────────────────────────────────────────────────────────────

  if (phase === "quiz") {
    const q = quiz[quizIndex];
    if (!q) return null;
    const isCorrect = selected != null && selected === q.correct;

    return (
      <div className="flex flex-col gap-6">
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-slate-500">
            <span>
              Quiz {quizIndex + 1} of {quiz.length}
            </span>
            <span>{flag} What does it mean?</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-fuchsia-500 transition-all duration-500"
              style={{
                width: `${Math.round((quizIndex / quiz.length) * 100)}%`,
              }}
            />
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-6 text-center">
          <Layers className="mx-auto h-6 w-6 text-fuchsia-400" aria-hidden="true" />
          <p className="mt-3 text-xl font-bold text-white">{q.idiom.expression}</p>
          {q.idiom.literal && (
            <p className="mt-2 text-sm italic text-slate-500">
              Literally: &ldquo;{q.idiom.literal}&rdquo;
            </p>
          )}
        </div>

        <div className="flex flex-col gap-2">
          {q.options.map((option) => {
            let style =
              "border-white/10 bg-white/5 text-slate-200 hover:border-fuchsia-400/40 hover:bg-fuchsia-500/10";
            if (selected) {
              if (option === q.correct) {
                style =
                  "border-emerald-400/40 bg-emerald-500/15 text-emerald-200";
              } else if (option === selected) {
                style = "border-red-400/40 bg-red-500/15 text-red-200";
              } else {
                style = "border-white/5 bg-white/[0.02] text-slate-500";
              }
            }
            return (
              <button
                key={option}
                type="button"
                disabled={Boolean(selected)}
                onClick={() => answerQuiz(option)}
                className={`rounded-xl border px-4 py-3 text-left text-sm font-medium transition ${style}`}
              >
                {option}
              </button>
            );
          })}
        </div>

        {selected && (
          <p
            className={`text-center text-sm font-medium ${
              isCorrect ? "text-emerald-300" : "text-red-300"
            }`}
          >
            {isCorrect ? "Correct!" : `Answer: ${q.correct}`}
          </p>
        )}
      </div>
    );
  }

  // ── Studying ────────────────────────────────────────────────────────────

  if (!current) return null;

  return (
    <div className="flex flex-col gap-6">
      {saveError && (
        <p className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-xs text-slate-400">
          {saveError}
        </p>
      )}

      <div className="space-y-1">
        <div className="flex justify-between text-xs text-slate-500">
          <span>
            Card {Math.min(currentIdx + 1, total)} of {total}
          </span>
          <span>Daily lesson · {progress}%</span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full rounded-full bg-fuchsia-500 transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div
        className="group relative cursor-pointer"
        style={{ perspective: "1200px" }}
        onClick={() => {
          if (!flipped) setFlipped(true);
        }}
        onKeyDown={(e) => {
          if (e.key === " " || e.key === "Enter") {
            e.preventDefault();
            setFlipped(true);
          }
        }}
        role="button"
        tabIndex={0}
        aria-label={
          flipped
            ? "Card flipped — translation visible"
            : "Card — click to reveal translation"
        }
      >
        <div
          className="relative transition-transform duration-500"
          style={{
            transformStyle: "preserve-3d",
            transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)",
            minHeight: "240px",
          }}
        >
          <div
            className="absolute inset-0 flex flex-col items-center justify-center gap-3 rounded-2xl border border-fuchsia-500/20 bg-gradient-to-b from-[#16162a] to-[#0d0d1a] p-8 shadow-lg"
            style={{ backfaceVisibility: "hidden" }}
          >
            <span className="text-3xl" aria-hidden="true">
              {flag}
            </span>
            <p className="text-center text-2xl font-bold leading-snug text-white">
              {current.expression}
            </p>
            {current.literal && (
              <p className="text-center text-sm italic text-slate-500">
                Literally: &ldquo;{current.literal}&rdquo;
              </p>
            )}
            <p className="mt-3 text-xs text-slate-500">Click to reveal meaning</p>
          </div>

          <div
            className="absolute inset-0 flex flex-col items-center justify-center gap-3 rounded-2xl border border-emerald-500/25 bg-gradient-to-b from-emerald-950/80 to-[#0d0d1a] p-8 shadow-lg"
            style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
          >
            <p className="text-center text-xl font-bold text-emerald-200">
              {current.translation}
            </p>
            <div className="w-full max-w-sm space-y-1 rounded-xl border border-white/10 bg-white/[0.04] p-4 text-sm">
              <p className="font-medium text-slate-200">{current.exampleTarget}</p>
              <p className="italic text-slate-500">{current.exampleEnglish}</p>
            </div>
          </div>
        </div>
      </div>

      {flipped && (
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => markCard(false)}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-red-400/30 bg-red-500/10 py-3 text-sm font-semibold text-red-300 transition hover:bg-red-500/20"
          >
            <XCircle className="h-5 w-5" aria-hidden="true" />
            Still learning
          </button>
          <button
            type="button"
            onClick={() => markCard(true)}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-emerald-400/30 bg-emerald-500/10 py-3 text-sm font-semibold text-emerald-300 transition hover:bg-emerald-500/20"
          >
            <CheckCircle className="h-5 w-5" aria-hidden="true" />
            Got it!
          </button>
        </div>
      )}
    </div>
  );
}
