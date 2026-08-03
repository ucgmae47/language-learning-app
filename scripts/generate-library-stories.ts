/**
 * Batch-generate shared library stories via Gemini and insert into Supabase.
 *
 * Prerequisites:
 *   - story-library-migration.sql applied
 *   - GEMINI_API_KEY, NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY in .env.local
 *
 * Usage:
 *   npx tsx scripts/generate-library-stories.ts
 *   npx tsx scripts/generate-library-stories.ts --lang=es --level=A2 --count=2
 */

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { createClient } from "@supabase/supabase-js";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { generateObject } from "ai";
import { GeneratedStorySchema } from "../src/lib/stories/schema";
import { generateStoryTranslations } from "../src/lib/stories/translations";
import { allSentences } from "../src/lib/stories/utils";
import type { CefrLevel, Language } from "../src/lib/supabase/types";

const DEFAULTS = {
  languages: ["es", "fr"] as Language[],
  levels: ["A1", "A2", "B1", "B2"] as CefrLevel[],
  countPerCombo: 1,
  topics: ["daily life", "travel", "food", "friendship"],
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

function parseArgs() {
  const langs = [...DEFAULTS.languages];
  const levels = [...DEFAULTS.levels];
  let count = DEFAULTS.countPerCombo;

  for (const arg of process.argv.slice(2)) {
    if (arg.startsWith("--lang=")) {
      langs.splice(0, langs.length, arg.slice(7) as Language);
    } else if (arg.startsWith("--level=")) {
      levels.splice(0, levels.length, arg.slice(8) as CefrLevel);
    } else if (arg.startsWith("--count=")) {
      count = Number.parseInt(arg.slice(8), 10) || 1;
    }
  }

  return { langs, levels, count };
}

function buildPrompt(language: Language, cefrLevel: CefrLevel, topic: string): string {
  const langName = language === "es" ? "Spanish" : "French";
  return `Write an original graded reader story in ${langName} for CEFR ${cefrLevel} learners.
Topic focus: ${topic}.
Requirements:
- Entire story body in ${langName} only (5–7 short paragraphs separated by blank lines)
- Natural but level-appropriate vocabulary
- Title in ${langName}
- Exactly 5 English comprehension quiz questions with 4 options A–D
Keep it engaging and culturally appropriate.`;
}

async function main() {
  loadEnvLocal();

  if (!process.env.GEMINI_API_KEY) {
    console.error("GEMINI_API_KEY is required");
    process.exit(1);
  }
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    console.error("Supabase URL + service role key required");
    process.exit(1);
  }

  const { langs, levels, count } = parseArgs();
  const google = createGoogleGenerativeAI({ apiKey: process.env.GEMINI_API_KEY });
  const supabase = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  let created = 0;

  for (const language of langs) {
    for (const cefrLevel of levels) {
      for (let i = 0; i < count; i++) {
        const topic =
          DEFAULTS.topics[(created + i) % DEFAULTS.topics.length] ?? "daily life";
        console.log(`Generating ${language}/${cefrLevel} (${topic})...`);

        const { object } = await generateObject({
          model: google("gemini-2.5-flash-lite"),
          schema: GeneratedStorySchema,
          prompt: buildPrompt(language, cefrLevel, topic),
        });

        const translations = await generateStoryTranslations(
          object.body,
          language,
          "generate-library-stories",
        );

        if (allSentences(object.body).length !== translations.sentences.length) {
          console.warn("  sentence mismatch — skipping");
          continue;
        }

        const { error } = await supabase.from("stories").insert({
          user_id: null,
          is_library: true,
          is_queued: false,
          language,
          cefr_level: cefrLevel,
          title: object.title,
          topics: [topic],
          body: object.body,
          word_count: object.body.split(/\s+/).filter(Boolean).length,
          quiz: object.quiz,
          sentence_translations: translations.sentences,
          word_translations: translations.words,
        });

        if (error) {
          console.error("  insert failed:", error.message);
          continue;
        }

        console.log(`  ✓ ${object.title}`);
        created++;
        // Gentle pacing for free-tier API limits
        await new Promise((r) => setTimeout(r, 1500));
      }
    }
  }

  console.log(`\nCreated ${created} library stories.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
