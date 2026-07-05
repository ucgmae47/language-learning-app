"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { shuffle } from "@/lib/games/verb-race-es";
import type { TranslationPair } from "@/lib/games/cannon-words-es";
import type { Language } from "@/lib/supabase/types";

const LANG_META: Record<Language, { name: string; flag: string }> = {
  es: { name: "Spanish", flag: "🇪🇸" },
  fr: { name: "French", flag: "🇫🇷" },
};

const DISTRACTOR_COUNT = 3; // wrong words shown alongside the correct one
const LIVES_START = 3;
const BASE_FALL_MS = 7000; // ms to fall at level 1

type FallingWord = {
  id: number;
  text: string;
  isCorrect: boolean;
  left: number;   // % from left edge
  startedAt: number;
  duration: number;
};

type Flash = { id: number; left: number; top: number; correct: boolean } | null;

let _id = 0;
const nextId = () => ++_id;

function pickDistractors(
  pairs: TranslationPair[],
  exclude: string,
  count: number,
): string[] {
  const pool = shuffle(pairs.map((p) => p.target).filter((t) => t !== exclude));
  return pool.slice(0, count);
}

type Props = { pairs: TranslationPair[]; language: Language };

export function CannonGame({ pairs, language }: Props) {
  const meta = LANG_META[language];

  const [status, setStatus] = useState<"idle" | "playing" | "over">("idle");
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(1);
  const [lives, setLives] = useState(LIVES_START);
  const [fallingWords, setFallingWords] = useState<FallingWord[]>([]);
  const [currentPair, setCurrentPair] = useState<TranslationPair | null>(null);
  const [pairQueue, setPairQueue] = useState<TranslationPair[]>([]);
  const [flash, setFlash] = useState<Flash>(null);
  const [roundActive, setRoundActive] = useState(false);

  const livesRef = useRef(LIVES_START);
  const roundTimers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const clearTimers = () => { roundTimers.current.forEach(clearTimeout); roundTimers.current = []; };

  const fallDuration = useCallback(
    (lv: number) => Math.max(BASE_FALL_MS - (lv - 1) * 400, 2500),
    [],
  );

  const spawnRound = useCallback(
    (pair: TranslationPair, lv: number, queue: TranslationPair[]) => {
      const distractors = pickDistractors(pairs, pair.target, DISTRACTOR_COUNT);
      const wordTexts = shuffle([pair.target, ...distractors]);
      const dur = fallDuration(lv);

      const words: FallingWord[] = wordTexts.map((text, i) => ({
        id: nextId(),
        text,
        isCorrect: text === pair.target,
        left: 8 + i * 22 + Math.random() * 4,
        startedAt: performance.now(),
        duration: dur,
      }));

      setFallingWords(words);
      setRoundActive(true);

      // When correct word hits the bottom (miss)
      const correctWord = words.find((w) => w.isCorrect)!;
      const missTimer = setTimeout(() => {
        livesRef.current -= 1;
        setLives(livesRef.current);
        setFallingWords([]);
        setRoundActive(false);
        if (livesRef.current <= 0) {
          setStatus("over");
          return;
        }
        // Next round
        const [next, ...rest] = queue.length > 0 ? queue : shuffle(pairs);
        setPairQueue(rest.length > 0 ? rest : shuffle(pairs));
        setCurrentPair(next!);
        spawnRound(next!, lv, rest);
      }, dur + 200);
      roundTimers.current.push(missTimer);

      // Remove distractors that hit the bottom after their fall
      words.filter((w) => !w.isCorrect).forEach((w) => {
        const t = setTimeout(() => {
          setFallingWords((prev) => prev.filter((fw) => fw.id !== w.id));
        }, dur + 200);
        roundTimers.current.push(t);
      });
    },
    [pairs, fallDuration],
  );

  const startGame = useCallback(() => {
    clearTimers();
    livesRef.current = LIVES_START;
    const shuffled = shuffle(pairs);
    const [first, ...rest] = shuffled;
    setScore(0); setLevel(1); setLives(LIVES_START);
    setFallingWords([]); setFlash(null); setRoundActive(false);
    setPairQueue(rest);
    setCurrentPair(first!);
    setStatus("playing");
    setTimeout(() => spawnRound(first!, 1, rest), 300);
  }, [pairs, spawnRound]);

  const handleClick = useCallback(
    (word: FallingWord, e: React.MouseEvent) => {
      if (!roundActive) return;
      clearTimers();

      const rect = (e.target as HTMLElement).getBoundingClientRect();
      const top = ((rect.top / window.innerHeight) * 100);
      setFlash({ id: word.id, left: word.left, top, correct: word.isCorrect });
      setTimeout(() => setFlash(null), 500);

      setFallingWords([]);
      setRoundActive(false);

      if (word.isCorrect) {
        const newScore = score + 10 + (level - 1) * 2;
        const newLevel = Math.floor(newScore / 50) + 1;
        setScore(newScore);
        setLevel(newLevel);

        const [next, ...rest] = pairQueue.length > 0 ? pairQueue : shuffle(pairs);
        setPairQueue(rest.length > 0 ? rest : shuffle(pairs));
        setCurrentPair(next!);
        setTimeout(() => spawnRound(next!, newLevel, rest), 400);
      } else {
        livesRef.current -= 1;
        setLives(livesRef.current);
        if (livesRef.current <= 0) { setStatus("over"); return; }

        const [next, ...rest] = pairQueue.length > 0 ? pairQueue : shuffle(pairs);
        setPairQueue(rest.length > 0 ? rest : shuffle(pairs));
        setCurrentPair(next!);
        setTimeout(() => spawnRound(next!, level, rest), 600);
      }
    },
    [roundActive, score, level, pairQueue, pairs, spawnRound],
  );

  // Cleanup on unmount
  useEffect(() => () => clearTimers(), []);

  const HEART = "❤️";
  const EMPTY = "🖤";

  return (
    <div className="flex min-h-screen flex-col select-none bg-[#07070f]">
      {/* Header */}
      <header className="z-20 flex items-center justify-between border-b border-white/8 bg-gradient-to-r from-[#0d0d1e] to-[#12122a] px-6 py-3">
        <Link href="/gameroom" className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-300 hover:bg-white/10 hover:text-white">
          <ArrowLeft className="h-4 w-4" /> Games
        </Link>
        <div className="flex items-center gap-4">
          <span className="text-sm font-bold text-white">Score: {score}</span>
          <span className="text-xs text-slate-400">Lv {level}</span>
          <span>{Array.from({ length: LIVES_START }, (_, i) => i < lives ? HEART : EMPTY).join("")}</span>
        </div>
      </header>

      {/* Idle */}
      {status === "idle" && (
        <div className="flex flex-1 flex-col items-center justify-center gap-6 p-8 text-center">
          <span className="text-6xl">🎯</span>
          <div>
            <h2 className="text-2xl font-extrabold text-white">Vocab Cannon</h2>
            <p className="mt-2 text-slate-400">An English word appears on your cannon below.<br/>Shoot the correct {meta.name} translation before it falls!</p>
          </div>
          <button type="button" onClick={startGame} className="rounded-2xl bg-gradient-to-r from-rose-500 to-red-600 px-8 py-4 text-lg font-bold text-white shadow-lg hover:from-rose-400 hover:to-red-500">
            Launch!
          </button>
        </div>
      )}

      {/* Game over */}
      {status === "over" && (
        <div className="flex flex-1 flex-col items-center justify-center gap-6 p-8 text-center">
          <span className="text-5xl">💥</span>
          <h2 className="text-3xl font-extrabold text-white">Game Over</h2>
          <p className="text-xl text-amber-400">{score} pts · Level {level}</p>
          <button type="button" onClick={startGame} className="rounded-2xl bg-gradient-to-r from-rose-500 to-red-600 px-8 py-4 font-bold text-white">
            Try Again
          </button>
        </div>
      )}

      {/* Playing */}
      {status === "playing" && (
        <div className="relative flex-1 overflow-hidden">
          {/* Falling words */}
          {fallingWords.map((word) => (
            <button
              key={word.id}
              type="button"
              onClick={(e) => handleClick(word, e)}
              className="absolute rounded-2xl border border-white/20 bg-white/10 px-5 py-2.5 text-base font-bold text-white shadow-lg backdrop-blur-sm hover:bg-white/20 hover:scale-110 transition-transform"
              style={{
                left: `${word.left}%`,
                top: "-40px",
                animation: `cannonFall ${word.duration}ms linear forwards`,
              }}
            >
              {word.text}
            </button>
          ))}

          {/* Click flash */}
          {flash && (
            <div
              className={`pointer-events-none absolute text-3xl transition-opacity`}
              style={{ left: `${flash.left}%`, top: `${flash.top}%` }}
            >
              {flash.correct ? "💥✅" : "❌"}
            </div>
          )}

          {/* Cannon (bottom) */}
          <div className="absolute bottom-0 left-0 right-0 flex flex-col items-center gap-1 border-t border-white/8 bg-gradient-to-t from-[#0d0d1e] pb-6 pt-4">
            <div className="rounded-2xl border border-rose-500/40 bg-rose-500/15 px-8 py-3 text-center">
              <p className="text-xs font-bold uppercase tracking-widest text-rose-400">Translate</p>
              <p className="text-2xl font-extrabold text-white">{currentPair?.english}</p>
            </div>
            <span className="text-4xl mt-1">🎯</span>
          </div>
        </div>
      )}

      <style>{`
        @keyframes cannonFall {
          from { transform: translateY(0); }
          to   { transform: translateY(calc(100vh - 160px)); }
        }
      `}</style>
    </div>
  );
}
