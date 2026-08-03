import type { Language } from "@/lib/supabase/types";

export type CrosswordEntry = {
  number: number;
  direction: "across" | "down";
  row: number;
  col: number;
  answer: string;
  clue: string;
};

export type CrosswordPuzzle = {
  id: string;
  language: Language;
  title: string;
  /** 2-D array: a letter string = white cell, null = black cell. */
  grid: (string | null)[][];
  entries: CrosswordEntry[];
};

// ─────────────────────────────────────────────────────────────────────────────
// SPANISH PUZZLES
// ─────────────────────────────────────────────────────────────────────────────

/**
 * ES-1  (4 rows × 3 cols)
 *
 *   M A R
 *   E # O
 *   T A L
 *   A # #
 *
 * ACROSS  1-MAR  3-TAL
 * DOWN    1-META  2-ROL
 */
const ES_1: CrosswordPuzzle = {
  id: "es-1",
  language: "es",
  title: "Vocabulario básico",
  grid: [
    ["M", "A", "R"],
    ["E", null, "O"],
    ["T", "A", "L"],
    ["A", null, null],
  ],
  entries: [
    { number: 1, direction: "across", row: 0, col: 0, answer: "MAR",  clue: "The sea or ocean" },
    { number: 3, direction: "across", row: 2, col: 0, answer: "TAL",  clue: "Such; so (as in 'tal vez' — maybe)" },
    { number: 1, direction: "down",   row: 0, col: 0, answer: "META", clue: "A goal or target" },
    { number: 2, direction: "down",   row: 0, col: 2, answer: "ROL",  clue: "A role or function (loanword)" },
  ],
};

/**
 * ES-2  (3 rows × 5 cols)
 *
 *   M E S A #
 *   A # O # #
 *   R O L E S
 *
 * ACROSS  1-MESA  3-ROLES
 * DOWN    1-MAR   2-SOL
 */
const ES_2: CrosswordPuzzle = {
  id: "es-2",
  language: "es",
  title: "En casa y al aire libre",
  grid: [
    ["M", "E", "S", "A", null],
    ["A", null, "O", null, null],
    ["R", "O", "L", "E", "S"],
  ],
  entries: [
    { number: 1, direction: "across", row: 0, col: 0, answer: "MESA",  clue: "A table" },
    { number: 3, direction: "across", row: 2, col: 0, answer: "ROLES", clue: "Roles or parts played (plural)" },
    { number: 1, direction: "down",   row: 0, col: 0, answer: "MAR",   clue: "The sea" },
    { number: 2, direction: "down",   row: 0, col: 2, answer: "SOL",   clue: "The sun" },
  ],
};

/**
 * ES-3  (4 rows × 5 cols)
 *
 *   B U E N O
 *   O # L # #
 *   C A L L E
 *   A # O # #
 *
 * ACROSS  1-BUENO  3-CALLE
 * DOWN    1-BOCA   2-ELLO
 */
const ES_3: CrosswordPuzzle = {
  id: "es-3",
  language: "es",
  title: "Palabras del día",
  grid: [
    ["B", "U", "E", "N", "O"],
    ["O", null, "L", null, null],
    ["C", "A", "L", "L", "E"],
    ["A", null, "O", null, null],
  ],
  entries: [
    { number: 1, direction: "across", row: 0, col: 0, answer: "BUENO", clue: "Good; fine (adjective)" },
    { number: 3, direction: "across", row: 2, col: 0, answer: "CALLE", clue: "A street or road" },
    { number: 1, direction: "down",   row: 0, col: 0, answer: "BOCA",  clue: "The mouth" },
    { number: 2, direction: "down",   row: 0, col: 2, answer: "ELLO",  clue: "It; that (neutral pronoun)" },
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// FRENCH PUZZLES
// ─────────────────────────────────────────────────────────────────────────────

/**
 * FR-1  (3 rows × 4 cols)
 *
 *   A M I E
 *   M # L #
 *   I L E S
 *
 * ACROSS  1-AMIE  3-ILES
 * DOWN    1-AMI   2-ILE
 */
const FR_1: CrosswordPuzzle = {
  id: "fr-1",
  language: "fr",
  title: "Vocabulaire de base",
  grid: [
    ["A", "M", "I", "E"],
    ["M", null, "L", null],
    ["I", "L", "E", "S"],
  ],
  entries: [
    { number: 1, direction: "across", row: 0, col: 0, answer: "AMIE", clue: "A female friend" },
    { number: 3, direction: "across", row: 2, col: 0, answer: "ILES", clue: "Islands (plural of île)" },
    { number: 1, direction: "down",   row: 0, col: 0, answer: "AMI",  clue: "A (male) friend" },
    { number: 2, direction: "down",   row: 0, col: 2, answer: "ILE",  clue: "An island (île)" },
  ],
};

/**
 * FR-2  (5 rows × 5 cols)
 *
 *   M O N D E
 *   E # # # #
 *   R O U G E
 *   C # # # #
 *   I D O L E
 *
 * ACROSS  1-MONDE  3-ROUGE  5-IDOLE
 * DOWN    1-MERCI
 */
const FR_2: CrosswordPuzzle = {
  id: "fr-2",
  language: "fr",
  title: "Couleurs et culture",
  grid: [
    ["M", "O", "N", "D", "E"],
    ["E", null, null, null, null],
    ["R", "O", "U", "G", "E"],
    ["C", null, null, null, null],
    ["I", "D", "O", "L", "E"],
  ],
  entries: [
    { number: 1, direction: "across", row: 0, col: 0, answer: "MONDE", clue: "The world" },
    { number: 3, direction: "across", row: 2, col: 0, answer: "ROUGE", clue: "Red (colour)" },
    { number: 5, direction: "across", row: 4, col: 0, answer: "IDOLE", clue: "An idol; a revered person" },
    { number: 1, direction: "down",   row: 0, col: 0, answer: "MERCI", clue: "Thank you" },
  ],
};

/**
 * FR-3  (4 rows × 5 cols)
 *
 *   B L E U #
 *   # U # # #
 *   # N U I T
 *   # E # # #
 *
 * ACROSS  1-BLEU  3-NUIT
 * DOWN    2-LUNE
 */
const FR_3: CrosswordPuzzle = {
  id: "fr-3",
  language: "fr",
  title: "La nuit étoilée",
  grid: [
    ["B", "L", "E", "U", null],
    [null, "U", null, null, null],
    [null, "N", "U", "I", "T"],
    [null, "E", null, null, null],
  ],
  entries: [
    { number: 1, direction: "across", row: 0, col: 0, answer: "BLEU", clue: "Blue (colour)" },
    { number: 3, direction: "across", row: 2, col: 1, answer: "NUIT", clue: "Night" },
    { number: 2, direction: "down",   row: 0, col: 1, answer: "LUNE", clue: "The moon" },
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// Exports
// ─────────────────────────────────────────────────────────────────────────────

import {
  GENERATED_PUZZLES_ES,
  GENERATED_PUZZLES_FR,
} from "@/lib/crossword/generated";

const LEGACY_ES: CrosswordPuzzle[] = [ES_1, ES_2, ES_3];
const LEGACY_FR: CrosswordPuzzle[] = [FR_1, FR_2, FR_3];

/** Prefer the generated bank when large enough; legacy puzzles fill in as fallback. */
const PUZZLES_ES: CrosswordPuzzle[] =
  GENERATED_PUZZLES_ES.length >= 10
    ? GENERATED_PUZZLES_ES
    : [...LEGACY_ES, ...GENERATED_PUZZLES_ES];

const PUZZLES_FR: CrosswordPuzzle[] =
  GENERATED_PUZZLES_FR.length >= 10
    ? GENERATED_PUZZLES_FR
    : [...LEGACY_FR, ...GENERATED_PUZZLES_FR];

/**
 * Returns today's puzzle for the given language deterministically.
 * Rotates through the puzzle bank based on the epoch day.
 */
export function getPuzzleForDate(
  date: Date = new Date(),
  language: Language = "es",
): CrosswordPuzzle {
  const bank = language === "fr" ? PUZZLES_FR : PUZZLES_ES;
  const epochDays = Math.floor(date.getTime() / (1000 * 60 * 60 * 24));
  return bank[epochDays % bank.length]!;
}
