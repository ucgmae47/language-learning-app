/**
 * Shared story translation generation (sentences + word glosses).
 */

import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { generateText } from "ai";
import { allSentences, extractContentWords } from "@/lib/stories/utils";
import { withAiRetries } from "@/lib/stories/retry";
import type { Language } from "@/lib/supabase/types";

export type StoryTranslations = {
  sentences: string[];
  words: Record<string, string>;
};

/**
 * Generate sentence + word translations for a story body.
 * Throws if the model fails or returns an incomplete sentence list.
 */
export async function generateStoryTranslations(
  body: string,
  language: Language,
  label = "stories/translations",
): Promise<StoryTranslations> {
  const sentences = allSentences(body);
  const words = extractContentWords(body);
  const langName = language === "es" ? "Spanish" : "French";

  const google = createGoogleGenerativeAI({
    apiKey: process.env.GEMINI_API_KEY ?? "",
  });

  const prompt = `You are a professional ${langName}-to-English translator.

Return ONLY a valid JSON object — no markdown fences, no extra text, nothing else.

The JSON must have exactly this structure:
{
  "sentences": ["English translation of sentence 1", "English translation of sentence 2", ...],
  "words": {
    "word1": "1-3 word meaning",
    "word2": "1-3 word meaning"
  }
}

Rules:
- "sentences" must be an array with EXACTLY ${sentences.length} items, one per sentence, in the same order.
- "words" keys must be lowercase with no punctuation.
- Include EVERY listed word, including short words and articles (el, la, un, a, y, de, etc.).
- Word meanings must be 1-3 words, lowercase.

Sentences to translate (in order):
${sentences.map((s, i) => `${i + 1}. ${s}`).join("\n")}

Words to translate:
${words.join(", ")}`;

  const { text: raw } = await withAiRetries(
    () =>
      generateText({
        model: google("gemini-2.5-flash-lite"),
        prompt,
        maxOutputTokens: 8192,
        maxRetries: 0,
      }),
    { attempts: 5, label },
  );

  const cleaned = raw
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```\s*$/i, "")
    .trim();

  const parsed = JSON.parse(cleaned) as {
    sentences?: string[];
    words?: Record<string, string>;
  };

  if (
    !Array.isArray(parsed.sentences) ||
    parsed.sentences.length !== sentences.length
  ) {
    throw new Error(
      `Translation sentence count mismatch (got ${parsed.sentences?.length ?? 0}, expected ${sentences.length})`,
    );
  }

  if (!parsed.words || typeof parsed.words !== "object") {
    throw new Error("Translation response missing words map");
  }

  return {
    sentences: parsed.sentences,
    words: parsed.words,
  };
}
