import { after } from "next/server";
import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { generateObject } from "ai";
import { createClient } from "@/lib/supabase/server";
import { buildStoryPrompt } from "@/lib/stories/prompt";
import { GeneratedStorySchema } from "@/lib/stories/schema";
import { generateQueuedStory } from "@/lib/stories/queue";
import { generateStoryTranslations } from "@/lib/stories/translations";
import {
  FRIENDLY_STORY_BUSY_ERROR,
  FRIENDLY_STORY_FAILED_ERROR,
  isTransientAiError,
  withAiRetries,
} from "@/lib/stories/retry";
import { insertEvent } from "@/lib/events/log-event";
import { normalizeStoryGenre, WEIGHTS } from "@/lib/events/taxonomy";
import { aggregateTopicScores } from "@/lib/events/aggregate";
import { getUserContext } from "@/lib/user-context";
import { isPersonalStoryQueueEnabled } from "@/lib/stories/personal-queue-enabled";
import type { GeneratedStory } from "@/lib/stories/schema";
import type { CefrLevel, Language } from "@/lib/supabase/types";

/** Allow enough time for internal retries + backoff under Gemini load. */
export const maxDuration = 60;

export async function POST(request: Request) {
  if (!isPersonalStoryQueueEnabled()) {
    return NextResponse.json(
      {
        error:
          "Personalized story generation is disabled. Browse the free Story Library instead.",
        code: "personal_stories_disabled",
      },
      { status: 403 },
    );
  }

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

  // ── Fast-path: serve a fully-ready pre-queued story (must have translations)
  if (!selectedTopic) {
    const { data: queued } = await supabase
      .from("stories")
      .select("id")
      .eq("user_id", user.id)
      .eq("language", language)
      .eq("is_queued", true)
      .not("sentence_translations", "is", null)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle<{ id: string }>();

    if (queued) {
      // Mark as consumed so it appears in the story list.
      await supabase
        .from("stories")
        .update({ is_queued: false })
        .eq("id", queued.id);

      revalidatePath("/stories");

      // After the response is sent, silently generate the next queued story.
      after(async () => {
        await generateQueuedStory(user.id, language, cefrLevel);
        revalidatePath("/stories");
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

  // ── Step 1: Generate the story (retries + backoff stay on the server) ──────

  let object: GeneratedStory;

  try {
    object = await withAiRetries(
      async () => {
        const result = await generateObject({
          model: google("gemini-2.5-flash-lite"),
          schema: GeneratedStorySchema,
          prompt,
          maxRetries: 0, // we handle retries ourselves
        });
        return result.object;
      },
      { attempts: 5, label: "stories/generate" },
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    const busy = isTransientAiError(err);
    console.error("[stories/generate] Story generation failed:", message);
    return NextResponse.json(
      {
        error: busy ? FRIENDLY_STORY_BUSY_ERROR : FRIENDLY_STORY_FAILED_ERROR,
        isBusy: busy,
      },
      { status: busy ? 503 : 500 },
    );
  }

  const wordCount = object.body.trim().split(/\s+/).length;

  // ── Step 2: Translations must succeed before the story becomes accessible ─
  let translations;
  try {
    translations = await generateStoryTranslations(
      object.body,
      language,
      "stories/translations",
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    const busy = isTransientAiError(err);
    console.error("[stories/generate] Translation failed:", message);
    return NextResponse.json(
      {
        error: busy ? FRIENDLY_STORY_BUSY_ERROR : FRIENDLY_STORY_FAILED_ERROR,
        isBusy: busy,
      },
      { status: busy ? 503 : 500 },
    );
  }

  // ── Step 3: Save the fully-ready story ────────────────────────────────────

  const { data: story, error: insertError } = await supabase
    .from("stories")
    .insert({
      user_id: user.id,
      title: object.title,
      body: object.body,
      cefr_level: cefrLevel,
      language,
      topics,
      word_count: wordCount,
      quiz: object.quiz,
      sentence_translations: translations.sentences,
      word_translations: translations.words,
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

  // ── Step 3b: Log story_open event via behavioral engine ───────────────────
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

  // ── Step 4: Silently pre-generate the next queued story ───────────────────
  after(async () => {
    await generateQueuedStory(user.id, language, cefrLevel);
    revalidatePath("/stories");
  });

  return NextResponse.json({ storyId: story.id });
}
