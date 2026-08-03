import type { CrosswordEntry } from "@/lib/crossword/puzzles";

/** A fixed grid shape — AI only supplies words and clues. */
export type CrosswordTemplate = {
  id: string;
  /** null = black / empty (not rendered in free-form UI) */
  shape: (boolean | null)[][];
  slots: Array<
    Pick<CrosswordEntry, "number" | "direction" | "row" | "col"> & { length: number }
  >;
};

function shape(rows: string[]): (boolean | null)[][] {
  return rows.map((row) =>
    row.split("").map((c) => (c === "#" ? null : true)),
  );
}

/**
 * Free-form templates — only letter cells render in the UI.
 * Irregular silhouettes (SpanishDict-style), with longer words.
 */
export const CROSSWORD_TEMPLATES: CrosswordTemplate[] = [
  {
    // Classic free-form: long acrosses on a mid spine
    id: "freeform-mid-7",
    shape: shape([
      "WWWWWWW",
      "###W###",
      "WWWWWWW",
      "###W###",
      "WWWWWWW",
      "###W###",
      "WWWWWWW",
    ]),
    slots: [
      { number: 1, direction: "across", row: 0, col: 0, length: 7 },
      { number: 3, direction: "across", row: 2, col: 0, length: 7 },
      { number: 4, direction: "across", row: 4, col: 0, length: 7 },
      { number: 5, direction: "across", row: 6, col: 0, length: 7 },
      { number: 2, direction: "down", row: 0, col: 3, length: 7 },
    ],
  },
  {
    id: "freeform-left-8",
    shape: shape([
      "WWWWWWWW",
      "W#######",
      "WWWWWWWW",
      "W#######",
      "WWWWWWWW",
    ]),
    slots: [
      { number: 1, direction: "across", row: 0, col: 0, length: 8 },
      { number: 3, direction: "across", row: 2, col: 0, length: 8 },
      { number: 5, direction: "across", row: 4, col: 0, length: 8 },
      { number: 1, direction: "down", row: 0, col: 0, length: 5 },
    ],
  },
  {
    id: "freeform-wide-9",
    shape: shape([
      "WWWWWWWWW",
      "####W####",
      "WWWWWWWWW",
      "####W####",
      "WWWWWWWWW",
    ]),
    slots: [
      { number: 1, direction: "across", row: 0, col: 0, length: 9 },
      { number: 3, direction: "across", row: 2, col: 0, length: 9 },
      { number: 5, direction: "across", row: 4, col: 0, length: 9 },
      { number: 2, direction: "down", row: 0, col: 4, length: 5 },
    ],
  },
  {
    // Two crossing long downs + staggered acrosses (SpanishDict-like)
    id: "freeform-cross-7",
    shape: shape([
      "##WWWWW",
      "##W#W##",
      "WWWWWWW",
      "##W#W##",
      "##WWWWW",
      "##W#W##",
      "WWWWWWW",
    ]),
    slots: [
      { number: 1, direction: "across", row: 0, col: 2, length: 5 },
      { number: 3, direction: "across", row: 2, col: 0, length: 7 },
      { number: 5, direction: "across", row: 4, col: 2, length: 5 },
      { number: 7, direction: "across", row: 6, col: 0, length: 7 },
      { number: 1, direction: "down", row: 0, col: 2, length: 7 },
      { number: 2, direction: "down", row: 0, col: 4, length: 7 },
    ],
  },
  {
    id: "freeform-stack-6",
    shape: shape([
      "WWWWWW",
      "#W####",
      "WWWWWW",
      "#W####",
      "WWWWWW",
      "#W####",
      "WWWWWW",
    ]),
    slots: [
      { number: 1, direction: "across", row: 0, col: 0, length: 6 },
      { number: 3, direction: "across", row: 2, col: 0, length: 6 },
      { number: 4, direction: "across", row: 4, col: 0, length: 6 },
      { number: 5, direction: "across", row: 6, col: 0, length: 6 },
      { number: 2, direction: "down", row: 0, col: 1, length: 7 },
    ],
  },
  {
    id: "freeform-offset-8",
    shape: shape([
      "WWWWWWWW",
      "###W####",
      "WWWWWWWW",
      "###W####",
      "##WWWWWW",
    ]),
    slots: [
      { number: 1, direction: "across", row: 0, col: 0, length: 8 },
      { number: 3, direction: "across", row: 2, col: 0, length: 8 },
      { number: 4, direction: "across", row: 4, col: 2, length: 6 },
      { number: 2, direction: "down", row: 0, col: 3, length: 5 },
    ],
  },
];
