import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { generateObject } from "ai";
import type { Language } from "@/lib/supabase/types";
import type { CrosswordPuzzle } from "@/lib/crossword/puzzles";
import { GeneratedCrosswordSchema } from "@/lib/crossword/schema";
import { assemblePuzzleFromGrid } from "@/lib/crossword/validate";
import { CROSSWORD_TEMPLATES, type CrosswordTemplate } from "@/lib/crossword/templates";

const LANG_NAMES: Record<Language, string> = { es: "Spanish", fr: "French" };

const THEMES = [
  "food and cooking",
  "travel and cities",
  "nature and weather",
  "home and family",
  "school and work",
  "sports and hobbies",
  "animals",
  "music and art",
  "shopping",
  "health and body",
  "emotions",
  "technology",
];

function shapeToAscii(shape: CrosswordTemplate["shape"]): string {
  return shape
    .map((row) => row.map((cell) => (cell ? "_" : "#")).join(""))
    .join("\n");
}

function buildPrompt(
  template: CrosswordTemplate,
  language: Language,
  theme: string,
  cefrLevel: string,
): string {
  const langName = LANG_NAMES[language];
  const slotList = template.slots
    .map(
      (s) =>
        `  #${s.number} ${s.direction} — start row ${s.row}, col ${s.col}, length ${s.length}`,
    )
    .join("\n");

  return `Create a ${langName} crossword for CEFR ${cefrLevel} learners.

Theme: ${theme}

Grid shape (# = black square, _ = white cell to fill):
${shapeToAscii(template.shape)}

Word slots (fill every slot):
${slotList}

Prefer longer real vocabulary (6–9 letters) that fits each slot length exactly.

Example of a valid ladder grid in JSON:
grid: [["C","A","S","A"],["A",null,null,null],["S","O","L","A"]]
entries: CASA across (0,0), SOLA across (2,0), CAS down (0,0) — letters must match at intersections.

Rules:
- Return the complete filled grid AND entries array.
- Use real ${langName} words appropriate for ${cefrLevel}.
- Letters: uppercase A–Z only, no accents (CAFE not CAFÉ).
- Clues: short English definitions.
- Every white cell in the shape must contain exactly one letter.
- Black cells must be null in the grid array.
- Entry row/col/answer must match the grid letters exactly.`;
}

export async function generateCrosswordPuzzle(
  language: Language,
  template: CrosswordTemplate,
  theme: string,
  puzzleIndex: number,
  cefrLevel = "B1",
): Promise<CrosswordPuzzle | null> {
  const google = createGoogleGenerativeAI({
    apiKey: process.env.GEMINI_API_KEY ?? "",
  });

  const prompt = buildPrompt(template, language, theme, cefrLevel);

  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const { object } = await generateObject({
        model: google("gemini-2.5-flash-lite"),
        schema: GeneratedCrosswordSchema,
        prompt:
          attempt > 0
            ? `${prompt}\n\nRETRY: previous grid had errors. Verify every intersection letter matches and grid shape is exact.`
            : prompt,
      });

      if (process.env.CROSSWORD_DEBUG) {
        console.log(JSON.stringify(object, null, 2));
      }

      const puzzle = assemblePuzzleFromGrid(
        `${language}-gen-${puzzleIndex}`,
        language,
        object.title,
        template,
        object.grid,
        object.entries,
      );

      if (puzzle) return puzzle;
    } catch (err) {
      if (process.env.CROSSWORD_DEBUG) {
        console.error("generateObject error:", err);
      }
    }
  }

  return null;
}

export async function generateCrosswordBank(
  language: Language,
  count: number,
  cefrLevel = "B1",
): Promise<CrosswordPuzzle[]> {
  const puzzles: CrosswordPuzzle[] = [];

  for (let i = 0; i < count; i++) {
    const template = CROSSWORD_TEMPLATES[i % CROSSWORD_TEMPLATES.length]!;
    const theme = THEMES[i % THEMES.length]!;

    const puzzle = await generateCrosswordPuzzle(
      language,
      template,
      theme,
      i + 1,
      cefrLevel,
    );

    if (puzzle) {
      puzzle.id = `${language}-ai-${i + 1}`;
      puzzles.push(puzzle);
      console.log(`  ✓ ${puzzle.id}: ${puzzle.title}`);
    } else {
      console.warn(`  ✗ ${language} puzzle ${i + 1} failed validation`);
    }

    await new Promise((r) => setTimeout(r, 2000));
  }

  return puzzles;
}
