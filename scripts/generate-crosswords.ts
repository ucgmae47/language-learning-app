/**
 * Generates AI crossword puzzles and writes src/lib/crossword/generated.ts
 *
 * Usage: npm run generate:crosswords
 * Requires GEMINI_API_KEY in .env.local
 */

import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { generateCrosswordBank } from "../src/lib/crossword/generate";
import type { CrosswordPuzzle } from "../src/lib/crossword/puzzles";

const PUZZLES_PER_LANGUAGE = 12;

function loadEnvLocal() {
  try {
    const envPath = resolve(process.cwd(), ".env.local");
    const content = readFileSync(envPath, "utf8");
    for (const line of content.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq === -1) continue;
      const key = trimmed.slice(0, eq).trim();
      const value = trimmed.slice(eq + 1).trim().replace(/^["']|["']$/g, "");
      if (!process.env[key]) process.env[key] = value;
    }
  } catch {
    console.warn("Could not read .env.local — ensure GEMINI_API_KEY is set.");
  }
}

function serializePuzzle(p: CrosswordPuzzle): string {
  const grid = JSON.stringify(p.grid, null, 2)
    .split("\n")
    .map((line, i) => (i === 0 ? line : `    ${line}`))
    .join("\n");

  const entries = p.entries
    .map(
      (e) =>
        `    { number: ${e.number}, direction: "${e.direction}", row: ${e.row}, col: ${e.col}, answer: "${e.answer}", clue: ${JSON.stringify(e.clue)} }`,
    )
    .join(",\n");

  return `  {
    id: "${p.id}",
    language: "${p.language}",
    title: ${JSON.stringify(p.title)},
    grid: ${grid},
    entries: [
${entries}
    ],
  }`;
}

function writeGenerated(es: CrosswordPuzzle[], fr: CrosswordPuzzle[]) {
  const out = `/**
 * AI-generated crossword bank.
 * Regenerate: npm run generate:crosswords
 */
import type { CrosswordPuzzle } from "@/lib/crossword/puzzles";

export const GENERATED_PUZZLES_ES: CrosswordPuzzle[] = [
${es.map(serializePuzzle).join(",\n")}
];

export const GENERATED_PUZZLES_FR: CrosswordPuzzle[] = [
${fr.map(serializePuzzle).join(",\n")}
];
`;

  const target = resolve(process.cwd(), "src/lib/crossword/generated.ts");
  writeFileSync(target, out, "utf8");
  console.log(`Wrote ${es.length} ES + ${fr.length} FR puzzles → ${target}`);
}

async function main() {
  loadEnvLocal();

  if (!process.env.GEMINI_API_KEY) {
    console.error("GEMINI_API_KEY is required.");
    process.exit(1);
  }

  console.log(`Generating ${PUZZLES_PER_LANGUAGE} puzzles per language…`);

  const es = await generateCrosswordBank("es", PUZZLES_PER_LANGUAGE);
  console.log(`Spanish: ${es.length}/${PUZZLES_PER_LANGUAGE} succeeded`);

  const fr = await generateCrosswordBank("fr", PUZZLES_PER_LANGUAGE);
  console.log(`French: ${fr.length}/${PUZZLES_PER_LANGUAGE} succeeded`);

  if (es.length === 0 && fr.length === 0) {
    console.error("No puzzles generated — keeping existing generated.ts");
    process.exit(1);
  }

  writeGenerated(es, fr);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
