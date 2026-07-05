import { NextResponse } from "next/server";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { generateObject, generateText } from "ai";
import { createClient } from "@/lib/supabase/server";
import { buildStoryPrompt } from "@/lib/stories/prompt";
import { GeneratedStorySchema } from "@/lib/stories/schema";
import { allSentences, extractContentWords } from "@/lib/stories/utils";
import { updateGenreInterest } from "@/app/actions/interests";
import type { GeneratedStory } from "@/lib/stories/schema";
import type { CefrLevel, InterestTopic, Language } from "@/lib/supabase/types";

export async function POST(request: Request) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Read the optional topic chosen by the user in the UI.
  let selectedTopic: string | null = null;
  try {
    const body = (await request.json()) as { topic?: string | null };
    selectedTopic = body.topic ?? null;
  } catch {
    // Body may be empty — that's fine.
  }

  const [profileResult, interestsResult, genreResult] = await Promise.all([
    supabase
      .from("profiles")
      .select("cefr_level, language")
      .eq("id", user.id)
      .single(),
    supabase
      .from("user_interests")
      .select("topic")
      .eq("user_id", user.id)
      .order("weight", { ascending: false })
      .limit(3),
    supabase
      .from("genre_interests")
      .select("genre")
      .eq("user_id", user.id)
      .order("weight", { ascending: false })
      .limit(2),
  ]);

  const cefrLevel: CefrLevel = profileResult.data?.cefr_level ?? "B1";
  const language: Language = profileResult.data?.language ?? "es";
  const topics: string[] =
    interestsResult.data?.map((r: { topic: InterestTopic }) => r.topic) ?? [];
  const topGenres: string[] =
    (genreResult.data ?? []).map((r: { genre: string }) => r.genre);

  const prompt = buildStoryPrompt(cefrLevel, topics, selectedTopic ?? undefined, language, topGenres);

  const google = createGoogleGenerativeAI({
    apiKey: process.env.GEMINI_API_KEY ?? "",
  });

  // ── Helpers ─────────────────────────────────────────────────────────────────

  function isRateLimitError(err: unknown): boolean {
    const msg = err instanceof Error ? err.message : String(err);
    return /quota|rate.?limit|resource.?exhausted|429/i.test(msg);
  }

  function delay(ms: number) {
    return new Promise<void>((r) => setTimeout(r, ms));
  }

  // ── Step 1: Generate the story (up to 2 attempts, 5 s gap on rate limit) ───

  let object: GeneratedStory | null = null;
  let storyError: { message: string; isRateLimit: boolean } | null = null;

  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const result = await generateObject({
        model: google("gemini-2.5-flash-lite"),
        schema: GeneratedStorySchema,
        prompt,
        maxRetries: 0, // we handle retries ourselves
      });
      object = result.object;
      break;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      const isRateLimit = isRateLimitError(err);
      storyError = { message, isRateLimit };
      if (isRateLimit && attempt === 0) {
        await delay(5000); // wait 5 s before the second attempt
        continue;
      }
      break;
    }
  }

  if (!object) {
    const { isRateLimit, message } = storyError ?? { isRateLimit: false, message: "Unknown error" };
    console.error("[stories/generate] Story generation failed:", message);
    return NextResponse.json(
      {
        error: isRateLimit
          ? "AI rate limit reached. Please wait about a minute and try again."
          : "Story generation failed. Please try again.",
      },
      { status: isRateLimit ? 429 : 500 },
    );
  }

  const wordCount = object.body.trim().split(/\s+/).length;

  // ── Step 2: Save the story ──────────────────────────────────────────────────

  const { data: story, error: insertError } = await supabase
    .from("stories")
    .insert({
      user_id: user.id,
      title: object.title,
      body: object.body,
      cefr_level: cefrLevel,
      topics,
      word_count: wordCount,
      quiz: object.quiz,
      // Translations are populated below after the batch Gemini call.
      sentence_translations: null,
      word_translations: null,
    })
    .select("id")
    .single();

  if (insertError || !story) {
    console.error("[stories/generate] DB insert failed:", insertError?.message);
    return NextResponse.json(
      { error: "Failed to save story." },
      { status: 500 },
    );
  }

  // ── Step 2b: Record genre interest signal (+3 for explicit genre selection) ─
  if (selectedTopic) {
    void updateGenreInterest(selectedTopic, 3, language);
  }

  // ── Step 3: Pre-generate translations ──────────────────────────────────────
  // One Gemini call translates all sentences (as an ordered array) and all
  // content words. Stored on the story so the reader is instant — no hover lag.

  try {
    const sentences = allSentences(object.body);
    const words = extractContentWords(object.body);
    const langName = language === "es" ? "Spanish" : "French";

    const translationPrompt = `You are a professional ${langName}-to-English translator.

Return ONLY a valid JSON object — no markdown fences, no extra text, nothing else.

The JSON must have exactly this structure:
{
  "sentences": ["English translation of sentence 1", "English translation of sentence 2", ...],
  "words": {
    "word1": "1-3 word meaning",
    "word2": "1-3 word meaning",
    ...
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

    // Strip any accidental markdown code fences.
    const cleaned = raw
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/\s*```\s*$/i, "")
      .trim();

    const parsed = JSON.parse(cleaned) as {
      sentences: string[];
      words: Record<string, string>;
    };

    // Validate the sentence array length matches.
    const sentenceTranslations =
      Array.isArray(parsed.sentences) && parsed.sentences.length === sentences.length
        ? parsed.sentences
        : null;

    await supabase
      .from("stories")
      .update({
        sentence_translations: sentenceTranslations,
        word_translations:
          parsed.words && typeof parsed.words === "object" ? parsed.words : null,
      })
      .eq("id", story.id);
  } catch (err) {
    // Non-fatal: story is saved and readable; translations just won't be interactive.
    const message = err instanceof Error ? err.message : String(err);
    console.error("[stories/generate] Translation batch failed:", message);
  }

  return NextResponse.json({ storyId: story.id });
}
