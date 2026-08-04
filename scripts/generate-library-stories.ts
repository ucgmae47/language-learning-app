/**
 * Batch-generate shared library stories via Gemini and insert into Supabase.
 *
 * Prerequisites:
 *   - story-library-migration.sql applied
 *   - GEMINI_API_KEY, NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY in .env.local
 *
 * Usage:
 *   npx tsx scripts/generate-library-stories.ts
 *   npx tsx scripts/generate-library-stories.ts --lang=es --level=A2
 *   npx tsx scripts/generate-library-stories.ts --once-per-day   # same idempotency as cron
 */

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  generateDailyLibraryStories,
  LIBRARY_CEFR_LEVELS,
  LIBRARY_LANGUAGES,
} from "../src/lib/stories/daily-library";
import type { CefrLevel, Language } from "../src/lib/supabase/types";

function loadEnvLocal() {
  for (const name of [".env.local", ".env"]) {
    try {
      const content = readFileSync(resolve(process.cwd(), name), "utf8");
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
      // optional
    }
  }
}

function parseArgs() {
  let langs = [...LIBRARY_LANGUAGES];
  let levels = [...LIBRARY_CEFR_LEVELS];
  let skipExistingToday = false;

  for (const arg of process.argv.slice(2)) {
    if (arg.startsWith("--lang=")) {
      langs = [arg.slice(7) as Language];
    } else if (arg.startsWith("--level=")) {
      levels = [arg.slice(8) as CefrLevel];
    } else if (arg === "--once-per-day") {
      skipExistingToday = true;
    }
  }

  return { langs, levels, skipExistingToday };
}

async function main() {
  loadEnvLocal();

  if (!process.env.GEMINI_API_KEY) {
    console.error("GEMINI_API_KEY is required");
    process.exit(1);
  }
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.SUPABASE_SERVICE_ROLE_KEY
  ) {
    console.error("Supabase URL + service role key required");
    process.exit(1);
  }

  const { langs, levels, skipExistingToday } = parseArgs();
  console.log(
    `Generating library stories for ${langs.join(",")} × ${levels.join(",")} (skipExistingToday=${skipExistingToday})…`,
  );

  const result = await generateDailyLibraryStories({
    languages: langs,
    levels,
    skipExistingToday,
  });

  for (const row of result.created) {
    console.log(`  ✓ [${row.language}/${row.cefr_level}] ${row.title}`);
  }
  for (const row of result.skipped) {
    console.log(`  · skip [${row.language}/${row.cefr_level}] ${row.reason}`);
  }
  for (const row of result.failed) {
    console.error(`  ✗ [${row.language}/${row.cefr_level}] ${row.error}`);
  }

  console.log(
    `\nDone ${result.date}: created=${result.created.length} skipped=${result.skipped.length} failed=${result.failed.length}`,
  );

  if (result.failed.length > 0 && result.created.length === 0) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
