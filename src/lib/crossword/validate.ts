import type { CrosswordEntry, CrosswordPuzzle } from "@/lib/crossword/puzzles";
import type { CrosswordTemplate } from "@/lib/crossword/templates";

const LETTER_RE = /^[A-Z]$/;

export function normalizeAnswer(word: string): string {
  return word
    .toUpperCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^A-Z]/g, "");
}

function cellLetters(
  entry: Pick<CrosswordEntry, "direction" | "row" | "col" | "answer">,
): Map<string, string> {
  const map = new Map<string, string>();
  const answer = normalizeAnswer(entry.answer);
  for (let i = 0; i < answer.length; i++) {
    const r = entry.direction === "across" ? entry.row : entry.row + i;
    const c = entry.direction === "down" ? entry.col : entry.col + i;
    map.set(`${r},${c}`, answer[i]!);
  }
  return map;
}

export function validateFilledPuzzle(
  template: CrosswordTemplate,
  entries: CrosswordEntry[],
): string | null {
  if (entries.length !== template.slots.length) {
    return `Expected ${template.slots.length} entries, got ${entries.length}`;
  }

  for (const slot of template.slots) {
    const entry = entries.find(
      (e) => e.number === slot.number && e.direction === slot.direction,
    );
    if (!entry) {
      return `Missing entry #${slot.number} ${slot.direction}`;
    }
    const answer = normalizeAnswer(entry.answer);
    if (answer.length !== slot.length) {
      return `Entry #${slot.number} ${slot.direction}: length ${answer.length} ≠ ${slot.length}`;
    }
    if (!/^[A-Z]+$/.test(answer)) {
      return `Entry #${slot.number} ${slot.direction}: invalid letters`;
    }
    if (entry.row !== slot.row || entry.col !== slot.col) {
      return `Entry #${slot.number} ${slot.direction}: wrong position`;
    }
    if (!entry.clue.trim()) {
      return `Entry #${slot.number} ${slot.direction}: empty clue`;
    }
  }

  const letterMaps = entries.map((e) =>
    cellLetters({ ...e, answer: normalizeAnswer(e.answer) }),
  );

  for (let i = 0; i < letterMaps.length; i++) {
    for (let j = i + 1; j < letterMaps.length; j++) {
      for (const [key, letter] of letterMaps[i]!) {
        const other = letterMaps[j]!.get(key);
        if (other && other !== letter) {
          return `Intersection mismatch at ${key}: ${letter} vs ${other}`;
        }
      }
    }
  }

  return null;
}

export function validateGridMatchesTemplate(
  template: CrosswordTemplate,
  grid: (string | null)[][],
): string | null {
  if (grid.length !== template.shape.length) {
    return "Grid row count mismatch";
  }

  for (let r = 0; r < template.shape.length; r++) {
    const shapeRow = template.shape[r]!;
    const gridRow = grid[r];
    if (!gridRow || gridRow.length !== shapeRow.length) {
      return `Grid width mismatch at row ${r}`;
    }
    for (let c = 0; c < shapeRow.length; c++) {
      const isWhite = shapeRow[c];
      const cell = gridRow[c];
      if (isWhite && (!cell || !LETTER_RE.test(cell))) {
        return `Missing letter at ${r},${c}`;
      }
      if (!isWhite && cell !== null) {
        return `Black cell expected at ${r},${c}`;
      }
    }
  }

  return null;
}

export function validateGridMatchesEntries(
  entries: CrosswordEntry[],
  grid: (string | null)[][],
): string | null {
  for (const entry of entries) {
    const answer = normalizeAnswer(entry.answer);
    for (let i = 0; i < answer.length; i++) {
      const r = entry.direction === "across" ? entry.row : entry.row + i;
      const c = entry.direction === "down" ? entry.col : entry.col + i;
      const cell = grid[r]?.[c];
      if (cell?.toUpperCase() !== answer[i]) {
        return `Grid/entry mismatch at ${r},${c}`;
      }
    }
  }
  return null;
}

export function buildGridFromEntries(
  template: CrosswordTemplate,
  entries: CrosswordEntry[],
): (string | null)[][] {
  const grid: (string | null)[][] = template.shape.map((row) =>
    row.map((cell) => (cell ? "" : null)),
  );

  for (const entry of entries) {
    const answer = normalizeAnswer(entry.answer);
    for (let i = 0; i < answer.length; i++) {
      const r = entry.direction === "across" ? entry.row : entry.row + i;
      const c = entry.direction === "down" ? entry.col : entry.col + i;
      grid[r]![c] = answer[i]!;
    }
  }

  return grid;
}

export function assemblePuzzle(
  id: string,
  language: CrosswordPuzzle["language"],
  title: string,
  template: CrosswordTemplate,
  rawEntries: Array<{
    number: number;
    direction: "across" | "down";
    row: number;
    col: number;
    answer: string;
    clue: string;
  }>,
): CrosswordPuzzle | null {
  const entries: CrosswordEntry[] = template.slots.map((slot) => {
    const raw = rawEntries.find(
      (e) =>
        e.number === slot.number &&
        e.direction === slot.direction &&
        e.row === slot.row &&
        e.col === slot.col,
    );
    if (!raw) return null as unknown as CrosswordEntry;
    return {
      number: slot.number,
      direction: slot.direction,
      row: slot.row,
      col: slot.col,
      answer: normalizeAnswer(raw.answer),
      clue: raw.clue.trim(),
    };
  });

  if (entries.some((e) => !e)) return null;

  const error = validateFilledPuzzle(template, entries);
  if (error) return null;

  return {
    id,
    language,
    title,
    grid: buildGridFromEntries(template, entries),
    entries,
  };
}

export function assemblePuzzleFromGrid(
  id: string,
  language: CrosswordPuzzle["language"],
  title: string,
  template: CrosswordTemplate,
  grid: (string | null)[][],
  rawEntries: Array<{
    number: number;
    direction: "across" | "down";
    row: number;
    col: number;
    answer: string;
    clue: string;
  }>,
): CrosswordPuzzle | null {
  const normalizedGrid = grid.map((row) =>
    row.map((cell) => (cell === null ? null : cell.toUpperCase())),
  );

  const entries: CrosswordEntry[] = rawEntries.map((raw) => ({
    number: raw.number,
    direction: raw.direction,
    row: raw.row,
    col: raw.col,
    answer: normalizeAnswer(raw.answer),
    clue: raw.clue.trim(),
  }));

  const shapeError = validateGridMatchesTemplate(template, normalizedGrid);
  if (shapeError) return null;

  const slotError = validateFilledPuzzle(template, entries);
  if (slotError) return null;

  const gridError = validateGridMatchesEntries(entries, normalizedGrid);
  if (gridError) return null;

  return {
    id,
    language,
    title: title.trim(),
    grid: normalizedGrid,
    entries,
  };
}
