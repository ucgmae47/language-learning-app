import { NextResponse } from "next/server";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { generateText } from "ai";
import { createClient } from "@/lib/supabase/server";
import { allSentences, extractContentWords } from "@/lib/stories/utils";
import type { CefrLevel, Language } from "@/lib/supabase/types";

type StoryRow = {
  id: string;
  body: string;
  cefr_level: CefrLevel;
  language: Language;
};

function delay(ms: number) {
  return new Promise<void>((r) => setTimeout(r, ms));
}

/**
 * POST /api/stories/backfill-translations
 *
 * Fetches up to 10 of the authenticated user's stories that are missing
 * translations and generates them via Gemini, one story at a time with a
 * 3-second gap between calls to stay inside the free-tier rate limit.
 *
 * Returns { processed, skipped, errors } so the client can show progress.
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
  const { data: stories, error: fetchError } = await supabase
    .from("stories")
    .select("id, body, cefr_level, language")
    .eq("user_id", user.id)
    .eq("is_queued", false)
    .is("sentence_translations", null)
    .order("created_at", { ascending: false })
    .limit(10)
    .returns<StoryRow[]>();

  if (fetchError) {
    return NextResponse.json({ error: fetchError.message }, { status: 500 });
  }

  if (!stories || stories.length === 0) {
    return NextResponse.json({ processed: 0, skipped: 0, errors: 0, message: "All stories already have translations." });
  }

  const google = createGoogleGenerativeAI({
    apiKey: process.env.GEMINI_API_KEY ?? "",
  });

  let processed = 0;
  let errors = 0;

  for (let i = 0; i < stories.length; i++) {
    const story = stories[i]!;

    // Pause between calls (skip the delay on the very first story).
    if (i > 0) await delay(3500);

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
        console.error(`[backfill] Update failed for story ${story.id}:`, updateError.message);
        errors++;
      } else {
        processed++;
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`[backfill] Translation failed for story ${story.id}:`, msg);
      errors++;
    }
  }

  return NextResponse.json({ processed, skipped: 0, errors, total: stories.length });
}
