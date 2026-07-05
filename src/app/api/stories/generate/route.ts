import { after } from "next/server";
import { NextResponse } from "next/server";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { generateObject, generateText } from "ai";
import { createClient } from "@/lib/supabase/server";
import { buildStoryPrompt } from "@/lib/stories/prompt";
import { GeneratedStorySchema } from "@/lib/stories/schema";
import { allSentences, extractContentWords } from "@/lib/stories/utils";
import { generateQueuedStory } from "@/lib/stories/queue";
import { insertEvent } from "@/lib/events/log-event";
import { normalizeStoryGenre, WEIGHTS } from "@/lib/events/taxonomy";
import { aggregateTopicScores } from "@/lib/events/aggregate";
import { getUserContext } from "@/lib/user-context";
import type { GeneratedStory } from "@/lib/stories/schema";
import type { CefrLevel, Language } from "@/lib/supabase/types";

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

  // Fetch profile first (we need language/level to call getUserContext).
  const profileResult = await supabase
    .from("profiles")
    .select("display_name, cefr_level, language")
    .eq("id", user.id)
    .single();

  const cefrLevel: CefrLevel = profileResult.data?.cefr_level ?? "B1";
  const language: Language = profileResult.data?.language ?? "es";
  const displayName: string =
    profileResult.data?.display_name ??
    user.user_metadata?.display_name ??
    "Learner";

  // Assemble the full cross-app learner context (interests, music, recent topics).
  const userCtx = await getUserContext(
    supabase,
    user.id,
    language,
    cefrLevel,
    displayName,
  );

  const topics = userCtx.explicitInterests;
  const topGenres = userCtx.topBehavioralGenres.slice(0, 2);

  // ── Fast-path: serve a pre-queued story when no explicit topic is chosen ──
  // The queued story was silently pre-generated and personalised by the
  // recommendation engine.  Serving it is instant — no AI call needed.
  if (!selectedTopic) {
    const { data: queued } = await supabase
      .from("stories")
      .select("id")
      .eq("user_id", user.id)
      .eq("is_queued", true)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle<{ id: string }>();

    if (queued) {
      // Mark as consumed so it appears in the story list.
      await supabase
        .from("stories")
        .update({ is_queued: false })
        .eq("id", queued.id);

      // After the response is sent, silently generate the next queued story.
      after(async () => {
        await generateQueuedStory(user.id, language, cefrLevel);
      });

      return NextResponse.json({ storyId: queued.id, fromQueue: true });
    }
  }

  // ── No queued story (or explicit topic requested) — generate now ───────────
  const prompt = buildStoryPrompt(
    cefrLevel,
    topics,
    selectedTopic ?? undefined,
    language,
    topGenres,
    userCtx.contextString,
  );

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
    const { isRateLimit, message } = storyError ?? {
      isRateLimit: false,
      message: "Unknown error",
    };
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
      sentence_translations: null,
      word_translations: null,
      is_queued: false,
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

  // ── Step 2b: Log story_open event via behavioral engine ─────────────────────
  // Log one event per topic in the story. For an explicit genre selection the
  // weight is bumped to STORY_OPENED × 2 (strong explicit signal).
  const storyTopicsForLog = topics;
  for (const genre of storyTopicsForLog) {
    const canonical = normalizeStoryGenre(genre);
    if (!canonical) continue;
    const w = selectedTopic ? WEIGHTS.STORY_OPENED * 2 : WEIGHTS.STORY_OPENED;
    void insertEvent(supabase, user.id, {
      language,
      source: "story",
      event_type: "story_open",
      topic: canonical,
      raw_topic: genre,
      weight: w,
    });
  }
  after(async () => {
    await aggregateTopicScores(user.id, language);
  });

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
      .eq("id", story.id);
  } catch (err) {
    // Non-fatal: story is saved and readable; translations just won't be interactive.
    const message = err instanceof Error ? err.message : String(err);
    console.error("[stories/generate] Translation batch failed:", message);
  }

  // ── Step 4: Silently pre-generate the next queued story ─────────────────────
  // Runs AFTER the response is sent — zero impact on this request's latency.
  after(async () => {
    await generateQueuedStory(user.id, language, cefrLevel);
  });

  return NextResponse.json({ storyId: story.id });
}
