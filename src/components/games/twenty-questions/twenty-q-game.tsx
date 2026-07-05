"use client";

import { useState, useRef, useCallback } from "react";
import { Send, RefreshCw, ArrowLeft, Lightbulb } from "lucide-react";
import Link from "next/link";
import type { Language } from "@/lib/supabase/types";

const MAX_QUESTIONS = 20;

const LANG_META: Record<Language, { name: string; flag: string; placeholder: string; yesLabel: string }> = {
  es: {
    name: "Spanish",
    flag: "🇪🇸",
    placeholder: "Escribe tu pregunta en español…",
    yesLabel: "Sí",
  },
  fr: {
    name: "French",
    flag: "🇫🇷",
    placeholder: "Écris ta question en français…",
    yesLabel: "Oui",
  },
};

type QAPair = {
  question: string;
  answer: string;
  type: "answer" | "error" | "guess";
};

type GameState =
  | { phase: "idle" }
  | { phase: "loading_start" }
  | { phase: "playing"; secretWord: string; secretInTargetLanguage: string; openingHint: string }
  | { phase: "won"; secretWord: string; secretInTargetLanguage: string }
  | { phase: "lost"; secretWord: string; secretInTargetLanguage: string };

type Props = { language: Language; cefrLevel: string };

export function TwentyQGame({ language, cefrLevel }: Props) {
  const meta = LANG_META[language];

  const [game, setGame] = useState<GameState>({ phase: "idle" });
  const [history, setHistory] = useState<QAPair[]>([]);
  const [questionsUsed, setQuestionsUsed] = useState(0);
  const [input, setInput] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [guessMode, setGuessMode] = useState(false);
  const historyRef = useRef<HTMLDivElement>(null);

  const scrollBottom = () =>
    setTimeout(() => historyRef.current?.scrollTo({ top: 99999, behavior: "smooth" }), 50);

  // ── Start a new game ──────────────────────────────────────────────────────
  const startGame = useCallback(async () => {
    setGame({ phase: "loading_start" });
    setHistory([]);
    setQuestionsUsed(0);
    setGuessMode(false);
    setInput("");

    const res = await fetch("/api/games/twenty-questions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "start", language, cefrLevel }),
    });
    const data = (await res.json()) as {
      wordInEnglish?: string;
      wordInTargetLanguage?: string;
      openingHint?: string;
      error?: string;
    };

    if (data.error || !data.wordInEnglish) {
      setGame({ phase: "idle" });
      return;
    }
    setGame({
      phase: "playing",
      secretWord: data.wordInEnglish,
      secretInTargetLanguage: data.wordInTargetLanguage ?? "",
      openingHint: data.openingHint ?? "",
    });
  }, [language, cefrLevel]);

  // ── Ask a question ────────────────────────────────────────────────────────
  const askQuestion = useCallback(async () => {
    if (game.phase !== "playing" || !input.trim() || isSubmitting) return;
    const q = input.trim();
    setInput("");
    setIsSubmitting(true);

    const res = await fetch("/api/games/twenty-questions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "ask",
        language,
        secretWord: game.secretWord,
        question: q,
      }),
    });
    const data = (await res.json()) as {
      isCorrectLanguage?: boolean;
      responseText?: string;
      error?: string;
    };

    const text = data.responseText ?? `Please ask in ${meta.name}.`;

    if (data.isCorrectLanguage === false) {
      setHistory((h) => [
        ...h,
        { question: q, answer: text, type: "error" },
      ]);
    } else {
      const used = questionsUsed + 1;
      setQuestionsUsed(used);
      setHistory((h) => [
        ...h,
        { question: q, answer: text, type: "answer" },
      ]);

      if (used >= MAX_QUESTIONS) {
        setGame({
          phase: "lost",
          secretWord: game.secretWord,
          secretInTargetLanguage: game.secretInTargetLanguage,
        });
      }
    }

    setIsSubmitting(false);
    scrollBottom();
  }, [game, input, isSubmitting, language, meta.name, questionsUsed]);

  // ── Submit a guess ────────────────────────────────────────────────────────
  const submitGuess = useCallback(async () => {
    if (game.phase !== "playing" || !input.trim() || isSubmitting) return;
    const g = input.trim();
    setInput("");
    setIsSubmitting(true);

    const res = await fetch("/api/games/twenty-questions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "guess",
        language,
        secretWord: game.secretWord,
        secretInTargetLanguage: game.secretInTargetLanguage,
        guess: g,
      }),
    });
    const data = (await res.json()) as { correct?: boolean; message?: string };

    setHistory((h) => [
      ...h,
      { question: `(Guess) ${g}`, answer: data.message ?? "…", type: "guess" },
    ]);

    if (data.correct) {
      setGame({
        phase: "won",
        secretWord: game.secretWord,
        secretInTargetLanguage: game.secretInTargetLanguage,
      });
    } else {
      setQuestionsUsed((q) => Math.min(q + 1, MAX_QUESTIONS));
    }

    setGuessMode(false);
    setIsSubmitting(false);
    scrollBottom();
  }, [game, input, isSubmitting, language]);

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (guessMode) void submitGuess();
      else void askQuestion();
    }
  }

  const remaining = MAX_QUESTIONS - questionsUsed;

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="flex min-h-screen flex-col bg-[#07070f]">
      {/* Header */}
      <header className="flex items-center justify-between border-b border-white/8 bg-gradient-to-r from-[#0d0d1e] to-[#12122a] px-6 py-4">
        <Link
          href="/gameroom"
          className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-300 hover:bg-white/10 hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          Games
        </Link>
        <div className="flex items-center gap-2">
          <span className="text-xl" aria-hidden="true">❓</span>
          <div className="text-center">
            <p className="font-extrabold text-white">20 Questions</p>
            <p className="text-xs text-slate-400">{meta.flag} {meta.name}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => void startGame()}
          className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-300 hover:bg-white/10 hover:text-white"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          New
        </button>
      </header>

      {/* Idle state */}
      {game.phase === "idle" && (
        <div className="flex flex-1 flex-col items-center justify-center gap-6 p-8 text-center">
          <span className="text-6xl" aria-hidden="true">🤔</span>
          <div>
            <h2 className="text-2xl font-extrabold text-white">Can you guess what I&apos;m thinking of?</h2>
            <p className="mt-2 text-slate-400">
              Ask me up to {MAX_QUESTIONS} yes/no questions in {meta.name} to figure it out.
              <br />
              <span className="text-amber-400 font-semibold">Questions in English will be rejected.</span>
            </p>
          </div>
          <button
            type="button"
            onClick={() => void startGame()}
            className="rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 px-8 py-4 text-lg font-bold text-white shadow-lg shadow-cyan-500/25 hover:from-cyan-400 hover:to-blue-500"
          >
            Start Game
          </button>
        </div>
      )}

      {/* Loading */}
      {game.phase === "loading_start" && (
        <div className="flex flex-1 items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-white/10 border-t-cyan-500" />
            <p className="text-slate-400">Thinking of something…</p>
          </div>
        </div>
      )}

      {/* Playing / Won / Lost */}
      {(game.phase === "playing" || game.phase === "won" || game.phase === "lost") && (
        <>
          {/* Opening hint */}
          <div className="border-b border-white/8 bg-cyan-500/8 px-6 py-3">
            <div className="mx-auto flex max-w-2xl items-start gap-2">
              <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-cyan-400" aria-hidden="true" />
              <p className="text-sm text-cyan-200">
                {game.phase === "playing"
                  ? (game as { openingHint: string }).openingHint
                  : `The answer was: `}
                {game.phase !== "playing" && (
                  <span className="font-bold text-white">
                    {(game as { secretInTargetLanguage: string }).secretInTargetLanguage} (
                    {(game as { secretWord: string }).secretWord})
                  </span>
                )}
              </p>
            </div>
          </div>

          {/* Progress bar */}
          {game.phase === "playing" && (
            <div className="px-6 pt-3">
              <div className="mx-auto max-w-2xl">
                <div className="mb-1 flex justify-between text-xs text-slate-500">
                  <span>{questionsUsed} questions asked</span>
                  <span className={remaining <= 5 ? "text-rose-400 font-bold" : ""}>{remaining} remaining</span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/8">
                  <div
                    className={`h-full rounded-full transition-all ${remaining <= 5 ? "bg-rose-500" : "bg-cyan-500"}`}
                    style={{ width: `${(questionsUsed / MAX_QUESTIONS) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Result banner */}
          {(game.phase === "won" || game.phase === "lost") && (
            <div className={`mx-auto my-4 max-w-2xl w-full px-6`}>
              <div className={`rounded-2xl border px-5 py-4 text-center ${
                game.phase === "won"
                  ? "border-emerald-500/40 bg-emerald-500/10"
                  : "border-rose-500/40 bg-rose-500/10"
              }`}>
                <p className={`text-xl font-extrabold ${game.phase === "won" ? "text-emerald-400" : "text-rose-400"}`}>
                  {game.phase === "won" ? "🎉 ¡Correcto!" : "😔 Game Over"}
                </p>
                <button
                  type="button"
                  onClick={() => void startGame()}
                  className="mt-3 rounded-xl bg-white/10 px-5 py-2 text-sm font-semibold text-white hover:bg-white/20"
                >
                  Play Again
                </button>
              </div>
            </div>
          )}

          {/* Q&A history */}
          <div
            ref={historyRef}
            className="mx-auto w-full max-w-2xl flex-1 overflow-y-auto px-6 py-4 space-y-3"
          >
            {history.length === 0 && game.phase === "playing" && (
              <p className="py-8 text-center text-slate-500">
                No questions yet. Ask your first question in {meta.name}!
              </p>
            )}
            {history.map((pair, i) => (
              <div key={i} className="flex flex-col gap-1">
                {/* Question */}
                <div className={`self-end rounded-2xl rounded-br-sm px-4 py-2.5 text-sm ${
                  pair.type === "error"
                    ? "border border-rose-500/30 bg-rose-500/10 text-rose-300"
                    : pair.type === "guess"
                      ? "border border-violet-500/30 bg-violet-500/10 text-violet-200"
                      : "bg-gradient-to-br from-cyan-500 to-blue-600 text-white"
                }`}>
                  {pair.question}
                </div>
                {/* Answer */}
                <div className="self-start rounded-2xl rounded-bl-sm border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-slate-200">
                  {pair.answer}
                </div>
              </div>
            ))}
          </div>

          {/* Input */}
          {game.phase === "playing" && (
            <div className="border-t border-white/8 bg-[#0d0d1e] px-6 py-4">
              <div className="mx-auto max-w-2xl">
                {/* Toggle: question vs guess */}
                <div className="mb-3 flex gap-2">
                  <button
                    type="button"
                    onClick={() => setGuessMode(false)}
                    className={`rounded-xl px-4 py-1.5 text-xs font-bold transition ${
                      !guessMode
                        ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30"
                        : "border border-white/10 text-slate-500 hover:text-slate-300"
                    }`}
                  >
                    Ask a question
                  </button>
                  <button
                    type="button"
                    onClick={() => setGuessMode(true)}
                    className={`rounded-xl px-4 py-1.5 text-xs font-bold transition ${
                      guessMode
                        ? "bg-violet-500/20 text-violet-300 border border-violet-500/30"
                        : "border border-white/10 text-slate-500 hover:text-slate-300"
                    }`}
                  >
                    Make a guess
                  </button>
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={onKeyDown}
                    placeholder={guessMode ? "What is it?" : meta.placeholder}
                    disabled={isSubmitting}
                    className="flex-1 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-slate-600 outline-none transition focus:border-cyan-500/40 focus:ring-2 focus:ring-cyan-500/15 disabled:opacity-60"
                  />
                  <button
                    type="button"
                    onClick={() => void (guessMode ? submitGuess() : askQuestion())}
                    disabled={!input.trim() || isSubmitting}
                    className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-white shadow-lg transition disabled:opacity-40 ${
                      guessMode
                        ? "bg-gradient-to-br from-violet-500 to-purple-600 shadow-violet-500/25"
                        : "bg-gradient-to-br from-cyan-500 to-blue-600 shadow-cyan-500/25"
                    }`}
                  >
                    <Send className="h-4 w-4" />
                  </button>
                </div>

                {!guessMode && (
                  <p className="mt-2 text-center text-xs text-slate-600">
                    Questions must be in {meta.name} — English will be rejected
                  </p>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
