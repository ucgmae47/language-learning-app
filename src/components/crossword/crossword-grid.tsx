"use client";

/* eslint-disable react-hooks/refs */
import { useState, useCallback, useRef, useMemo, useEffect } from "react";
import { CheckCircle, RotateCcw, Eye, PartyPopper } from "lucide-react";
import type { CrosswordPuzzle, CrosswordEntry } from "@/lib/crossword/puzzles";

// ─── Types ────────────────────────────────────────────────────────────────────

type CellKey = `${number},${number}`;

// ─── Helpers ─────────────────────────────────────────────────────────────────

function cellKey(row: number, col: number): CellKey {
  return `${row},${col}`;
}

function entryId(entry: CrosswordEntry): string {
  return `${entry.number}-${entry.direction}`;
}

function getInitialEntry(entries: CrosswordEntry[]): CrosswordEntry | null {
  return entries.find((e) => e.direction === "across") ?? entries[0] ?? null;
}

function cellAt(entry: CrosswordEntry, index: number): { row: number; col: number } {
  return {
    row: entry.direction === "across" ? entry.row : entry.row + index,
    col: entry.direction === "down" ? entry.col : entry.col + index,
  };
}

function isEntryComplete(
  entry: CrosswordEntry,
  userGrid: Map<CellKey, string>,
): boolean {
  for (let i = 0; i < entry.answer.length; i++) {
    const { row, col } = cellAt(entry, i);
    const typed = userGrid.get(cellKey(row, col)) ?? "";
    if (typed.toUpperCase() !== entry.answer[i]) return false;
  }
  return true;
}

/** Index of the first empty tile in a word, or -1 if all filled. */
function firstEmptyIndex(
  entry: CrosswordEntry,
  userGrid: Map<CellKey, string>,
): number {
  for (let i = 0; i < entry.answer.length; i++) {
    const { row, col } = cellAt(entry, i);
    if (!userGrid.get(cellKey(row, col))) return i;
  }
  return -1;
}

/** Next empty tile index after `fromIndex`, or -1. */
function nextEmptyIndex(
  entry: CrosswordEntry,
  userGrid: Map<CellKey, string>,
  fromIndex: number,
): number {
  for (let i = fromIndex + 1; i < entry.answer.length; i++) {
    const { row, col } = cellAt(entry, i);
    if (!userGrid.get(cellKey(row, col))) return i;
  }
  return -1;
}

/** Previous editable tile index before `fromIndex` (skips locked cells). */
function prevEditableIndex(
  entry: CrosswordEntry,
  fromIndex: number,
  lockedCells: Set<CellKey>,
): number {
  for (let i = fromIndex - 1; i >= 0; i--) {
    const { row, col } = cellAt(entry, i);
    if (!lockedCells.has(cellKey(row, col))) return i;
  }
  return -1;
}

function indexInEntry(entry: CrosswordEntry, row: number, col: number): number {
  for (let i = 0; i < entry.answer.length; i++) {
    const pos = cellAt(entry, i);
    if (pos.row === row && pos.col === col) return i;
  }
  return -1;
}

function getNextIncompleteEntry(
  entries: CrosswordEntry[],
  current: CrosswordEntry | null,
  userGrid: Map<CellKey, string>,
): CrosswordEntry | null {
  const across = entries
    .filter((e) => e.direction === "across")
    .sort((a, b) => a.number - b.number);
  const down = entries
    .filter((e) => e.direction === "down")
    .sort((a, b) => a.number - b.number);
  const ordered = [...across, ...down];

  const incomplete = ordered.filter((e) => !isEntryComplete(e, userGrid));
  if (incomplete.length === 0) return null;
  if (!current) return incomplete[0] ?? null;

  const currentIdx = ordered.findIndex(
    (e) => e.number === current.number && e.direction === current.direction,
  );
  for (let i = 1; i <= ordered.length; i++) {
    const candidate = ordered[(currentIdx + i) % ordered.length]!;
    if (!isEntryComplete(candidate, userGrid)) return candidate;
  }
  return incomplete[0] ?? null;
}

function buildCellEntryMap(
  entries: CrosswordEntry[],
): Map<CellKey, CrosswordEntry[]> {
  const map = new Map<CellKey, CrosswordEntry[]>();
  for (const entry of entries) {
    for (let i = 0; i < entry.answer.length; i++) {
      const { row, col } = cellAt(entry, i);
      const key = cellKey(row, col);
      map.set(key, [...(map.get(key) ?? []), entry]);
    }
  }
  return map;
}

function buildCellNumberMap(entries: CrosswordEntry[]): Map<CellKey, number> {
  const map = new Map<CellKey, number>();
  for (const entry of entries) {
    const key = cellKey(entry.row, entry.col);
    if (!map.has(key)) map.set(key, entry.number);
  }
  return map;
}

/** Collect only playable (letter) cells for free-form rendering. */
function collectLetterCells(
  grid: (string | null)[][],
): Array<{ row: number; col: number; letter: string }> {
  const cells: Array<{ row: number; col: number; letter: string }> = [];
  for (let row = 0; row < grid.length; row++) {
    for (let col = 0; col < (grid[row]?.length ?? 0); col++) {
      const letter = grid[row]?.[col];
      if (letter) cells.push({ row, col, letter });
    }
  }
  return cells;
}

// ─── Component ───────────────────────────────────────────────────────────────

type Props = {
  puzzle: CrosswordPuzzle;
};

export function CrosswordGrid({ puzzle }: Props) {
  const { grid, entries } = puzzle;
  const rows = grid.length;
  const cols = grid[0]?.length ?? 0;
  const letterCells = useMemo(() => collectLetterCells(grid), [grid]);

  const [userGrid, setUserGrid] = useState<Map<CellKey, string>>(new Map());
  const [activeEntry, setActiveEntry] = useState<CrosswordEntry | null>(() =>
    getInitialEntry(entries),
  );
  const [revealed, setRevealed] = useState(false);

  const completedEntries = useMemo(() => {
    const set = new Set<string>();
    for (const entry of entries) {
      if (isEntryComplete(entry, userGrid)) set.add(entryId(entry));
    }
    return set;
  }, [userGrid, entries]);

  const isComplete =
    completedEntries.size === entries.length && entries.length > 0;

  const completedCells = useMemo(() => {
    const set = new Set<CellKey>();
    for (const entry of entries) {
      if (!completedEntries.has(entryId(entry))) continue;
      for (let i = 0; i < entry.answer.length; i++) {
        const { row, col } = cellAt(entry, i);
        set.add(cellKey(row, col));
      }
    }
    return set;
  }, [entries, completedEntries]);

  const cellRefs = useRef<Map<CellKey, HTMLButtonElement>>(new Map());
  const cellEntryMap = useRef(buildCellEntryMap(entries));
  const cellNumberMap = useRef(buildCellNumberMap(entries));
  const didAutoFocus = useRef(false);

  const focusIndex = useCallback((entry: CrosswordEntry, index: number) => {
    if (index < 0) return;
    const { row, col } = cellAt(entry, index);
    const key = cellKey(row, col);
    requestAnimationFrame(() => {
      cellRefs.current.get(key)?.focus();
    });
  }, []);

  /** Focus the first incomplete tile in a word (skips already-filled crosses). */
  const focusFirstEmpty = useCallback(
    (entry: CrosswordEntry, letters: Map<CellKey, string>) => {
      const idx = firstEmptyIndex(entry, letters);
      focusIndex(entry, idx >= 0 ? idx : 0);
    },
    [focusIndex],
  );

  useEffect(() => {
    if (didAutoFocus.current) return;
    const initial = getInitialEntry(entries);
    if (!initial) return;
    didAutoFocus.current = true;
    setActiveEntry(initial);
    focusFirstEmpty(initial, new Map());
  }, [entries, focusFirstEmpty]);

  const selectEntry = useCallback(
    (entry: CrosswordEntry) => {
      setActiveEntry(entry);
      focusFirstEmpty(entry, userGrid);
    },
    [focusFirstEmpty, userGrid],
  );

  const activeCells = useMemo(() => {
    const set = new Set<CellKey>();
    if (!activeEntry) return set;
    for (let i = 0; i < activeEntry.answer.length; i++) {
      const { row, col } = cellAt(activeEntry, i);
      set.add(cellKey(row, col));
    }
    return set;
  }, [activeEntry]);

  const handleCellClick = useCallback(
    (row: number, col: number) => {
      if (isComplete) return;
      const key = cellKey(row, col);
      const cellEntries = cellEntryMap.current.get(key) ?? [];
      if (cellEntries.length === 0) return;

      let nextEntry: CrosswordEntry | null = null;

      if (activeEntry && activeCells.has(key)) {
        const otherDir = activeEntry.direction === "across" ? "down" : "across";
        const alt = cellEntries.find((e) => e.direction === otherDir);
        nextEntry = alt ?? activeEntry;
      } else {
        nextEntry =
          cellEntries.find((e) => e.direction === "across") ??
          cellEntries[0] ??
          null;
      }

      if (!nextEntry) return;
      setActiveEntry(nextEntry);
      // Always land on the first incomplete tile of the selected word
      focusFirstEmpty(nextEntry, userGrid);
    },
    [activeEntry, activeCells, isComplete, focusFirstEmpty, userGrid],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent, row: number, col: number) => {
      if (!activeEntry || isComplete) return;
      const currentIndex = indexInEntry(activeEntry, row, col);
      const key = cellKey(row, col);
      const locked = completedCells.has(key);

      if (e.key === "Backspace") {
        e.preventDefault();

        if (!locked && (userGrid.get(key) ?? "")) {
          setUserGrid((prev) => {
            const next = new Map(prev);
            next.delete(key);
            return next;
          });
          setRevealed(false);
          return;
        }

        // Jump back to the previous editable tile (skip locked crosses)
        const prevIdx = prevEditableIndex(
          activeEntry,
          currentIndex,
          completedCells,
        );
        if (prevIdx >= 0) {
          const prev = cellAt(activeEntry, prevIdx);
          const prevKey = cellKey(prev.row, prev.col);
          setUserGrid((prevMap) => {
            const next = new Map(prevMap);
            next.delete(prevKey);
            return next;
          });
          setRevealed(false);
          focusIndex(activeEntry, prevIdx);
        }
        return;
      }

      if (
        e.key === "ArrowRight" ||
        e.key === "ArrowLeft" ||
        e.key === "ArrowUp" ||
        e.key === "ArrowDown"
      ) {
        e.preventDefault();
        const dRow = e.key === "ArrowDown" ? 1 : e.key === "ArrowUp" ? -1 : 0;
        const dCol = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
        const targetKey = cellKey(row + dRow, col + dCol);
        const targetBtn = cellRefs.current.get(targetKey);
        if (targetBtn) {
          const targetEntries = cellEntryMap.current.get(targetKey) ?? [];
          if (targetEntries.length > 0 && !activeCells.has(targetKey)) {
            const sameDir = targetEntries.find(
              (ent) => ent.direction === activeEntry.direction,
            );
            const nextEntry = sameDir ?? targetEntries[0]!;
            setActiveEntry(nextEntry);
            focusFirstEmpty(nextEntry, userGrid);
          } else {
            targetBtn.focus();
          }
        }
        return;
      }

      if (/^[a-zA-Z]$/.test(e.key)) {
        e.preventDefault();

        // If focus is on an already-filled tile, jump to the first empty one
        let writeIndex = currentIndex;
        if (locked || userGrid.get(key)) {
          const emptyIdx = firstEmptyIndex(activeEntry, userGrid);
          if (emptyIdx < 0) return;
          writeIndex = emptyIdx;
          focusIndex(activeEntry, emptyIdx);
        }

        const writePos = cellAt(activeEntry, writeIndex);
        const writeKey = cellKey(writePos.row, writePos.col);
        if (completedCells.has(writeKey)) return;

        const letter = e.key.toUpperCase();
        const next = new Map(userGrid);
        next.set(writeKey, letter);
        setUserGrid(next);
        setRevealed(false);

        if (isEntryComplete(activeEntry, next)) {
          const nextEntry = getNextIncompleteEntry(entries, activeEntry, next);
          if (nextEntry) {
            setActiveEntry(nextEntry);
            focusFirstEmpty(nextEntry, next);
          }
          return;
        }

        // Skip ahead to the next incomplete tile in this word
        const emptyIdx = nextEmptyIndex(activeEntry, next, writeIndex);
        if (emptyIdx >= 0) {
          focusIndex(activeEntry, emptyIdx);
        }
      }
    },
    [
      activeEntry,
      activeCells,
      userGrid,
      entries,
      focusFirstEmpty,
      focusIndex,
      isComplete,
      completedCells,
    ],
  );

  function handleReveal() {
    const next = new Map<CellKey, string>();
    for (const entry of entries) {
      for (let i = 0; i < entry.answer.length; i++) {
        const { row, col } = cellAt(entry, i);
        next.set(cellKey(row, col), entry.answer[i]!);
      }
    }
    setUserGrid(next);
    setRevealed(true);
  }

  function handleReset() {
    setUserGrid(new Map());
    setRevealed(false);
    const initial = getInitialEntry(entries);
    setActiveEntry(initial);
    if (initial) focusFirstEmpty(initial, new Map());
  }

  // Size tiles from letter count (free-form, not bounding box)
  const letterCount = letterCells.length;
  const cellSizeClass =
    letterCount >= 40
      ? "h-10 w-10 text-sm sm:h-12 sm:w-12 sm:text-base"
      : letterCount >= 25
        ? "h-12 w-12 text-base sm:h-14 sm:w-14 sm:text-lg"
        : "h-14 w-14 text-lg sm:h-16 sm:w-16 sm:text-xl";

  const acrossEntries = entries
    .filter((e) => e.direction === "across")
    .sort((a, b) => a.number - b.number);
  const downEntries = entries
    .filter((e) => e.direction === "down")
    .sort((a, b) => a.number - b.number);

  function renderFreeformGrid(opts: {
    interactive: boolean;
    compact?: boolean;
  }) {
    const size = opts.compact
      ? "h-7 w-7 text-xs sm:h-8 sm:w-8 sm:text-sm"
      : cellSizeClass;

    return (
      <div
        className="inline-grid gap-1"
        style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, auto))` }}
        role={opts.interactive ? "grid" : undefined}
        aria-label={
          opts.interactive ? `${puzzle.title} crossword grid` : undefined
        }
        aria-hidden={opts.interactive ? undefined : true}
      >
        {Array.from({ length: rows }, (_, row) =>
          Array.from({ length: cols }, (_, col) => {
            const letter = grid[row]?.[col];
            // Free-form: empty slots are invisible spacers (no black squares)
            if (letter === null || letter === undefined) {
              return (
                <div
                  key={cellKey(row, col)}
                  className={size}
                  aria-hidden="true"
                />
              );
            }

            const key = cellKey(row, col);
            const isActive = activeCells.has(key);
            const number = cellNumberMap.current.get(key);
            const typed = userGrid.get(key) ?? "";
            const isWordComplete = completedCells.has(key);

            let cellBg =
              "bg-slate-800 text-slate-100 ring-1 ring-white/10";
            if (isActive && opts.interactive) {
              cellBg = "bg-sky-500/30 text-white ring-1 ring-sky-400/50";
            }
            if (isWordComplete) {
              cellBg = isActive && opts.interactive
                ? "bg-emerald-500/45 text-emerald-50 ring-1 ring-emerald-400/60"
                : "bg-emerald-500/30 text-emerald-200 ring-1 ring-emerald-400/40";
            }

            if (!opts.interactive) {
              return (
                <div
                  key={key}
                  className={`relative flex items-center justify-center rounded-md font-bold ${size} bg-emerald-500/30 text-emerald-200 ring-1 ring-emerald-400/40`}
                >
                  {userGrid.get(key) ?? letter}
                </div>
              );
            }

            return (
              <button
                key={key}
                ref={(el) => {
                  if (el) cellRefs.current.set(key, el);
                  else cellRefs.current.delete(key);
                }}
                type="button"
                onClick={() => handleCellClick(row, col)}
                onKeyDown={(ev) => handleKeyDown(ev, row, col)}
                aria-label={`Row ${row + 1}, Column ${col + 1}${typed ? `, contains ${typed}` : ""}${isWordComplete ? ", correct" : ""}`}
                className={`relative flex items-center justify-center rounded-md font-bold transition focus:z-10 focus:outline-none focus:ring-2 focus:ring-sky-400 ${size} ${cellBg}`}
              >
                {number !== undefined && (
                  <span className="absolute left-1 top-0.5 text-[9px] font-semibold leading-none text-slate-400 sm:text-[10px]">
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
    );
  }

  // ── Completion screen ───────────────────────────────────────────────────

  if (isComplete) {
    return (
      <div className="flex flex-col items-center gap-8 py-6 text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500/15 ring-1 ring-emerald-400/30">
          <PartyPopper className="h-10 w-10 text-emerald-400" aria-hidden="true" />
        </div>
        <div>
          <h2 className="text-3xl font-black text-white">Congratulations!</h2>
          <p className="mt-2 text-slate-400">
            You solved{" "}
            <span className="font-semibold text-emerald-300">{puzzle.title}</span>.
            Every word is correct.
          </p>
        </div>

        {renderFreeformGrid({ interactive: false, compact: true })}

        <button
          type="button"
          onClick={handleReset}
          className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-5 py-2.5 text-sm font-medium text-slate-200 transition hover:border-sky-400/40 hover:bg-sky-500/10 hover:text-sky-300"
        >
          <RotateCcw className="h-4 w-4" aria-hidden="true" />
          Play again
        </button>
      </div>
    );
  }

  // ── Playing UI ──────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-8 lg:flex-row lg:items-start">
        <div className="flex flex-col items-center gap-4">
          {renderFreeformGrid({ interactive: true })}

          <div className="flex flex-wrap justify-center gap-2">
            <button
              type="button"
              onClick={handleReveal}
              className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-slate-200 transition hover:border-amber-400/40 hover:bg-amber-500/10 hover:text-amber-300"
            >
              <Eye className="h-4 w-4" aria-hidden="true" />
              Reveal
            </button>
            <button
              type="button"
              onClick={handleReset}
              className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-slate-200 transition hover:border-red-400/40 hover:bg-red-500/10 hover:text-red-300"
            >
              <RotateCcw className="h-4 w-4" aria-hidden="true" />
              Reset
            </button>
          </div>
        </div>

        <div className="flex min-w-0 flex-1 flex-col gap-5">
          <ClueGroup
            title="Across"
            entries={acrossEntries}
            activeEntry={activeEntry}
            completedIds={completedEntries}
            onSelect={selectEntry}
          />
          <ClueGroup
            title="Down"
            entries={downEntries}
            activeEntry={activeEntry}
            completedIds={completedEntries}
            onSelect={selectEntry}
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
  completedIds,
  onSelect,
}: {
  title: string;
  entries: CrosswordEntry[];
  activeEntry: CrosswordEntry | null;
  completedIds: Set<string>;
  onSelect: (entry: CrosswordEntry) => void;
}) {
  return (
    <div>
      <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-500">
        {title}
      </h3>
      <ol className="space-y-1">
        {entries.map((entry) => {
          const id = entryId(entry);
          const isActive =
            activeEntry?.number === entry.number &&
            activeEntry?.direction === entry.direction;
          const isDone = completedIds.has(id);
          return (
            <li key={id}>
              <button
                type="button"
                onClick={() => onSelect(entry)}
                className={`flex w-full items-center rounded-lg px-3 py-2.5 text-left text-sm transition ${
                  isDone
                    ? "bg-emerald-500/15 text-emerald-300"
                    : isActive
                      ? "bg-sky-500/20 font-semibold text-sky-200 ring-1 ring-sky-400/30"
                      : "text-slate-300 hover:bg-white/5 hover:text-white"
                }`}
              >
                <span
                  className={`mr-2 font-bold ${isDone ? "text-emerald-500" : "text-slate-500"}`}
                >
                  {entry.number}.
                </span>
                <span
                  className={
                    isDone ? "line-through decoration-emerald-500/50" : ""
                  }
                >
                  {entry.clue}
                </span>
                {isDone && (
                  <CheckCircle
                    className="ml-auto h-3.5 w-3.5 shrink-0 text-emerald-400"
                    aria-hidden="true"
                  />
                )}
              </button>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
