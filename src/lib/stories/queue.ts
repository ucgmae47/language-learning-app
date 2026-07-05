/**
 * Background story pre-generation.
 *
 * This module is called exclusively from `after()` callbacks (i.e. AFTER the
 * HTTP response has already been sent to the user).  It MUST use the service-
 * role Supabase client because request cookies are no longer available at that
 * point.
 */

import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { generateObject, generateText } from "ai";
import { createServiceClient } from "@/lib/supabase/service";
import { buildStoryPrompt } from "@/lib/stories/prompt";
import { GeneratedStorySchema } from "@/lib/stories/schema";
import { allSentences, extractContentWords } from "@/lib/stories/utils";
import { buildPersonalizedTopics } from "@/lib/stories/recommendation";
import type { CefrLevel, Language } from "@/lib/supabase/types";

/**
 * Silently generates and stores a personalised story with `is_queued = true`
 * for the given user.  Does nothing if the user already has a queued story
 * (prevents double-generation when multiple requests fire in quick succession).
 *
 * @param userId    Supabase user UUID
 * @param language  The user's currently active language ("es" | "fr")
 * @param cefrLevel The user's CEFR level
 */
export async function generateQueuedStory(
  userId: string,
  language: Language,
  cefrLevel: CefrLevel,
): Promise<void> {
  const supabase = createServiceClient();

  // ── Guard: skip if already queued ─────────────────────────────────────────
  const { data: existing } = await supabase
    .from("stories")
    .select("id")
    .eq("user_id", userId)
    .eq("is_queued", true)
    .limit(1);

  if (existing && existing.length > 0) return;

  // ── Build personalised topics ──────────────────────────────────────────────
  const { primaryGenre, secondaryGenre, interestTopics } =
    await buildPersonalizedTopics(supabase, userId, language);

  const topGenres = secondaryGenre
    ? [primaryGenre, secondaryGenre]
    : [primaryGenre];

  // Use primaryGenre as the "selected topic" so the story is firmly centred on
  // the recommendation engine's choice (not just a hint).
  const prompt = buildStoryPrompt(
    cefrLevel,
    interestTopics,
    primaryGenre,
    language,
    topGenres,
  );

  const google = createGoogleGenerativeAI({
    apiKey: process.env.GEMINI_API_KEY ?? "",
  });

  // ── Generate story ─────────────────────────────────────────────────────────
  let storyId: string | null = null;

  try {
    const { object } = await generateObject({
      model: google("gemini-2.5-flash-lite"),
      schema: GeneratedStorySchema,
      prompt,
      maxRetries: 0,
    });

    const wordCount = object.body.trim().split(/\s+/).length;

    const { data, error } = await supabase
      .from("stories")
      .insert({
        user_id: userId,
        title: object.title,
        body: object.body,
        cefr_level: cefrLevel,
        topics: interestTopics,
        word_count: wordCount,
        quiz: object.quiz,
        sentence_translations: null,
        word_translations: null,
        is_queued: true,
      })
      .select("id")
      .single();

    if (error || !data) {
      console.error("[story-queue] DB insert failed:", error?.message);
      return;
    }

    storyId = data.id as string;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[story-queue] Story generation failed:", msg);
    return;
  }

  // ── Pre-generate translations (non-fatal) ─────────────────────────────────
  if (!storyId) return;

  try {
    const { data: saved } = await supabase
      .from("stories")
      .select("body")
      .eq("id", storyId)
      .single<{ body: string }>();

    if (!saved) return;

    const sentences = allSentences(saved.body);
    const words = extractContentWords(saved.body);
    const langName = language === "es" ? "Spanish" : "French";

    const translationPrompt = `You are a professional ${langName}-to-English translator.

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
- Word meanings must be 1-3 words, lowercase.

Sentences to translate (in order):
${sentences.map((s, i) => `${i + 1}. ${s}`).join("\n")}

Words to translate:
${words.join(", ")}`;

    const { text: raw } = await generateText({
      model: google("gemini-2.5-flash-lite"),
      prompt: translationPrompt,
      maxOutputTokens: 8192,
    });

    const cleaned = raw
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/\s*```\s*$/i, "")
      .trim();

    const parsed = JSON.parse(cleaned) as {
      sentences: string[];
      words: Record<string, string>;
    };

    const sentenceTranslations =
      Array.isArray(parsed.sentences) &&
      parsed.sentences.length === sentences.length
        ? parsed.sentences
        : null;

    await supabase
      .from("stories")
      .update({
        sentence_translations: sentenceTranslations,
        word_translations:
          parsed.words && typeof parsed.words === "object"
            ? parsed.words
            : null,
      })
      .eq("id", storyId);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[story-queue] Translation pre-generation failed:", msg);
  }
}
