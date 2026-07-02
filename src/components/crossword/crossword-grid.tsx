"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { CheckCircle, RotateCcw, Eye } from "lucide-react";
import type { CrosswordPuzzle, CrosswordEntry } from "@/lib/crossword/puzzles";

// ─── Types ────────────────────────────────────────────────────────────────────

type CellKey = `${number},${number}`;
type Direction = "across" | "down";

type SelectedWord = {
  entry: CrosswordEntry;
} | null;

// ─── Helpers ─────────────────────────────────────────────────────────────────

function cellKey(row: number, col: number): CellKey {
  return `${row},${col}`;
}

/** Map every white cell to the entries that pass through it. */
function buildCellEntryMap(
  entries: CrosswordEntry[],
): Map<CellKey, CrosswordEntry[]> {
  const map = new Map<CellKey, CrosswordEntry[]>();
  for (const entry of entries) {
    for (let i = 0; i < entry.answer.length; i++) {
      const r = entry.direction === "across" ? entry.row : entry.row + i;
      const c = entry.direction === "down" ? entry.col : entry.col + i;
      const key = cellKey(r, c);
      const existing = map.get(key) ?? [];
      map.set(key, [...existing, entry]);
    }
  }
  return map;
}

/** Find the cell number (if any) displayed in the top-left of a cell. */
function buildCellNumberMap(entries: CrosswordEntry[]): Map<CellKey, number> {
  const map = new Map<CellKey, number>();
  for (const entry of entries) {
    const key = cellKey(entry.row, entry.col);
    if (!map.has(key)) map.set(key, entry.number);
  }
  return map;
}

// ─── Component ───────────────────────────────────────────────────────────────

type Props = {
  puzzle: CrosswordPuzzle;
};

export function CrosswordGrid({ puzzle }: Props) {
  const { grid, entries } = puzzle;
  const rows = grid.length;
  const cols = grid[0]?.length ?? 0;

  // User-typed letters keyed by "row,col"
  const [userGrid, setUserGrid] = useState<Map<CellKey, string>>(new Map());
  // Which entry is currently active
  const [activeEntry, setActiveEntry] = useState<CrosswordEntry | null>(
    entries[0] ?? null,
  );
  // "check" mode: highlight wrong cells; "reveal" mode: fill correct letters
  const [checked, setChecked] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const [isComplete, setIsComplete] = useState(false);

  const cellRefs = useRef<Map<CellKey, HTMLButtonElement>>(new Map());
  const cellEntryMap = useRef(buildCellEntryMap(entries));
  const cellNumberMap = useRef(buildCellNumberMap(entries));

  // ── Active-entry derived state ──────────────────────────────────────────

  const activeCells = new Set<CellKey>();
  if (activeEntry) {
    for (let i = 0; i < activeEntry.answer.length; i++) {
      const r =
        activeEntry.direction === "across" ? activeEntry.row : activeEntry.row + i;
      const c =
        activeEntry.direction === "down" ? activeEntry.col : activeEntry.col + i;
      activeCells.add(cellKey(r, c));
    }
  }

  // ── Check completion ────────────────────────────────────────────────────

  useEffect(() => {
    const allFilled = entries.every((entry) => {
      for (let i = 0; i < entry.answer.length; i++) {
        const r = entry.direction === "across" ? entry.row : entry.row + i;
        const c = entry.direction === "down" ? entry.col : entry.col + i;
        const typed = userGrid.get(cellKey(r, c)) ?? "";
        if (typed.toUpperCase() !== entry.answer[i]) return false;
      }
      return true;
    });
    setIsComplete(allFilled);
  }, [userGrid, entries]);

  // ── Cell interaction ────────────────────────────────────────────────────

  const handleCellClick = useCallback(
    (row: number, col: number) => {
      const key = cellKey(row, col);
      const cellEntries = cellEntryMap.current.get(key) ?? [];
      if (cellEntries.length === 0) return;

      if (activeEntry && activeCells.has(key)) {
        // Clicking inside the same word: toggle direction if the cell has both.
        const otherDir = activeEntry.direction === "across" ? "down" : "across";
        const alt = cellEntries.find((e) => e.direction === otherDir);
        if (alt) {
          setActiveEntry(alt);
          return;
        }
      }

      // Select the first entry passing through the clicked cell.
      setActiveEntry(cellEntries[0] ?? null);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [activeEntry, activeCells],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent, row: number, col: number) => {
      if (!activeEntry) return;
      const isAcross = activeEntry.direction === "across";

      if (e.key === "Backspace") {
        e.preventDefault();
        const key = cellKey(row, col);
        const current = userGrid.get(key) ?? "";
        if (current) {
          // Clear this cell
          setUserGrid((prev) => {
            const next = new Map(prev);
            next.delete(key);
            return next;
          });
        } else {
          // Move to previous cell in word
          const prevRow = isAcross ? row : row - 1;
          const prevCol = isAcross ? col - 1 : col;
          const prevKey = cellKey(prevRow, prevCol);
          if (activeCells.has(prevKey)) {
            cellRefs.current.get(prevKey)?.focus();
          }
        }
        return;
      }

      if (e.key === "ArrowRight" || e.key === "ArrowLeft" || e.key === "ArrowUp" || e.key === "ArrowDown") {
        e.preventDefault();
        const dRow = e.key === "ArrowDown" ? 1 : e.key === "ArrowUp" ? -1 : 0;
        const dCol = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
        const targetKey = cellKey(row + dRow, col + dCol);
        const targetBtn = cellRefs.current.get(targetKey);
        if (targetBtn) targetBtn.focus();
        return;
      }

      if (/^[a-zA-Z]$/.test(e.key)) {
        e.preventDefault();
        const letter = e.key.toUpperCase();
        const key = cellKey(row, col);
        setUserGrid((prev) => {
          const next = new Map(prev);
          next.set(key, letter);
          return next;
        });
        setChecked(false);

        // Advance to the next cell in the active word.
        const nextRow = isAcross ? row : row + 1;
        const nextCol = isAcross ? col + 1 : col;
        const nextKey = cellKey(nextRow, nextCol);
        if (activeCells.has(nextKey)) {
          cellRefs.current.get(nextKey)?.focus();
        }
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [activeEntry, activeCells, userGrid],
  );

  // ── Actions ─────────────────────────────────────────────────────────────

  function handleCheck() {
    setChecked(true);
    setRevealed(false);
  }

  function handleReveal() {
    const next = new Map<CellKey, string>();
    for (const entry of entries) {
      for (let i = 0; i < entry.answer.length; i++) {
        const r = entry.direction === "across" ? entry.row : entry.row + i;
        const c = entry.direction === "down" ? entry.col : entry.col + i;
        next.set(cellKey(r, c), entry.answer[i]!);
      }
    }
    setUserGrid(next);
    setChecked(false);
    setRevealed(true);
  }

  function handleReset() {
    setUserGrid(new Map());
    setChecked(false);
    setRevealed(false);
    setIsComplete(false);
    setActiveEntry(entries[0] ?? null);
  }

  // ── Cell style logic ─────────────────────────────────────────────────────

  function getCellStatus(row: number, col: number): "correct" | "wrong" | "neutral" {
    if (!checked) return "neutral";
    const key = cellKey(row, col);
    const typed = userGrid.get(key) ?? "";
    if (!typed) return "neutral";
    const correctLetter = grid[row]?.[col];
    return typed === correctLetter ? "correct" : "wrong";
  }

  // ── Clue groups ─────────────────────────────────────────────────────────

  const acrossEntries = entries
    .filter((e) => e.direction === "across")
    .sort((a, b) => a.number - b.number);
  const downEntries = entries
    .filter((e) => e.direction === "down")
    .sort((a, b) => a.number - b.number);

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col gap-6">
      {/* Completion banner */}
      {isComplete && (
        <div className="flex items-center gap-3 rounded-2xl bg-emerald-50 border border-emerald-200 px-5 py-4">
          <CheckCircle className="h-6 w-6 shrink-0 text-emerald-600" aria-hidden="true" />
          <div>
            <p className="font-semibold text-emerald-800">Puzzle complete! 🎉</p>
            <p className="text-sm text-emerald-600">All answers are correct. Great work!</p>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-8 lg:flex-row lg:items-start">
        {/* Grid */}
        <div className="flex flex-col items-center gap-4">
          <div
            className="inline-grid gap-0.5 rounded-xl bg-slate-700 p-1.5 shadow-lg"
            style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
            role="grid"
            aria-label={`${puzzle.title} crossword grid`}
          >
            {Array.from({ length: rows }, (_, row) =>
              Array.from({ length: cols }, (_, col) => {
                const letter = grid[row]?.[col];
                if (letter === null || letter === undefined) {
                  return (
                    <div
                      key={cellKey(row, col)}
                      className="h-10 w-10 rounded-sm bg-slate-800 sm:h-12 sm:w-12"
                      aria-hidden="true"
                    />
                  );
                }

                const key = cellKey(row, col);
                const isActive = activeCells.has(key);
                const isFocusCell =
                  activeEntry?.row === (activeEntry?.direction === "down" ? activeEntry.row : row) &&
                  activeEntry?.col === (activeEntry?.direction === "across" ? activeEntry.col : col);
                const number = cellNumberMap.current.get(key);
                const typed = userGrid.get(key) ?? "";
                const status = getCellStatus(row, col);

                let cellBg = "bg-white";
                if (isActive) cellBg = "bg-sky-100";
                if (status === "correct") cellBg = "bg-emerald-100";
                if (status === "wrong") cellBg = "bg-red-100";

                return (
                  <button
                    key={key}
                    ref={(el) => {
                      if (el) cellRefs.current.set(key, el);
                      else cellRefs.current.delete(key);
                    }}
                    type="button"
                    onClick={() => handleCellClick(row, col)}
                    onKeyDown={(e) => handleKeyDown(e, row, col)}
                    aria-label={`Row ${row + 1}, Column ${col + 1}${typed ? `, contains ${typed}` : ""}`}
                    className={`relative flex h-10 w-10 items-center justify-center rounded-sm text-sm font-bold text-slate-900 transition focus:z-10 focus:outline-none focus:ring-2 focus:ring-sky-500 sm:h-12 sm:w-12 sm:text-base ${cellBg}`}
                  >
                    {number !== undefined && (
                      <span className="absolute left-0.5 top-0.5 text-[8px] font-semibold leading-none text-slate-500 sm:text-[9px]">
                        {number}
                      </span>
                    )}
                    <span aria-hidden={!typed}>
                      {revealed && !typed ? letter : typed}
                    </span>
                  </button>
                );
              }),
            )}
          </div>

          {/* Action buttons */}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleCheck}
              className="flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:border-sky-300 hover:text-sky-700"
            >
              <CheckCircle className="h-4 w-4" aria-hidden="true" />
              Check
            </button>
            <button
              type="button"
              onClick={handleReveal}
              className="flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:border-amber-300 hover:text-amber-700"
            >
              <Eye className="h-4 w-4" aria-hidden="true" />
              Reveal
            </button>
            <button
              type="button"
              onClick={handleReset}
              className="flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:border-red-300 hover:text-red-700"
            >
              <RotateCcw className="h-4 w-4" aria-hidden="true" />
              Reset
            </button>
          </div>
        </div>

        {/* Clue list */}
        <div className="flex min-w-0 flex-1 flex-col gap-5">
          <ClueGroup
            title="Across"
            entries={acrossEntries}
            activeEntry={activeEntry}
            onSelect={setActiveEntry}
          />
          <ClueGroup
            title="Down"
            entries={downEntries}
            activeEntry={activeEntry}
            onSelect={setActiveEntry}
          />
        </div>
      </div>
    </div>
  );
}

// ─── Clue Group ───────────────────────────────────────────────────────────────

function ClueGroup({
  title,
  entries,
  activeEntry,
  onSelect,
}: {
  title: string;
  entries: CrosswordEntry[];
  activeEntry: CrosswordEntry | null;
  onSelect: (entry: CrosswordEntry) => void;
}) {
  return (
    <div>
      <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-400">
        {title}
      </h3>
      <ol className="space-y-1">
        {entries.map((entry) => {
          const isActive =
            activeEntry?.number === entry.number &&
            activeEntry?.direction === entry.direction;
          return (
            <li key={`${entry.number}-${entry.direction}`}>
              <button
                type="button"
                onClick={() => onSelect(entry)}
                className={`w-full rounded-lg px-3 py-2 text-left text-sm transition ${
                  isActive
                    ? "bg-sky-100 font-semibold text-sky-900"
                    : "text-slate-700 hover:bg-slate-100"
                }`}
              >
                <span className="mr-2 font-bold text-slate-400">
                  {entry.number}.
                </span>
                {entry.clue}
              </button>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
