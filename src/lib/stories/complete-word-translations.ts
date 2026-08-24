/**
 * Ensure every content word in a story body has an English gloss.
 *
 * Gemini often returns incomplete word maps; these helpers merge existing
 * glosses with a small closed-class dictionary and (optionally) an AI fill
 * for anything still missing.
 */

import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { generateText } from "ai";
import { withAiRetries } from "@/lib/stories/retry";
import { extractContentWords } from "@/lib/stories/utils";
import type { Language } from "@/lib/supabase/types";

/** High-frequency function / closed-class words — no AI needed. */
const FUNCTION_GLOSSES: Record<Language, Record<string, string>> = {
  es: {
    a: "to; at",
    al: "to the",
    así: "like this; so",
    aunque: "although",
    bajo: "under; low",
    bien: "well; good",
    con: "with",
    de: "of; from",
    del: "of the",
    e: "and",
    el: "the",
    en: "in; on",
    entre: "between; among",
    era: "was",
    es: "is",
    esta: "this",
    estas: "these",
    este: "this",
    estaba: "was",
    ha: "has",
    había: "there was; had",
    han: "have",
    hasta: "until; even",
    la: "the",
    las: "the",
    lo: "it; the",
    los: "the",
    mientras: "while",
    muy: "very",
    no: "not; no",
    para: "for; to",
    pero: "but",
    por: "by; for; through",
    que: "that; which",
    se: "oneself; itself",
    sin: "without",
    sino: "but rather",
    sobre: "about; on",
    su: "his; her; their",
    sus: "his; her; their",
    también: "also",
    todos: "all; everyone",
    tras: "after",
    un: "a; an",
    una: "a; an",
    unos: "some",
    y: "and",
  },
  fr: {
    a: "has; to",
    au: "to the; at the",
    avec: "with",
    bien: "well; good",
    ces: "these",
    cette: "this",
    dans: "in",
    de: "of; from",
    des: "of the; some",
    du: "of the",
    elle: "she; it",
    en: "in; by",
    entre: "between",
    est: "is",
    et: "and",
    il: "he; it",
    ils: "they",
    la: "the",
    le: "the",
    les: "the",
    leur: "their; them",
    leurs: "their",
    lui: "him; her; it",
    ne: "not",
    nous: "we; us",
    ont: "have",
    par: "by; through",
    pas: "not",
    plus: "more; no longer",
    pour: "for",
    près: "near",
    qui: "who; which",
    sans: "without",
    se: "oneself",
    ses: "his; her; its",
    son: "his; her; its",
    sous: "under",
    tout: "all; everything",
    très: "very",
    un: "a; an",
    une: "a; an",
    à: "to; at",
    était: "was",
    être: "to be",
    "d'un": "of a",
    "d'une": "of a",
    "qu'il": "that he",
    "qu'elle": "that she",
  },
};

export function missingWordTranslations(
  body: string,
  words: Record<string, string> | null | undefined,
): string[] {
  const map = words ?? {};
  return extractContentWords(body).filter((w) => !map[w]);
}

/**
 * Merge existing glosses with closed-class defaults.
 * Existing entries always win (so AI / seed values are preserved).
 */
export function applyFunctionWordGlosses(
  body: string,
  existing: Record<string, string> | null | undefined,
  language: Language,
): Record<string, string> {
  const merged: Record<string, string> = { ...(existing ?? {}) };
  const defaults = FUNCTION_GLOSSES[language] ?? {};
  for (const word of extractContentWords(body)) {
    if (!merged[word] && defaults[word]) {
      merged[word] = defaults[word];
    }
  }
  return merged;
}

/**
 * Ask Gemini to gloss only the listed missing words.
 * Returns a partial map (may still omit some entries — caller should loop).
 */
export async function fillMissingWordGlosses(
  missing: string[],
  language: Language,
  label = "stories/word-fill",
): Promise<Record<string, string>> {
  if (missing.length === 0) return {};

  const langName = language === "es" ? "Spanish" : "French";
  const google = createGoogleGenerativeAI({
    apiKey: process.env.GEMINI_API_KEY ?? "",
  });

  const prompt = `You are a professional ${langName}-to-English translator.

Return ONLY a valid JSON object — no markdown fences, no extra text, nothing else.

The JSON must have exactly this structure:
{
  "words": {
    "word1": "1-3 word meaning",
    "word2": "1-3 word meaning"
  }
}

Rules:
- Include EVERY word listed below, including short words and articles.
- "words" keys must be lowercase with no punctuation, matching the list exactly.
- Word meanings must be 1-3 words, lowercase.

Words to translate:
${missing.join(", ")}`;

  const { text: raw } = await withAiRetries(
    () =>
      generateText({
        model: google("gemini-2.5-flash-lite"),
        prompt,
        maxOutputTokens: 4096,
        maxRetries: 0,
      }),
    { attempts: 5, label },
  );

  const cleaned = raw
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```\s*$/i, "")
    .trim();

  const parsed = JSON.parse(cleaned) as { words?: Record<string, string> };
  if (!parsed.words || typeof parsed.words !== "object") {
    throw new Error("Word-fill response missing words map");
  }
  return parsed.words;
}

/**
 * Ensure every extracted content word has a gloss.
 * 1) Keep existing values
 * 2) Fill closed-class words from the static dictionary
 * 3) Optionally call Gemini for anything still missing (up to `aiPasses`)
 */
export async function ensureCompleteWordTranslations(
  body: string,
  existing: Record<string, string> | null | undefined,
  language: Language,
  options: { useAi?: boolean; aiPasses?: number; label?: string } = {},
): Promise<{ words: Record<string, string>; stillMissing: string[] }> {
  const useAi = options.useAi ?? true;
  const aiPasses = options.aiPasses ?? 3;
  const label = options.label ?? "stories/ensure-words";

  let words = applyFunctionWordGlosses(body, existing, language);
  let missing = missingWordTranslations(body, words);

  if (useAi) {
    for (let pass = 0; pass < aiPasses && missing.length > 0; pass++) {
      const filled = await fillMissingWordGlosses(
        missing,
        language,
        `${label}/pass-${pass + 1}`,
      );
      words = { ...words, ...filled };
      // Re-apply function glosses in case the model omitted them again.
      words = applyFunctionWordGlosses(body, words, language);
      missing = missingWordTranslations(body, words);
    }
  }

  return { words, stillMissing: missing };
}
