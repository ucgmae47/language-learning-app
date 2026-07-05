"use client";

import { useState, useCallback } from "react";
import { RefreshCw, ArrowLeft } from "lucide-react";
import Link from "next/link";
import type { Language } from "@/lib/supabase/types";

const MAX_WRONG = 6;

const LANG_META: Record<Language, { name: string; flag: string }> = {
  es: { name: "Spanish", flag: "🇪🇸" },
  fr: { name: "French", flag: "🇫🇷" },
};

const ALPHA = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

// ── Hangman SVG — progressively reveals body parts ───────────────────────────

function HangmanSVG({ wrong }: { wrong: number }) {
  const show = (n: number) => wrong >= n;
  return (
    <svg
      viewBox="0 0 200 220"
      className="w-40 sm:w-48"
      aria-label={`Hangman drawing: ${wrong} wrong guesses`}
    >
      {/* Gallows */}
      <line x1="20" y1="210" x2="180" y2="210" stroke="#475569" strokeWidth="4" strokeLinecap="round" />
      <line x1="60" y1="210" x2="60" y2="20"  stroke="#475569" strokeWidth="4" strokeLinecap="round" />
      <line x1="60" y1="20"  x2="130" y2="20" stroke="#475569" strokeWidth="4" strokeLinecap="round" />
      <line x1="130" y1="20" x2="130" y2="45" stroke="#475569" strokeWidth="4" strokeLinecap="round" />

      {/* Head */}
      {show(1) && <circle cx="130" cy="60" r="15" stroke="#f1f5f9" strokeWidth="3" fill="none" />}
      {/* Body */}
      {show(2) && <line x1="130" y1="75" x2="130" y2="135" stroke="#f1f5f9" strokeWidth="3" strokeLinecap="round" />}
      {/* Left arm */}
      {show(3) && <line x1="130" y1="90" x2="105" y2="115" stroke="#f1f5f9" strokeWidth="3" strokeLinecap="round" />}
      {/* Right arm */}
      {show(4) && <line x1="130" y1="90" x2="155" y2="115" stroke="#f1f5f9" strokeWidth="3" strokeLinecap="round" />}
      {/* Left leg */}
      {show(5) && <line x1="130" y1="135" x2="105" y2="165" stroke="#f1f5f9" strokeWidth="3" strokeLinecap="round" />}
      {/* Right leg */}
      {show(6) && <line x1="130" y1="135" x2="155" y2="165" stroke="#f1f5f9" strokeWidth="3" strokeLinecap="round" />}
    </svg>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

type Props = {
  getWord: () => string;
  language: Language;
};

export function HangmanGame({ getWord, language }: Props) {
  const meta = LANG_META[language];

  const [target, setTarget] = useState<string>(() => getWord());
  const [guessed, setGuessed] = useState<Set<string>>(new Set());

  const wrong = [...guessed].filter((l) => !target.includes(l)).length;
  const won = target.split("").every((l) => guessed.has(l));
  const lost = wrong >= MAX_WRONG;
  const status: "playing" | "won" | "lost" = won ? "won" : lost ? "lost" : "playing";

  const guess = useCallback(
    (letter: string) => {
      if (status !== "playing" || guessed.has(letter)) return;
      setGuessed((g) => new Set([...g, letter]));
    },
    [status, guessed],
  );

  const reset = useCallback(() => {
    setTarget(getWord());
    setGuessed(new Set());
  }, [getWord]);

  // Keyboard support
  useState(() => {
    function onKey(e: KeyboardEvent) {
      if (/^[a-zA-Z]$/.test(e.key)) guess(e.key.toUpperCase());
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  return (
    <div className="flex min-h-screen flex-col items-center bg-[#07070f]">
      {/* Header */}
      <header className="flex w-full items-center justify-between border-b border-white/8 bg-gradient-to-r from-[#0d0d1e] to-[#12122a] px-6 py-4">
        <Link
          href="/gameroom"
          className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-300 hover:bg-white/10 hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          Games
        </Link>
        <div className="flex items-center gap-2">
          <span className="text-xl" aria-hidden="true">🪢</span>
          <div className="text-center">
            <p className="font-extrabold text-white">Hangman</p>
            <p className="text-xs text-slate-400">{meta.flag} {meta.name}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={reset}
          className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-300 hover:bg-white/10 hover:text-white"
          aria-label="New word"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          New
        </button>
      </header>

      <main className="flex w-full max-w-md flex-1 flex-col items-center gap-8 px-4 py-8">
        {/* Drawing + wrong count */}
        <div className="flex flex-col items-center gap-2">
          <HangmanSVG wrong={wrong} />
          <p className={`text-sm font-semibold ${wrong >= 5 ? "text-rose-400" : "text-slate-400"}`}>
            {wrong} / {MAX_WRONG} wrong
          </p>
        </div>

        {/* Word display */}
        <div className="flex flex-wrap justify-center gap-2">
          {target.split("").map((letter, i) => (
            <div
              key={i}
              className={`flex h-12 w-10 items-end justify-center border-b-2 pb-1 text-xl font-extrabold uppercase transition
                ${guessed.has(letter)
                  ? "border-emerald-500 text-white"
                  : status === "lost"
                    ? "border-rose-500/50 text-rose-400"
                    : "border-white/20 text-transparent"
                }`}
            >
              {guessed.has(letter) || status === "lost" ? letter : ""}
            </div>
          ))}
        </div>

        {/* Result banner */}
        {status !== "playing" && (
          <div className={`w-full rounded-2xl border px-5 py-4 text-center ${
            status === "won"
              ? "border-emerald-500/40 bg-emerald-500/10"
              : "border-rose-500/40 bg-rose-500/10"
          }`}>
            <p className={`text-xl font-extrabold ${status === "won" ? "text-emerald-400" : "text-rose-400"}`}>
              {status === "won" ? "🎉 You got it!" : `😔 The word was ${target}`}
            </p>
            <button
              type="button"
              onClick={reset}
              className="mt-3 rounded-xl bg-white/10 px-5 py-2 text-sm font-semibold text-white hover:bg-white/20"
            >
              Play Again
            </button>
          </div>
        )}

        {/* Letter keyboard */}
        <div className="flex flex-wrap justify-center gap-1.5">
          {ALPHA.map((letter) => {
            const isGuessed = guessed.has(letter);
            const isCorrect = isGuessed && target.includes(letter);
            const isWrong = isGuessed && !target.includes(letter);
            return (
              <button
                key={letter}
                type="button"
                onClick={() => guess(letter)}
                disabled={isGuessed || status !== "playing"}
                className={`flex h-10 w-10 items-center justify-center rounded-lg text-sm font-bold uppercase transition
                  ${isCorrect ? "bg-emerald-600 text-white" : ""}
                  ${isWrong ? "bg-white/5 text-slate-600 cursor-default" : ""}
                  ${!isGuessed && status === "playing" ? "bg-white/10 text-white hover:bg-white/20" : ""}
                  ${!isGuessed && status !== "playing" ? "bg-white/5 text-slate-600" : ""}
                `}
                aria-label={letter}
                aria-pressed={isGuessed}
              >
                {letter}
              </button>
            );
          })}
        </div>
      </main>
    </div>
  );
}
