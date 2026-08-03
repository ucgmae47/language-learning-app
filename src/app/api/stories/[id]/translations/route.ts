import { NextResponse } from "next/server";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { generateText } from "ai";
import { createClient } from "@/lib/supabase/server";
import { extractContentWords } from "@/lib/stories/utils";
import type { Language } from "@/lib/supabase/types";

type Params = { params: Promise<{ id: string }> };

type StoryTranslationRow = {
  body: string;
  language: Language | null;
  user_id: string | null;
  is_library: boolean;
  sentence_translations: string[] | null;
  word_translations: Record<string, string> | null;
};

/** GET /api/stories/[id]/translations — fetch sentence + word translations for the reader */
export async function GET(_request: Request, { params }: Params) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // RLS allows own stories or shared library rows.
  const { data: story, error } = await supabase
    .from("stories")
    .select("sentence_translations, word_translations, user_id, is_library")
    .eq("id", id)
    .single<Pick<StoryTranslationRow, "sentence_translations" | "word_translations" | "user_id" | "is_library">>();

  if (error || !story) {
    return NextResponse.json({ error: "Story not found" }, { status: 404 });
  }
  if (!story.is_library && story.user_id !== user.id) {
    return NextResponse.json({ error: "Story not found" }, { status: 404 });
  }

  return NextResponse.json({
    sentences: story.sentence_translations ?? null,
    words: story.word_translations ?? null,
  });
}

/**
 * POST /api/stories/[id]/translations
 *
 * Fills in any missing word translations (including short words like articles)
 * and merges them into the existing map without regenerating sentences.
 */
export async function POST(_request: Request, { params }: Params) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: story, error } = await supabase
    .from("stories")
    .select("body, language, sentence_translations, word_translations, user_id, is_library")
    .eq("id", id)
    .single<StoryTranslationRow>();

  if (error || !story) {
    return NextResponse.json({ error: "Story not found" }, { status: 404 });
  }
  // Library stories are fully pre-translated — never spend AI filling glosses.
  if (story.is_library) {
    return NextResponse.json({
      sentences: story.sentence_translations ?? null,
      words: story.word_translations ?? {},
    });
  }
  if (story.user_id !== user.id) {
    return NextResponse.json({ error: "Story not found" }, { status: 404 });
  }

  const existingWords = story.word_translations ?? {};
  const allWords = extractContentWords(story.body);
  const missing = allWords.filter((w) => !existingWords[w]);

  if (missing.length === 0) {
    return NextResponse.json({
      sentences: story.sentence_translations ?? null,
      words: existingWords,
      updated: false,
    });
  }

  const language: Language = story.language ?? "es";
  const langName = language === "es" ? "Spanish" : "French";

  const google = createGoogleGenerativeAI({
    apiKey: process.env.GEMINI_API_KEY ?? "",
  });

  try {
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
- Include EVERY word listed below, including short words and articles (el, la, un, a, y, de, etc.).
- "words" keys must be lowercase with no punctuation, matching the list exactly.
- Word meanings must be 1-3 words, lowercase.

Words to translate:
${missing.join(", ")}`;

    const { text: raw } = await generateText({
      model: google("gemini-2.5-flash-lite"),
      prompt,
      maxOutputTokens: 4096,
      maxRetries: 0,
    });

    const cleaned = raw
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/\s*```\s*$/i, "")
      .trim();

    const parsed = JSON.parse(cleaned) as { words?: Record<string, string> };
    const filled =
      parsed.words && typeof parsed.words === "object" ? parsed.words : {};

    const merged = { ...existingWords, ...filled };

    const { error: updateError } = await supabase
      .from("stories")
      .update({ word_translations: merged })
      .eq("id", id)
      .eq("user_id", user.id);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({
      sentences: story.sentence_translations ?? null,
      words: merged,
      updated: true,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[stories/${id}/translations] Word fill failed:`, message);
    return NextResponse.json(
      { error: "Failed to fill missing word translations." },
      { status: 500 },
    );
  }
}
