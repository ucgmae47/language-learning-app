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

const DISTRACTOR_COUNT = 3;
const LIVES_START = 3;
const BASE_FALL_MS = 7000;

/** Aim angle in degrees: 0 = straight up, negative = left, positive = right */
const AIM_MIN = -55;
const AIM_MAX = 55;
const AIM_STEP = 2.5;
const AIM_HIT_TOLERANCE_DEG = 12;

type FallingWord = {
  id: number;
  text: string;
  isCorrect: boolean;
  left: number;
  startedAt: number;
  duration: number;
};

type Flash = { id: number; left: number; top: number; correct: boolean } | null;

type Shot = {
  id: number;
  angle: number;
  hit: boolean;
};

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

function clampAim(angle: number) {
  return Math.min(AIM_MAX, Math.max(AIM_MIN, angle));
}

/** Angle from cannon (bottom-center) to a point, 0 = up, + = right. */
function angleToPoint(
  cannonX: number,
  cannonY: number,
  targetX: number,
  targetY: number,
): number {
  const dx = targetX - cannonX;
  const dy = cannonY - targetY; // invert Y so up is positive
  return (Math.atan2(dx, dy) * 180) / Math.PI;
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
  const [aimAngle, setAimAngle] = useState(0);
  const [shot, setShot] = useState<Shot | null>(null);

  const livesRef = useRef(LIVES_START);
  const roundTimers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const spawnRoundRef = useRef<
    ((pair: TranslationPair, lv: number, queue: TranslationPair[]) => void) | null
  >(null);
  const playfieldRef = useRef<HTMLDivElement>(null);
  const wordElsRef = useRef<Map<number, HTMLButtonElement>>(new Map());
  const keysHeld = useRef({ left: false, right: false });
  const aimAngleRef = useRef(0);
  const roundActiveRef = useRef(false);
  const fireRef = useRef<(() => void) | null>(null);

  const clearTimers = () => {
    roundTimers.current.forEach(clearTimeout);
    roundTimers.current = [];
  };

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
      roundActiveRef.current = true;

      const missTimer = setTimeout(() => {
        livesRef.current -= 1;
        setLives(livesRef.current);
        setFallingWords([]);
        roundActiveRef.current = false;
        if (livesRef.current <= 0) {
          setStatus("over");
          return;
        }
        const [next, ...rest] = queue.length > 0 ? queue : shuffle(pairs);
        setPairQueue(rest.length > 0 ? rest : shuffle(pairs));
        setCurrentPair(next!);
        spawnRoundRef.current?.(next!, lv, rest);
      }, dur + 200);
      roundTimers.current.push(missTimer);

      words
        .filter((w) => !w.isCorrect)
        .forEach((w) => {
          const t = setTimeout(() => {
            setFallingWords((prev) => prev.filter((fw) => fw.id !== w.id));
          }, dur + 200);
          roundTimers.current.push(t);
        });
    },
    [pairs, fallDuration],
  );

  useEffect(() => {
    spawnRoundRef.current = spawnRound;
    return () => {
      spawnRoundRef.current = null;
    };
  }, [spawnRound]);

  const startGame = useCallback(() => {
    clearTimers();
    livesRef.current = LIVES_START;
    const shuffled = shuffle(pairs);
    const [first, ...rest] = shuffled;
    setScore(0);
    setLevel(1);
    setLives(LIVES_START);
    setFallingWords([]);
    setFlash(null);
    roundActiveRef.current = false;
    setAimAngle(0);
    aimAngleRef.current = 0;
    setShot(null);
    setPairQueue(rest);
    setCurrentPair(first!);
    setStatus("playing");
    setTimeout(() => spawnRound(first!, 1, rest), 300);
  }, [pairs, spawnRound]);

  const resolveHit = useCallback(
    (word: FallingWord, flashLeft: number, flashTop: number) => {
      if (!roundActiveRef.current) return;
      clearTimers();

      setFlash({
        id: word.id,
        left: flashLeft,
        top: flashTop,
        correct: word.isCorrect,
      });
      setTimeout(() => setFlash(null), 500);

      setFallingWords([]);
      roundActiveRef.current = false;

      if (word.isCorrect) {
        const newScore = score + 10 + (level - 1) * 2;
        const newLevel = Math.floor(newScore / 50) + 1;
        setScore(newScore);
        setLevel(newLevel);

        const [next, ...rest] =
          pairQueue.length > 0 ? pairQueue : shuffle(pairs);
        setPairQueue(rest.length > 0 ? rest : shuffle(pairs));
        setCurrentPair(next!);
        setTimeout(() => spawnRound(next!, newLevel, rest), 400);
      } else {
        livesRef.current -= 1;
        setLives(livesRef.current);
        if (livesRef.current <= 0) {
          setStatus("over");
          return;
        }

        const [next, ...rest] =
          pairQueue.length > 0 ? pairQueue : shuffle(pairs);
        setPairQueue(rest.length > 0 ? rest : shuffle(pairs));
        setCurrentPair(next!);
        setTimeout(() => spawnRound(next!, level, rest), 600);
      }
    },
    [score, level, pairQueue, pairs, spawnRound],
  );

  const handleClick = useCallback(
    (word: FallingWord, e: React.MouseEvent) => {
      if (!roundActiveRef.current) return;
      const rect = (e.target as HTMLElement).getBoundingClientRect();
      const top = (rect.top / window.innerHeight) * 100;
      resolveHit(word, word.left, top);
    },
    [resolveHit],
  );

  const fire = useCallback(() => {
    if (!roundActiveRef.current || status !== "playing") return;

    const field = playfieldRef.current;
    if (!field) return;

    const fieldRect = field.getBoundingClientRect();
    const cannonX = fieldRect.left + fieldRect.width / 2;
    const cannonY = fieldRect.bottom - 72;
    const aim = aimAngleRef.current;

    let best: { word: FallingWord; el: HTMLButtonElement; diff: number } | null =
      null;

    for (const word of fallingWords) {
      const el = wordElsRef.current.get(word.id);
      if (!el) continue;
      const rect = el.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const wordAngle = angleToPoint(cannonX, cannonY, cx, cy);
      const diff = Math.abs(wordAngle - aim);
      if (diff <= AIM_HIT_TOLERANCE_DEG && (!best || diff < best.diff)) {
        best = { word, el, diff };
      }
    }

    const shotId = nextId();
    setShot({ id: shotId, angle: aim, hit: Boolean(best) });
    setTimeout(() => setShot((s) => (s?.id === shotId ? null : s)), 350);

    if (best) {
      const rect = best.el.getBoundingClientRect();
      const leftPct = ((rect.left + rect.width / 2 - fieldRect.left) / fieldRect.width) * 100;
      const topPct = ((rect.top + rect.height / 2 - fieldRect.top) / fieldRect.height) * 100;
      resolveHit(best.word, leftPct, topPct);
    }
  }, [fallingWords, resolveHit, status]);

  useEffect(() => {
    fireRef.current = fire;
  }, [fire]);

  // Continuous aim while arrow keys are held
  useEffect(() => {
    if (status !== "playing") return;

    let raf = 0;
    function tick() {
      let next = aimAngleRef.current;
      if (keysHeld.current.left) next -= AIM_STEP;
      if (keysHeld.current.right) next += AIM_STEP;
      next = clampAim(next);
      if (next !== aimAngleRef.current) {
        aimAngleRef.current = next;
        setAimAngle(next);
      }
      raf = requestAnimationFrame(tick);
    }
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [status]);

  // Keyboard controls
  useEffect(() => {
    if (status !== "playing") return;

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        keysHeld.current.left = true;
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        keysHeld.current.right = true;
      } else if (e.key === " " || e.key === "ArrowUp" || e.key === "Enter") {
        e.preventDefault();
        if (!e.repeat) fireRef.current?.();
      }
    }

    function onKeyUp(e: KeyboardEvent) {
      if (e.key === "ArrowLeft") keysHeld.current.left = false;
      if (e.key === "ArrowRight") keysHeld.current.right = false;
    }

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    const held = keysHeld.current;
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      held.left = false;
      held.right = false;
    };
  }, [status]);

  useEffect(() => () => clearTimers(), []);

  const HEART = "❤️";
  const EMPTY = "🖤";

  return (
    <div className="flex min-h-screen flex-col select-none bg-[#07070f]">
      <header className="z-20 flex items-center justify-between border-b border-white/8 bg-gradient-to-r from-[#0d0d1e] to-[#12122a] px-6 py-3">
        <Link
          href="/gameroom"
          className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-300 hover:bg-white/10 hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" /> Games
        </Link>
        <div className="flex items-center gap-4">
          <span className="text-sm font-bold text-white">Score: {score}</span>
          <span className="text-xs text-slate-400">Lv {level}</span>
          <span>
            {Array.from({ length: LIVES_START }, (_, i) =>
              i < lives ? HEART : EMPTY,
            ).join("")}
          </span>
        </div>
      </header>

      {status === "idle" && (
        <div className="flex flex-1 flex-col items-center justify-center gap-6 p-8 text-center">
          <VisualCannon angle={-12} scale={1.35} />
          <div>
            <h2 className="text-2xl font-extrabold text-white">Vocab Cannon</h2>
            <p className="mt-2 max-w-md text-slate-400">
              Aim with ← →, fire with Space / ↑.
              <br />
              Shoot the correct {meta.name} translation before it falls!
            </p>
          </div>
          <button
            type="button"
            onClick={startGame}
            className="rounded-2xl bg-gradient-to-r from-rose-500 to-red-600 px-8 py-4 text-lg font-bold text-white shadow-lg hover:from-rose-400 hover:to-red-500"
          >
            Launch!
          </button>
        </div>
      )}

      {status === "over" && (
        <div className="flex flex-1 flex-col items-center justify-center gap-6 p-8 text-center">
          <span className="text-5xl">💥</span>
          <h2 className="text-3xl font-extrabold text-white">Game Over</h2>
          <p className="text-xl text-amber-400">
            {score} pts · Level {level}
          </p>
          <button
            type="button"
            onClick={startGame}
            className="rounded-2xl bg-gradient-to-r from-rose-500 to-red-600 px-8 py-4 font-bold text-white"
          >
            Try Again
          </button>
        </div>
      )}

      {status === "playing" && (
        <div ref={playfieldRef} className="relative flex-1 overflow-hidden">
          {fallingWords.map((word) => (
            <button
              key={word.id}
              type="button"
              ref={(el) => {
                if (el) wordElsRef.current.set(word.id, el);
                else wordElsRef.current.delete(word.id);
              }}
              onClick={(e) => handleClick(word, e)}
              className="absolute rounded-2xl border border-white/20 bg-white/10 px-5 py-2.5 text-base font-bold text-white shadow-lg backdrop-blur-sm transition-transform hover:scale-110 hover:bg-white/20"
              style={{
                left: `${word.left}%`,
                top: "-40px",
                animation: `cannonFall ${word.duration}ms linear forwards`,
              }}
            >
              {word.text}
            </button>
          ))}

          {flash && (
            <div
              className="pointer-events-none absolute text-3xl"
              style={{ left: `${flash.left}%`, top: `${flash.top}%` }}
            >
              {flash.correct ? "💥✅" : "❌"}
            </div>
          )}

          {shot && (
            <div
              className="pointer-events-none absolute bottom-[72px] left-1/2 origin-bottom"
              style={{
                transform: `translateX(-50%) rotate(${shot.angle}deg)`,
              }}
            >
              <div
                className={`mx-auto h-[min(55vh,420px)] w-1 rounded-full ${
                  shot.hit
                    ? "bg-gradient-to-t from-amber-400 via-orange-400 to-transparent"
                    : "bg-gradient-to-t from-rose-500/80 via-rose-400/40 to-transparent"
                }`}
                style={{ animation: "cannonBlast 0.35s ease-out forwards" }}
              />
            </div>
          )}

          {/* Cannon deck */}
          <div className="absolute inset-x-0 bottom-0 z-10 flex flex-col items-center border-t border-white/8 bg-gradient-to-t from-[#0d0d1e] via-[#0d0d1e]/95 to-transparent pb-3 pt-2">
            <div className="mb-1 rounded-2xl border border-rose-500/40 bg-rose-500/15 px-6 py-2 text-center">
              <p className="text-[10px] font-bold uppercase tracking-widest text-rose-400">
                Translate
              </p>
              <p className="text-xl font-extrabold text-white sm:text-2xl">
                {currentPair?.english}
              </p>
            </div>

            <VisualCannon angle={aimAngle} />

            <p className="mt-1 text-[11px] text-slate-500">
              ← → aim · Space / ↑ fire · or click a word
            </p>
          </div>
        </div>
      )}

      <style>{`
        @keyframes cannonFall {
          from { transform: translateY(0); }
          to   { transform: translateY(calc(100vh - 200px)); }
        }
        @keyframes cannonBlast {
          from { opacity: 1; transform: scaleY(0.2); }
          to   { opacity: 0; transform: scaleY(1); }
        }
      `}</style>
    </div>
  );
}

function VisualCannon({
  angle,
  scale = 1,
}: {
  angle: number;
  scale?: number;
}) {
  return (
    <div
      className="relative flex h-[110px] w-[160px] items-end justify-center"
      style={{ transform: `scale(${scale})` }}
      aria-hidden="true"
    >
      {/* Ground plate */}
      <div className="absolute bottom-0 h-3 w-36 rounded-full bg-gradient-to-b from-slate-600 to-slate-800 shadow-lg" />

      {/* Wheels */}
      <div className="absolute bottom-1 left-6 h-8 w-8 rounded-full border-2 border-slate-500 bg-gradient-to-br from-slate-600 to-slate-900 shadow-inner" />
      <div className="absolute bottom-1 right-6 h-8 w-8 rounded-full border-2 border-slate-500 bg-gradient-to-br from-slate-600 to-slate-900 shadow-inner" />
      <div className="absolute bottom-3 left-[30px] h-2 w-2 rounded-full bg-amber-500/80" />
      <div className="absolute bottom-3 right-[30px] h-2 w-2 rounded-full bg-amber-500/80" />

      {/* Carriage */}
      <div className="absolute bottom-4 h-10 w-24 rounded-t-xl rounded-b-md border border-rose-900/60 bg-gradient-to-b from-rose-800 to-rose-950 shadow-xl" />

      {/* Rotating barrel — pivot at carriage center */}
      <div
        className="absolute bottom-10 left-1/2 origin-bottom transition-transform duration-75 ease-out"
        style={{ transform: `translateX(-50%) rotate(${angle}deg)` }}
      >
        {/* Barrel */}
        <div className="relative mx-auto h-20 w-7">
          <div className="absolute inset-x-0 bottom-0 h-full rounded-t-md border border-slate-400/40 bg-gradient-to-t from-slate-700 via-slate-500 to-slate-400 shadow-lg" />
          {/* Muzzle ring */}
          <div className="absolute -top-1 left-1/2 h-3 w-9 -translate-x-1/2 rounded-full border border-slate-300/50 bg-gradient-to-b from-slate-400 to-slate-600" />
          {/* Highlight */}
          <div className="absolute left-1 top-3 h-10 w-1.5 rounded-full bg-white/25" />
        </div>
      </div>

      {/* Pivot bolt */}
      <div className="absolute bottom-[38px] left-1/2 h-3.5 w-3.5 -translate-x-1/2 rounded-full border border-amber-300/60 bg-gradient-to-br from-amber-400 to-amber-700 shadow" />
    </div>
  );
}
