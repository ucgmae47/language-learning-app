"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { ArrowLeft, RefreshCw, SkipForward } from "lucide-react";
import Link from "next/link";
import { normalize, shuffle } from "@/lib/games/verb-race-es";
import type { VerbQuestion } from "@/lib/games/verb-race-es";
import type { Language } from "@/lib/supabase/types";

const GAME_DURATION = 60; // seconds

const LANG_META: Record<Language, { name: string; flag: string }> = {
  es: { name: "Spanish", flag: "🇪🇸" },
  fr: { name: "French", flag: "🇫🇷" },
};

type Props = { questions: VerbQuestion[]; language: Language };

export function VerbRaceGame({ questions, language }: Props) {
  const meta = LANG_META[language];

  const [status, setStatus] = useState<"idle" | "playing" | "over">("idle");
  const [queue, setQueue] = useState<VerbQuestion[]>([]);
  const [current, setCurrent] = useState<VerbQuestion | null>(null);
  const [input, setInput] = useState("");
  const [score, setScore] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [attempted, setAttempted] = useState(0);
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION);
  const [flash, setFlash] = useState<"correct" | "wrong" | null>(null);
  const [showAnswer, setShowAnswer] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const advance = useCallback((q: VerbQuestion[]) => {
    const [next, ...rest] = q;
    setCurrent(next ?? null);
    setQueue(rest.length > 0 ? rest : shuffle(questions));
    setInput("");
    setShowAnswer(null);
    inputRef.current?.focus();
  }, [questions]);

  const startGame = useCallback(() => {
    const shuffled = shuffle(questions);
    setScore(0);
    setCorrect(0);
    setAttempted(0);
    setTimeLeft(GAME_DURATION);
    setFlash(null);
    setShowAnswer(null);
    setStatus("playing");
    setQueue(shuffled.slice(1));
    setCurrent(shuffled[0] ?? null);
    setInput("");
    setTimeout(() => inputRef.current?.focus(), 50);
  }, [questions]);

  // Countdown timer
  useEffect(() => {
    if (status !== "playing") return;
    timerRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(timerRef.current!);
          setStatus("over");
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current!);
  }, [status]);

  const submit = useCallback(() => {
    if (!current || status !== "playing") return;
    const isCorrect = normalize(input) === normalize(current.answer);
    setAttempted((a) => a + 1);

    if (isCorrect) {
      setScore((s) => s + 10);
      setCorrect((c) => c + 1);
      setFlash("correct");
      setTimeout(() => { setFlash(null); advance(queue); }, 300);
    } else {
      setFlash("wrong");
      setShowAnswer(current.answer);
      setTimeout(() => { setFlash(null); advance(queue); }, 1200);
    }
    setInput("");
  }, [current, input, status, queue, advance]);

  const skip = useCallback(() => {
    if (!current || status !== "playing") return;
    advance(queue);
  }, [current, status, queue, advance]);

  function onKey(e: React.KeyboardEvent) {
    if (e.key === "Enter") submit();
  }

  const accuracy = attempted > 0 ? Math.round((correct / attempted) * 100) : 0;
  const timerPct = (timeLeft / GAME_DURATION) * 100;
  const timerColor = timeLeft <= 10 ? "bg-rose-500" : timeLeft <= 20 ? "bg-amber-500" : "bg-emerald-500";

  return (
    <div className={`flex min-h-screen flex-col bg-[#07070f] transition-colors ${
      flash === "correct" ? "bg-emerald-950" : flash === "wrong" ? "bg-rose-950" : ""
    }`}>
      {/* Header */}
      <header className="flex items-center justify-between border-b border-white/8 bg-gradient-to-r from-[#0d0d1e] to-[#12122a] px-6 py-4">
        <Link href="/gameroom" className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-300 hover:bg-white/10 hover:text-white">
          <ArrowLeft className="h-4 w-4" /> Games
        </Link>
        <div className="text-center">
          <p className="font-extrabold text-white">⚡ Verb Race</p>
          <p className="text-xs text-slate-400">{meta.flag} {meta.name}</p>
        </div>
        <button type="button" onClick={startGame} className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-300 hover:bg-white/10 hover:text-white">
          <RefreshCw className="h-3.5 w-3.5" />
        </button>
      </header>

      {/* Idle */}
      {status === "idle" && (
        <div className="flex flex-1 flex-col items-center justify-center gap-6 p-8 text-center">
          <span className="text-6xl">⚡</span>
          <div>
            <h2 className="text-2xl font-extrabold text-white">Verb Race</h2>
            <p className="mt-2 text-slate-400">A verb + pronoun appears. Type the correct conjugation as fast as you can.<br/>You have {GAME_DURATION} seconds. Ready?</p>
          </div>
          <button type="button" onClick={startGame} className="rounded-2xl bg-gradient-to-r from-yellow-500 to-amber-600 px-8 py-4 text-lg font-bold text-white shadow-lg hover:from-yellow-400 hover:to-amber-500">
            Start
          </button>
        </div>
      )}

      {/* Playing */}
      {status === "playing" && current && (
        <div className="mx-auto flex w-full max-w-lg flex-1 flex-col items-center gap-6 px-4 py-8">
          {/* Timer bar */}
          <div className="w-full">
            <div className="mb-1 flex justify-between text-xs text-slate-500">
              <span>Score: <span className="font-bold text-white">{score}</span></span>
              <span className={timeLeft <= 10 ? "font-bold text-rose-400" : "text-slate-400"}>{timeLeft}s</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-white/8">
              <div className={`h-full rounded-full transition-all duration-1000 ${timerColor}`} style={{ width: `${timerPct}%` }} />
            </div>
          </div>

          {/* Question card */}
          <div className={`w-full rounded-3xl border p-8 text-center transition-colors ${
            flash === "correct" ? "border-emerald-500/50 bg-emerald-500/10" :
            flash === "wrong"   ? "border-rose-500/50 bg-rose-500/10" :
                                  "border-white/10 bg-white/5"
          }`}>
            <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-1">{current.english}</p>
            <p className="text-4xl font-extrabold text-white mb-2">{current.verb}</p>
            <p className="text-2xl font-bold text-amber-400">{current.pronoun} →</p>
            {showAnswer && (
              <p className="mt-3 text-lg font-semibold text-emerald-400">✓ {showAnswer}</p>
            )}
          </div>

          {/* Input */}
          <div className="flex w-full gap-2">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={onKey}
              placeholder="Type conjugation…"
              autoComplete="off"
              autoCorrect="off"
              spellCheck={false}
              className="flex-1 rounded-2xl border border-white/10 bg-white/5 px-5 py-4 text-lg font-bold text-white placeholder-slate-600 outline-none focus:border-amber-500/40 focus:ring-2 focus:ring-amber-500/15"
            />
            <button type="button" onClick={skip} title="Skip" className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-slate-400 hover:text-white">
              <SkipForward className="h-5 w-5" />
            </button>
          </div>
          <button type="button" onClick={submit} disabled={!input.trim()} className="w-full rounded-2xl bg-gradient-to-r from-yellow-500 to-amber-600 py-4 font-bold text-white disabled:opacity-40">
            Submit
          </button>
        </div>
      )}

      {/* Game over */}
      {status === "over" && (
        <div className="flex flex-1 flex-col items-center justify-center gap-6 p-8 text-center">
          <span className="text-5xl">🏁</span>
          <h2 className="text-3xl font-extrabold text-white">{score} pts</h2>
          <div className="grid grid-cols-3 gap-4 w-full max-w-sm">
            {[["Correct", `${correct}`], ["Attempted", `${attempted}`], ["Accuracy", `${accuracy}%`]].map(([label, val]) => (
              <div key={label} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-2xl font-extrabold text-white">{val}</p>
                <p className="text-xs text-slate-400">{label}</p>
              </div>
            ))}
          </div>
          <button type="button" onClick={startGame} className="rounded-2xl bg-gradient-to-r from-yellow-500 to-amber-600 px-8 py-4 font-bold text-white">
            Play Again
          </button>
        </div>
      )}
    </div>
  );
}
