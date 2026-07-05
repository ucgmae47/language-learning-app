import { NextResponse } from "next/server";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { generateText } from "ai";
import { createClient } from "@/lib/supabase/server";
import { allSentences, extractContentWords } from "@/lib/stories/utils";
import type { Language } from "@/lib/supabase/types";

type StoryRow = {
  id: string;
  body: string;
};

// Matches Gemini per-minute rate limit AND daily quota exhaustion errors.
function classifyError(err: unknown): "rate_limit" | "quota" | "other" {
  const msg = (err instanceof Error ? err.message : String(err)).toLowerCase();
  if (/resource.?exhausted|daily.*quota|per.?day|quota.*exceeded/i.test(msg))
    return "quota";
  if (/quota|rate.?limit|429/i.test(msg)) return "rate_limit";
  return "other";
}

function delay(ms: number) {
  return new Promise<void>((r) => setTimeout(r, ms));
}

/**
 * POST /api/stories/backfill-translations
 *
 * Fetches up to 5 of the authenticated user's stories that are missing
 * translations and generates them via Gemini, one story at a time with a
 * 4-second gap between calls to stay inside the free-tier rate limit.
 *
 * Returns { processed, errors, total, errorKind, firstErrorMsg } so the
 * client can show the actual failure reason.
 */
export async function POST() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Fetch the user's active language from their profile.
  const { data: profile } = await supabase
    .from("profiles")
    .select("language")
    .eq("id", user.id)
    .single<{ language: Language }>();

  const language: Language = profile?.language ?? "es";
  const langName = language === "es" ? "Spanish" : "French";

  // Grab stories that are missing translations (not queued).
  // Reduced batch to 5 to lower the chance of hitting the per-minute limit.
  const { data: stories, error: fetchError } = await supabase
    .from("stories")
    .select("id, body")
    .eq("user_id", user.id)
    .eq("is_queued", false)
    .is("sentence_translations", null)
    .order("created_at", { ascending: false })
    .limit(5)
    .returns<StoryRow[]>();

  if (fetchError) {
    return NextResponse.json({ error: fetchError.message }, { status: 500 });
  }

  if (!stories || stories.length === 0) {
    return NextResponse.json({
      processed: 0,
      errors: 0,
      total: 0,
      message: "All stories already have translations.",
    });
  }

  const google = createGoogleGenerativeAI({
    apiKey: process.env.GEMINI_API_KEY ?? "",
  });

  let processed = 0;
  let errors = 0;
  let errorKind: "rate_limit" | "quota" | "other" | null = null;
  let firstErrorMsg: string | null = null;

  for (let i = 0; i < stories.length; i++) {
    const story = stories[i]!;

    // 4-second gap between calls (skip the very first call).
    if (i > 0) await delay(4000);

    try {
      const sentences = allSentences(story.body);
      const words = extractContentWords(story.body);

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
- Word meanings must be 1-3 words, lowercase.

Sentences to translate (in order):
${sentences.map((s, idx) => `${idx + 1}. ${s}`).join("\n")}

Words to translate:
${words.join(", ")}`;

      const { text: raw } = await generateText({
        model: google("gemini-2.5-flash-lite"),
        prompt,
        maxOutputTokens: 8192,
        maxRetries: 0,
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

      const wordTranslations =
        parsed.words && typeof parsed.words === "object" ? parsed.words : null;

      const { error: updateError } = await supabase
        .from("stories")
        .update({
          sentence_translations: sentenceTranslations,
          word_translations: wordTranslations,
        })
        .eq("id", story.id);

      if (updateError) {
        console.error(
          `[backfill] DB update failed for ${story.id}:`,
          updateError.message,
        );
        errors++;
        if (!firstErrorMsg) {
          errorKind = "other";
          firstErrorMsg = `DB error: ${updateError.message}`;
        }
      } else {
        processed++;
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`[backfill] Translation failed for ${story.id}:`, msg);
      errors++;
      if (!firstErrorMsg) {
        errorKind = classifyError(err);
        // Surface the first ~120 chars of the real error to the client.
        firstErrorMsg = msg.slice(0, 120);
      }
      // Stop immediately on quota exhaustion — retrying won't help today.
      if (errorKind === "quota") break;
    }
  }

  return NextResponse.json({
    processed,
    errors,
    total: stories.length,
    errorKind,
    firstErrorMsg,
  });
}
