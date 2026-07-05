"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { ArrowLeft, Shuffle } from "lucide-react";
import Link from "next/link";
import type { Language } from "@/lib/supabase/types";

const GRID_SIZE = 5;
const GAME_DURATION = 120; // seconds

const LANG_META: Record<Language, { name: string; flag: string }> = {
  es: { name: "Spanish", flag: "🇪🇸" },
  fr: { name: "French", flag: "🇫🇷" },
};

const WORD_POINTS: Record<number, number> = { 3: 1, 4: 2, 5: 4, 6: 6, 7: 10 };
function wordPoints(len: number) { return WORD_POINTS[Math.min(len, 7)] ?? 10; }

type Cell = [number, number]; // [row, col]

function isAdjacent([r1, c1]: Cell, [r2, c2]: Cell) {
  return Math.abs(r1 - r2) <= 1 && Math.abs(c1 - c2) <= 1 && !(r1 === r2 && c1 === c2);
}

// `pathKey` was unused after refactor — removed to reduce lint noise.

function generateGrid(weights: [string, number][]): string[][] {
  const pool: string[] = [];
  for (const [letter, weight] of weights) for (let i = 0; i < weight; i++) pool.push(letter);
  return Array.from({ length: GRID_SIZE }, () =>
    Array.from({ length: GRID_SIZE }, () => pool[Math.floor(Math.random() * pool.length)]!),
  );
}

function normalizeWord(w: string) {
  return w.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

type Props = {
  language: Language;
  letterWeights: [string, number][];
  wordSet: Set<string>;
};

export function WordSoupGame({ language, letterWeights, wordSet }: Props) {
  const meta = LANG_META[language];

  const [status, setStatus] = useState<"idle" | "playing" | "over">("idle");
  const [grid, setGrid] = useState<string[][]>([]);
  const [path, setPath] = useState<Cell[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [found, setFound] = useState<Map<string, Cell[]>>(new Map());
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION);
  const [feedback, setFeedback] = useState<{ text: string; ok: boolean } | null>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearFeedback = () => setTimeout(() => setFeedback(null), 900);

  const newGame = useCallback(() => {
    const g = generateGrid(letterWeights);
    setGrid(g);
    setPath([]);
    setFound(new Map());
    setScore(0);
    setTimeLeft(GAME_DURATION);
    setFeedback(null);
    setStatus("playing");
  }, [letterWeights]);

  // Timer
  useEffect(() => {
    if (status !== "playing") return;
    timerRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) { clearInterval(timerRef.current!); setStatus("over"); return 0; }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current!);
  }, [status]);

  const submitPath = useCallback(() => {
    if (path.length < 3) { setPath([]); return; }
    const word = normalizeWord(path.map(([r, c]) => grid[r]![c]!).join(""));
    // const key = pathKey(path); // removed unused local
    if (found.has(word)) {
      setFeedback({ text: "Already found!", ok: false });
      clearFeedback(); setPath([]); return;
    }
    if (wordSet.has(word)) {
      const pts = wordPoints(word.length);
      setScore((s) => s + pts);
      setFound((prev) => { const m = new Map(prev); m.set(word, path); return m; });
      setFeedback({ text: `+${pts} — ${word.toUpperCase()}!`, ok: true });
    } else {
      setFeedback({ text: "Not a word", ok: false });
    }
    clearFeedback(); setPath([]);
  }, [path, grid, found, wordSet]);

  // ─── Pointer-drag interaction ────────────────────────────────────────────

  const cellFromPoint = useCallback((x: number, y: number): Cell | null => {
    const el = document.elementFromPoint(x, y)?.closest("[data-cell]");
    if (!el) return null;
    const v = el.getAttribute("data-cell")?.split(",").map(Number);
    if (!v || v.length !== 2) return null;
    return [v[0]!, v[1]!] as Cell;
  }, []);

  const onGridPointerDown = useCallback((e: React.PointerEvent) => {
    if (status !== "playing") return;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    const cell = cellFromPoint(e.clientX, e.clientY);
    if (cell) { setIsDragging(true); setPath([cell]); }
  }, [status, cellFromPoint]);

  const onGridPointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDragging) return;
    const cell = cellFromPoint(e.clientX, e.clientY);
    if (!cell) return;
    setPath((prev) => {
      if (prev.length === 0) return [cell];
      const last = prev[prev.length - 1]!;
      if (last[0] === cell[0] && last[1] === cell[1]) return prev;
      // Allow backtrack: if cell is second-to-last, pop
      if (prev.length >= 2) {
        const secondLast = prev[prev.length - 2]!;
        if (secondLast[0] === cell[0] && secondLast[1] === cell[1]) return prev.slice(0, -1);
      }
      // Check not already in path and adjacent to last
      const alreadyIn = prev.some(([r, c]) => r === cell[0] && c === cell[1]);
      if (!alreadyIn && isAdjacent(last, cell)) return [...prev, cell];
      return prev;
    });
  }, [isDragging, cellFromPoint]);

  const onGridPointerUp = useCallback(() => {
    if (!isDragging) return;
    setIsDragging(false);
    submitPath();
  }, [isDragging, submitPath]);

  const isInPath = useCallback((r: number, c: number) => path.some(([pr, pc]) => pr === r && pc === c), [path]);
  const pathIndexOf = useCallback((r: number, c: number) => path.findIndex(([pr, pc]) => pr === r && pc === c), [path]);
  const isFound = useCallback((r: number, c: number) => [...found.values()].some((p) => p.some(([pr, pc]) => pr === r && pc === c)), [found]);

  const timerPct = (timeLeft / GAME_DURATION) * 100;
  const timerColor = timeLeft <= 20 ? "bg-rose-500" : timeLeft <= 40 ? "bg-amber-500" : "bg-emerald-500";
  const currentWord = normalizeWord(path.map(([r, c]) => grid[r]?.[c] ?? "").join(""));

  return (
    <div className="flex min-h-screen flex-col bg-[#07070f]">
      {/* Header */}
      <header className="flex items-center justify-between border-b border-white/8 bg-gradient-to-r from-[#0d0d1e] to-[#12122a] px-6 py-3">
        <Link href="/gameroom" className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-300 hover:bg-white/10 hover:text-white">
          <ArrowLeft className="h-4 w-4" /> Games
        </Link>
        <div className="text-center">
          <p className="font-extrabold text-white">🔤 Word Soup</p>
          <p className="text-xs text-slate-400">{meta.flag} {meta.name}</p>
        </div>
        {status === "playing" && (
          <button type="button" onClick={newGame} className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-300 hover:bg-white/10 hover:text-white">
            <Shuffle className="h-3.5 w-3.5" />
          </button>
        )}
        {status !== "playing" && <div className="w-20" />}
      </header>

      {/* Idle */}
      {status === "idle" && (
        <div className="flex flex-1 flex-col items-center justify-center gap-6 p-8 text-center">
          <span className="text-6xl">🔤</span>
          <div>
            <h2 className="text-2xl font-extrabold text-white">Word Soup</h2>
            <p className="mt-2 text-slate-400">Drag through adjacent letters to form {meta.name} words.<br/>3+ letters • longer words = more points • {GAME_DURATION / 60} minutes</p>
          </div>
          <button type="button" onClick={newGame} className="rounded-2xl bg-gradient-to-r from-violet-500 to-purple-600 px-8 py-4 text-lg font-bold text-white shadow-lg hover:from-violet-400 hover:to-purple-500">
            Start
          </button>
        </div>
      )}

      {/* Game over */}
      {status === "over" && (
        <div className="flex flex-1 flex-col items-center justify-center gap-6 p-8 text-center">
          <span className="text-5xl">⏰</span>
          <h2 className="text-3xl font-extrabold text-white">Time&apos;s up!</h2>
          <p className="text-xl text-amber-400">{score} pts · {found.size} words</p>
          {found.size > 0 && (
            <div className="flex flex-wrap justify-center gap-2 max-w-xs">
              {[...found.keys()].map((w) => (
                <span key={w} className="rounded-xl bg-violet-500/20 border border-violet-500/30 px-3 py-1 text-sm font-semibold text-violet-300">{w.toUpperCase()}</span>
              ))}
            </div>
          )}
          <button type="button" onClick={newGame} className="rounded-2xl bg-gradient-to-r from-violet-500 to-purple-600 px-8 py-4 font-bold text-white">
            Play Again
          </button>
        </div>
      )}

      {/* Playing */}
      {status === "playing" && grid.length > 0 && (
        <div className="mx-auto flex w-full max-w-sm flex-col gap-4 px-4 py-6">
          {/* Timer */}
          <div>
            <div className="mb-1 flex justify-between text-xs text-slate-500">
              <span>Score: <span className="font-bold text-white">{score}</span></span>
              <span>Words: <span className="font-bold text-white">{found.size}</span></span>
              <span className={timeLeft <= 20 ? "font-bold text-rose-400" : "text-slate-400"}>{timeLeft}s</span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/8">
              <div className={`h-full rounded-full transition-all duration-1000 ${timerColor}`} style={{ width: `${timerPct}%` }} />
            </div>
          </div>

          {/* Current word display */}
          <div className="flex h-10 items-center justify-center rounded-2xl border border-white/10 bg-white/5">
            {path.length > 0 ? (
              <p className="text-lg font-extrabold tracking-wider text-white">{currentWord.toUpperCase()}</p>
            ) : (
              <p className="text-sm text-slate-600">Drag to spell a word</p>
            )}
          </div>

          {/* Feedback toast */}
          {feedback && (
            <div className={`rounded-xl border px-4 py-2 text-center text-sm font-bold ${
              feedback.ok ? "border-emerald-500/40 bg-emerald-500/15 text-emerald-400" : "border-rose-500/40 bg-rose-500/15 text-rose-400"
            }`}>
              {feedback.text}
            </div>
          )}

          {/* Grid */}
          <div
            ref={gridRef}
            className="touch-none select-none rounded-3xl border border-white/10 bg-white/4 p-3"
            onPointerDown={onGridPointerDown}
            onPointerMove={onGridPointerMove}
            onPointerUp={onGridPointerUp}
          >
            <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${GRID_SIZE}, 1fr)` }}>
              {grid.map((row, r) =>
                row.map((letter, c) => {
                  const inPath = isInPath(r, c);
                  const idx = pathIndexOf(r, c);
                  const foundCell = isFound(r, c);
                  return (
                    <div
                      key={`${r}-${c}`}
                      data-cell={`${r},${c}`}
                      className={`flex aspect-square items-center justify-center rounded-xl text-base font-extrabold transition-all ${
                        inPath
                          ? "bg-violet-500 text-white scale-110 shadow-lg shadow-violet-500/40 z-10 relative"
                          : foundCell
                          ? "bg-emerald-500/20 border border-emerald-500/30 text-emerald-300"
                          : "bg-white/6 border border-white/8 text-slate-300 hover:bg-white/12"
                      }`}
                    >
                      {letter}
                      {inPath && idx > 0 && (
                        <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-amber-500 text-[9px] font-bold flex items-center justify-center text-black">
                          {idx + 1}
                        </span>
                      )}
                    </div>
                  );
                }),
              )}
            </div>
          </div>

          {/* Found words */}
          {found.size > 0 && (
            <div className="rounded-2xl border border-white/8 bg-white/4 p-3">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Found words</p>
              <div className="flex flex-wrap gap-1.5">
                {[...found.keys()].sort((a, b) => b.length - a.length).map((w) => (
                  <span key={w} className="rounded-lg bg-emerald-500/15 border border-emerald-500/25 px-2 py-0.5 text-xs font-semibold text-emerald-400">
                    {w.toUpperCase()} <span className="text-emerald-600">+{wordPoints(w.length)}</span>
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
