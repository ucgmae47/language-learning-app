/**
 * Background story pre-generation.
 *
 * This module is called exclusively from `after()` callbacks (i.e. AFTER the
 * HTTP response has already been sent to the user).  It MUST use the service-
 * role Supabase client because request cookies are no longer available at that
 * point.
 *
 * A queued story is only left visible (`is_queued = true` with translations)
 * when both the story and its translations succeed. Incomplete rows are deleted.
 */

import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { generateObject } from "ai";
import { createServiceClient } from "@/lib/supabase/service";
import { buildStoryPrompt } from "@/lib/stories/prompt";
import { GeneratedStorySchema } from "@/lib/stories/schema";
import { buildPersonalizedTopics } from "@/lib/stories/recommendation";
import { withAiRetries } from "@/lib/stories/retry";
import { generateStoryTranslations } from "@/lib/stories/translations";
import type { CefrLevel, Language } from "@/lib/supabase/types";

/**
 * Silently generates and stores a personalised story with `is_queued = true`
 * for the given user.  Does nothing if the user already has a fully-ready
 * queued story (unless `force` is true — then the old queued story is replaced).
 *
 * A queued story without translations counts as "still preparing" and will be
 * replaced / finished rather than blocking forever.
 */
export async function generateQueuedStory(
  userId: string,
  language: Language,
  cefrLevel: CefrLevel,
  options: { force?: boolean } = {},
): Promise<void> {
  const supabase = createServiceClient();

  const STUCK_AFTER_MS = 5 * 60 * 1000;

  if (options.force) {
    await supabase
      .from("stories")
      .delete()
      .eq("user_id", userId)
      .eq("language", language)
      .eq("is_queued", true);
  } else {
    // Ready queued story already waiting — nothing to do.
    const { data: ready } = await supabase
      .from("stories")
      .select("id")
      .eq("user_id", userId)
      .eq("language", language)
      .eq("is_queued", true)
      .not("sentence_translations", "is", null)
      .limit(1);

    if (ready && ready.length > 0) return;

    // A preparing row means generation is in flight — or translations failed
    // after the story body was saved. Try to finish translations quietly.
    const { data: preparing } = await supabase
      .from("stories")
      .select("id, body, created_at")
      .eq("user_id", userId)
      .eq("language", language)
      .eq("is_queued", true)
      .is("sentence_translations", null)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle<{ id: string; body: string; created_at: string }>();

    if (preparing) {
      const ageMs = Date.now() - new Date(preparing.created_at).getTime();
      // Very fresh row: another worker is likely still generating translations.
      if (ageMs < 45_000) return;

      try {
        const translations = await generateStoryTranslations(
          preparing.body,
          language,
          "story-queue/finish-translations",
        );
        const { error: updateError } = await supabase
          .from("stories")
          .update({
            sentence_translations: translations.sentences,
            word_translations: translations.words,
          })
          .eq("id", preparing.id);

        if (!updateError) return;
        console.error(
          "[story-queue] Failed to finish translations:",
          updateError.message,
        );
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error("[story-queue] Finish-translations failed:", msg);
      }

      // Only replace if clearly stuck so we don't thrash active work.
      if (ageMs < STUCK_AFTER_MS) return;
      await supabase.from("stories").delete().eq("id", preparing.id);
    }
  }

  // ── Build personalised topics ──────────────────────────────────────────────
  const { primaryGenre, secondaryGenre, interestTopics } =
    await buildPersonalizedTopics(supabase, userId, language);

  const topGenres = secondaryGenre
    ? [primaryGenre, secondaryGenre]
    : [primaryGenre];

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

  let storyId: string | null = null;

  try {
    const object = await withAiRetries(
      async () => {
        const { object: generated } = await generateObject({
          model: google("gemini-2.5-flash-lite"),
          schema: GeneratedStorySchema,
          prompt,
          maxRetries: 0,
        });
        return generated;
      },
      { attempts: 5, label: "story-queue" },
    );

    const wordCount = object.body.trim().split(/\s+/).length;

    // Insert as preparing (queued, no translations yet). UI shows a spinner
    // for this state and never offers "Read now" until translations land.
    const { data, error } = await supabase
      .from("stories")
      .insert({
        user_id: userId,
        title: object.title,
        body: object.body,
        cefr_level: cefrLevel,
        language,
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

    const translations = await generateStoryTranslations(
      object.body,
      language,
      "story-queue/translations",
    );

    const { error: updateError } = await supabase
      .from("stories")
      .update({
        sentence_translations: translations.sentences,
        word_translations: translations.words,
      })
      .eq("id", storyId);

    if (updateError) {
      throw new Error(updateError.message);
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[story-queue] Generation failed:", msg);
    if (storyId) {
      // Never leave an incomplete story visible/accessible.
      await supabase.from("stories").delete().eq("id", storyId);
    }
  }
}
