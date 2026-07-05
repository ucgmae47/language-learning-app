"use client";

import { useState, useEffect, useCallback } from "react";
import { RotateCcw, ArrowLeft } from "lucide-react";
import Link from "next/link";
import type { Language } from "@/lib/supabase/types";

// ── Types ─────────────────────────────────────────────────────────────────────

type TileState = "empty" | "tbd" | "correct" | "present" | "absent";

type EvaluatedRow = { letter: string; state: TileState }[];

// ── Evaluation algorithm ──────────────────────────────────────────────────────

function evaluateGuess(guess: string, target: string): EvaluatedRow {
  const result: EvaluatedRow = Array.from({ length: 5 }, (_, i) => ({
    letter: guess[i] ?? "",
    state: "absent" as TileState,
  }));
  const remaining = target.split("");

  // Pass 1: correct positions
  for (let i = 0; i < 5; i++) {
    if (guess[i] === target[i]) {
      result[i]!.state = "correct";
      remaining[i] = "#";
    }
  }

  // Pass 2: present letters
  for (let i = 0; i < 5; i++) {
    if (result[i]!.state === "correct") continue;
    const idx = remaining.indexOf(guess[i]!);
    if (idx !== -1) {
      result[i]!.state = "present";
      remaining[idx] = "#";
    }
  }

  return result;
}

// ── Keyboard layout ───────────────────────────────────────────────────────────

const KEYBOARD_ROWS = [
  ["Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P"],
  ["A", "S", "D", "F", "G", "H", "J", "K", "L"],
  ["ENTER", "Z", "X", "C", "V", "B", "N", "M", "⌫"],
];

// ── Tile ──────────────────────────────────────────────────────────────────────

const TILE_STYLES: Record<TileState, string> = {
  empty:   "border-white/15 bg-transparent text-white",
  tbd:     "border-white/40 bg-white/10 text-white",
  correct: "border-emerald-500 bg-emerald-600 text-white",
  present: "border-amber-500 bg-amber-600 text-white",
  absent:  "border-white/10 bg-white/8 text-slate-400",
};

function Tile({ letter, state, reveal, delay }: {
  letter: string;
  state: TileState;
  reveal: boolean;
  delay: number;
}) {
  const [displayed, setDisplayed] = useState<TileState>(reveal ? "empty" : state);

  useEffect(() => {
    if (!reveal) {
      const id = setTimeout(() => setDisplayed(state), 0);
      return () => clearTimeout(id);
    }
    const t = setTimeout(() => setDisplayed(state), delay);
    return () => clearTimeout(t);
  }, [state, reveal, delay]);

  return (
    <div
      className={`flex h-14 w-14 items-center justify-center rounded-xl border-2 text-xl font-extrabold uppercase
        transition-colors duration-300 ${TILE_STYLES[displayed]}
        ${letter && state === "tbd" ? "scale-105" : "scale-100"} transition-transform`}
      aria-label={letter ? `${letter} — ${displayed}` : "empty"}
    >
      {letter}
    </div>
  );
}

// ── Key ───────────────────────────────────────────────────────────────────────

const KEY_STYLES: Record<TileState | "default", string> = {
  default: "bg-white/10 text-white hover:bg-white/20",
  empty:   "bg-white/10 text-white hover:bg-white/20",
  tbd:     "bg-white/10 text-white hover:bg-white/20",
  correct: "bg-emerald-600 text-white",
  present: "bg-amber-600 text-white",
  absent:  "bg-white/5 text-slate-600",
};

// ── Main game component ───────────────────────────────────────────────────────

const MAX_GUESSES = 6;
const WORD_LENGTH = 5;

const LANG_META: Record<Language, { name: string; flag: string }> = {
  es: { name: "Spanish", flag: "🇪🇸" },
  fr: { name: "French", flag: "🇫🇷" },
};

type Props = {
  target: string;
  wordList: string[];
  language: Language;
};

export function WordleGame({ target, wordList, language }: Props) {
  const meta = LANG_META[language];

  const [guesses, setGuesses] = useState<EvaluatedRow[]>([]);
  const [current, setCurrent] = useState("");
  const [status, setStatus] = useState<"playing" | "won" | "lost">("playing");
  const [shake, setShake] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  // Per-letter keyboard state — highest-priority state wins
  const keyStates = useCallback((): Record<string, TileState> => {
    const map: Record<string, TileState> = {};
    const priority: TileState[] = ["absent", "present", "correct"];
    for (const row of guesses) {
      for (const { letter, state } of row) {
        const cur = map[letter];
        if (!cur || priority.indexOf(state) > priority.indexOf(cur)) {
          map[letter] = state;
        }
      }
    }
    return map;
  }, [guesses]);

  const flash = (msg: string) => {
    setMessage(msg);
    setTimeout(() => setMessage(null), 2000);
  };

  const submitGuess = useCallback(() => {
    if (current.length !== WORD_LENGTH) {
      setShake(true);
      setTimeout(() => setShake(false), 500);
      flash("Not enough letters");
      return;
    }
    if (!wordList.includes(current) && !wordList.includes(current)) {
      // Accept any attempt — don't gate on word list for now
    }

    const evaluated = evaluateGuess(current, target);
    const nextGuesses = [...guesses, evaluated];
    setGuesses(nextGuesses);
    setCurrent("");

    const won = evaluated.every((t) => t.state === "correct");
    if (won) {
      setTimeout(() => setStatus("won"), WORD_LENGTH * 300 + 200);
      return;
    }
    if (nextGuesses.length >= MAX_GUESSES) {
      setTimeout(() => setStatus("lost"), WORD_LENGTH * 300 + 200);
    }
  }, [current, guesses, target, wordList]);

  // Physical keyboard handler
  useEffect(() => {
    if (status !== "playing") return;
    function onKey(e: KeyboardEvent) {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      if (e.key === "Enter") { submitGuess(); return; }
      if (e.key === "Backspace") { setCurrent((c) => c.slice(0, -1)); return; }
      if (/^[a-zA-Z]$/.test(e.key) && current.length < WORD_LENGTH) {
        setCurrent((c) => c + e.key.toUpperCase());
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [status, current, submitGuess]);

  // Virtual keyboard handler
  function onVirtualKey(key: string) {
    if (status !== "playing") return;
    if (key === "ENTER") { submitGuess(); return; }
    if (key === "⌫") { setCurrent((c) => c.slice(0, -1)); return; }
    if (current.length < WORD_LENGTH) setCurrent((c) => c + key);
  }

  const keys = keyStates();

  return (
    <div className="flex min-h-screen flex-col items-center bg-[#07070f] pt-4">
      {/* Header */}
      <div className="mb-4 flex w-full max-w-sm items-center justify-between px-4">
        <Link
          href="/gameroom"
          className="flex items-center gap-1 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-slate-400 hover:text-white"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Games
        </Link>
        <div className="text-center">
          <h1 className="text-lg font-extrabold text-white">
            {meta.flag} Wordle
          </h1>
          <p className="text-[10px] text-slate-500">Daily {meta.name} word</p>
        </div>
        <button
          type="button"
          onClick={() => {
            setGuesses([]);
            setCurrent("");
            setStatus("playing");
          }}
          className="flex items-center gap-1 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-slate-400 hover:text-white"
          aria-label="Restart"
        >
          <RotateCcw className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Flash message */}
      {message && (
        <div className="mb-3 rounded-xl border border-white/10 bg-white/10 px-4 py-2 text-sm font-bold text-white">
          {message}
        </div>
      )}

      {/* Grid */}
      <div className="mb-6 flex flex-col gap-1.5">
        {Array.from({ length: MAX_GUESSES }, (_, rowIdx) => {
          const evaluated = guesses[rowIdx];
          const isCurrentRow = !evaluated && rowIdx === guesses.length;
          const isRevealing = !!evaluated;

          return (
            <div
              key={rowIdx}
              className={`flex gap-1.5 ${isCurrentRow && shake ? "animate-[shake_0.4s_ease]" : ""}`}
            >
              {Array.from({ length: WORD_LENGTH }, (_, colIdx) => {
                let letter = "";
                let state: TileState = "empty";

                if (evaluated) {
                  letter = evaluated[colIdx]?.letter ?? "";
                  state = evaluated[colIdx]?.state ?? "absent";
                } else if (isCurrentRow) {
                  letter = current[colIdx] ?? "";
                  state = letter ? "tbd" : "empty";
                }

                return (
                  <Tile
                    key={colIdx}
                    letter={letter}
                    state={state}
                    reveal={isRevealing}
                    delay={colIdx * 300}
                  />
                );
              })}
            </div>
          );
        })}
      </div>

      {/* Result banner */}
      {status !== "playing" && (
        <div
          className={`mb-6 rounded-2xl border px-6 py-4 text-center ${
            status === "won"
              ? "border-emerald-500/40 bg-emerald-500/10"
              : "border-rose-500/40 bg-rose-500/10"
          }`}
        >
          {status === "won" ? (
            <>
              <p className="text-2xl font-extrabold text-emerald-400">
                {guesses.length === 1 ? "Genius! 🎉" : guesses.length <= 3 ? "Impressive! 🔥" : "Got it! ✅"}
              </p>
              <p className="mt-1 text-sm text-slate-300">
                Solved in {guesses.length}/{MAX_GUESSES}
              </p>
            </>
          ) : (
            <>
              <p className="text-2xl font-extrabold text-rose-400">Better luck tomorrow!</p>
              <p className="mt-1 text-sm text-slate-300">
                The word was <span className="font-bold text-white">{target}</span>
              </p>
            </>
          )}
        </div>
      )}

      {/* Virtual keyboard */}
      <div className="flex flex-col items-center gap-1.5 px-2">
        {KEYBOARD_ROWS.map((row, ri) => (
          <div key={ri} className="flex gap-1">
            {row.map((key) => {
              const keyState = keys[key] ?? "default";
              const isWide = key === "ENTER" || key === "⌫";
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => onVirtualKey(key)}
                  className={`
                    flex items-center justify-center rounded-lg font-bold transition
                    ${isWide ? "w-16 px-1 text-xs" : "w-10"} h-14
                    ${KEY_STYLES[keyState as keyof typeof KEY_STYLES] ?? KEY_STYLES.default}
                  `}
                  aria-label={key}
                >
                  {key}
                </button>
              );
            })}
          </div>
        ))}
      </div>

      {/* Shake animation */}
      <style>{`
        @keyframes shake {
          0%,100% { transform: translateX(0); }
          20%,60% { transform: translateX(-6px); }
          40%,80% { transform: translateX(6px); }
        }
      `}</style>
    </div>
  );
}
