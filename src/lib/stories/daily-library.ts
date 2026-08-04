/**
 * Shared free Story Library batch generation (Gemini → Supabase).
 * Used by the nightly cron and the offline `generate:story-library` script.
 */

import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { generateObject } from "ai";
import { createServiceClient } from "@/lib/supabase/service";
import { GeneratedStorySchema } from "@/lib/stories/schema";
import { generateStoryTranslations } from "@/lib/stories/translations";
import { allSentences } from "@/lib/stories/utils";
import { delay, withAiRetries } from "@/lib/stories/retry";
import type { CefrLevel, Language } from "@/lib/supabase/types";

export const LIBRARY_LANGUAGES: Language[] = ["es", "fr"];
export const LIBRARY_CEFR_LEVELS: CefrLevel[] = [
  "A1",
  "A2",
  "B1",
  "B2",
  "C1",
  "C2",
];

const LANGUAGE_NAMES: Record<Language, string> = {
  es: "Spanish",
  fr: "French",
};

const TOPIC_POOL = [
  "daily life",
  "travel",
  "food",
  "friendship",
  "culture",
  "nature",
  "work",
  "family",
  "music",
  "sports",
  "technology",
  "history",
] as const;

const LEVEL_GUIDANCE: Record<CefrLevel, string> = {
  A1: "Use only the most basic vocabulary. Present tense only. Very short sentences. About 150–200 words.",
  A2: "Everyday vocabulary. Present and simple past. About 200–280 words.",
  B1: "Broader everyday vocabulary and some idioms. Mix present, past, and future. About 300–400 words.",
  B2: "Wider vocabulary and complex sentences. Mix tenses naturally. About 400–520 words.",
  C1: "Sophisticated vocabulary and nuanced expression. About 500–650 words.",
  C2: "Near-native richness, idioms, and cultural texture. About 600–750 words.",
};

export type DailyLibraryComboResult = {
  language: Language;
  cefr_level: CefrLevel;
  title?: string;
  reason?: string;
  error?: string;
};

export type DailyLibraryResult = {
  date: string;
  created: DailyLibraryComboResult[];
  skipped: DailyLibraryComboResult[];
  failed: DailyLibraryComboResult[];
};

export type GenerateDailyLibraryOptions = {
  languages?: Language[];
  levels?: CefrLevel[];
  /** When true (cron default), skip lang/level pairs that already have a library story today (UTC). */
  skipExistingToday?: boolean;
  /** Pause between combos to stay within free-tier Gemini RPM. Default 1500. */
  paceMs?: number;
  /** Optional wall-clock budget; stop starting new combos once exceeded. */
  timeBudgetMs?: number;
};

function utcDateString(d = new Date()): string {
  return d.toISOString().slice(0, 10);
}

function utcDayStartIso(dateStr: string): string {
  return `${dateStr}T00:00:00.000Z`;
}

function topicFor(dateStr: string, language: Language, level: CefrLevel): string {
  const dayNum = Math.floor(Date.parse(`${dateStr}T00:00:00Z`) / 86_400_000);
  const langOffset = language === "es" ? 0 : 7;
  const levelOffset = LIBRARY_CEFR_LEVELS.indexOf(level);
  const idx = Math.abs(dayNum + langOffset + levelOffset) % TOPIC_POOL.length;
  return TOPIC_POOL[idx] ?? "daily life";
}

function buildLibraryPrompt(
  language: Language,
  cefrLevel: CefrLevel,
  topic: string,
): string {
  const langName = LANGUAGE_NAMES[language];
  return `You are an expert ${langName} language educator creating graded readers.

Write an original short story in ${langName} for CEFR ${cefrLevel} learners.
Topic focus: ${topic}.

STORY REQUIREMENTS
- Entire story body in ${langName} only — no English in the body
- Level: ${cefrLevel}. ${LEVEL_GUIDANCE[cefrLevel]}
- Structure: 5–7 short paragraphs separated by blank lines
- Title: in ${langName}, evocative, 3–8 words
- Tone: engaging and culturally appropriate

QUIZ REQUIREMENTS
- Exactly 5 English comprehension questions with options A–D
- Test understanding and inference, not vocabulary lookup
- Exactly one correct answer per question

Return structured JSON matching the schema.`;
}

/**
 * Generate one shared library story per language × CEFR level (default: all).
 */
export async function generateDailyLibraryStories(
  options: GenerateDailyLibraryOptions = {},
): Promise<DailyLibraryResult> {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY is required for library story generation.");
  }

  const languages = options.languages ?? LIBRARY_LANGUAGES;
  const levels = options.levels ?? LIBRARY_CEFR_LEVELS;
  const skipExistingToday = options.skipExistingToday ?? true;
  const paceMs = options.paceMs ?? 1500;
  const startedAt = Date.now();
  const date = utcDateString();

  const result: DailyLibraryResult = {
    date,
    created: [],
    skipped: [],
    failed: [],
  };

  const google = createGoogleGenerativeAI({
    apiKey: process.env.GEMINI_API_KEY,
  });
  const supabase = createServiceClient();

  for (const language of languages) {
    for (const cefrLevel of levels) {
      if (
        options.timeBudgetMs != null &&
        Date.now() - startedAt > options.timeBudgetMs
      ) {
        result.skipped.push({
          language,
          cefr_level: cefrLevel,
          reason: "time_budget",
        });
        continue;
      }

      if (skipExistingToday) {
        const { data: existing, error: existingError } = await supabase
          .from("stories")
          .select("id")
          .eq("is_library", true)
          .eq("language", language)
          .eq("cefr_level", cefrLevel)
          .gte("created_at", utcDayStartIso(date))
          .limit(1)
          .maybeSingle();

        if (existingError) {
          result.failed.push({
            language,
            cefr_level: cefrLevel,
            error: existingError.message,
          });
          continue;
        }

        if (existing) {
          result.skipped.push({
            language,
            cefr_level: cefrLevel,
            reason: "already_created_today",
          });
          continue;
        }
      }

      const topic = topicFor(date, language, cefrLevel);

      try {
        const { object } = await withAiRetries(
          () =>
            generateObject({
              model: google("gemini-2.5-flash-lite"),
              schema: GeneratedStorySchema,
              prompt: buildLibraryPrompt(language, cefrLevel, topic),
            }),
          { label: `daily-library/${language}/${cefrLevel}` },
        );

        const translations = await generateStoryTranslations(
          object.body,
          language,
          `daily-library/${language}/${cefrLevel}`,
        );

        if (allSentences(object.body).length !== translations.sentences.length) {
          result.failed.push({
            language,
            cefr_level: cefrLevel,
            error: "sentence_translation_mismatch",
          });
          continue;
        }

        const { error: insertError } = await supabase.from("stories").insert({
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

        if (insertError) {
          result.failed.push({
            language,
            cefr_level: cefrLevel,
            error: insertError.message,
          });
          continue;
        }

        result.created.push({
          language,
          cefr_level: cefrLevel,
          title: object.title,
        });
      } catch (err) {
        result.failed.push({
          language,
          cefr_level: cefrLevel,
          error: err instanceof Error ? err.message : String(err),
        });
      }

      await delay(paceMs);
    }
  }

  return result;
}

/** Soft kill-switch — set ENABLE_DAILY_LIBRARY_STORIES=false to skip the cron work. */
export function isDailyLibraryCronEnabled(): boolean {
  return process.env.ENABLE_DAILY_LIBRARY_STORIES !== "false";
}
