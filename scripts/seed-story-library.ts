/**
 * Seeds the shared free Story Library from data/story-library-seed.json.
 *
 * Prerequisites:
 *   1. Run supabase/story-library-migration.sql in the Supabase SQL editor
 *   2. Set NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY in .env.local
 *
 * Usage:
 *   npm run seed:story-library
 *   npm run seed:story-library -- --update-translations
 *
 * `--update-translations` patches word_translations (and sentence_translations)
 * on library rows that already exist, so incomplete Gemini seed glosses can be
 * fixed without deleting stories.
 */

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { createClient } from "@supabase/supabase-js";
import { extractContentWords, allSentences } from "../src/lib/stories/utils";
import type { CefrLevel, Language, StoryQuizQuestion } from "../src/lib/supabase/types";

type SeedStory = {
  language: Language;
  cefr_level: CefrLevel;
  title: string;
  topics: string[];
  body: string;
  sentence_translations: string[];
  word_translations: Record<string, string>;
  quiz: StoryQuizQuestion[];
};

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

function wordCount(body: string): number {
  return body.split(/\s+/).filter(Boolean).length;
}

function assertCompleteGlosses(seed: SeedStory) {
  const expected = extractContentWords(seed.body);
  const missing = expected.filter((w) => !seed.word_translations[w]);
  if (missing.length > 0) {
    throw new Error(
      `"${seed.title}" is missing ${missing.length} word glosses (e.g. ${missing.slice(0, 8).join(", ")})`,
    );
  }
}

async function main() {
  loadEnvLocal();

  const updateTranslations = process.argv.includes("--update-translations");

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    console.error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local",
    );
    process.exit(1);
  }

  const seeds = JSON.parse(
    readFileSync(resolve(process.cwd(), "data/story-library-seed.json"), "utf8"),
  ) as SeedStory[];

  const supabase = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  let inserted = 0;
  let skipped = 0;
  let updated = 0;

  for (const seed of seeds) {
    const sentences = allSentences(seed.body);
    if (sentences.length !== seed.sentence_translations.length) {
      console.error(
        `✗ "${seed.title}": sentence count mismatch (body=${sentences.length}, translations=${seed.sentence_translations.length})`,
      );
      process.exit(1);
    }

    try {
      assertCompleteGlosses(seed);
    } catch (err) {
      console.error(`✗ ${err instanceof Error ? err.message : err}`);
      process.exit(1);
    }

    const { data: existing } = await supabase
      .from("stories")
      .select("id, word_translations")
      .eq("is_library", true)
      .eq("language", seed.language)
      .eq("title", seed.title)
      .maybeSingle<{ id: string; word_translations: Record<string, string> | null }>();

    if (existing) {
      if (updateTranslations) {
        const { error } = await supabase
          .from("stories")
          .update({
            sentence_translations: seed.sentence_translations,
            word_translations: seed.word_translations,
          })
          .eq("id", existing.id);

        if (error) {
          console.error(`✗ Failed to update "${seed.title}":`, error.message);
          process.exit(1);
        }
        console.log(
          `✓ updated glosses: [${seed.language}/${seed.cefr_level}] ${seed.title}`,
        );
        updated++;
      } else {
        console.log(
          `· skip (exists): [${seed.language}/${seed.cefr_level}] ${seed.title}`,
        );
        skipped++;
      }
      continue;
    }

    const { error } = await supabase.from("stories").insert({
      user_id: null,
      is_library: true,
      is_queued: false,
      language: seed.language,
      cefr_level: seed.cefr_level,
      title: seed.title,
      topics: seed.topics,
      body: seed.body,
      word_count: wordCount(seed.body),
      quiz: seed.quiz,
      sentence_translations: seed.sentence_translations,
      word_translations: seed.word_translations,
    });

    if (error) {
      console.error(`✗ Failed to insert "${seed.title}":`, error.message);
      process.exit(1);
    }

    console.log(`✓ inserted: [${seed.language}/${seed.cefr_level}] ${seed.title}`);
    inserted++;
  }

  console.log(
    `\nDone. inserted=${inserted} updated=${updated} skipped=${skipped}`,
  );
  if (skipped > 0 && !updateTranslations) {
    console.log(
      "Tip: re-run with --update-translations to patch word glosses on existing library stories.",
    );
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
