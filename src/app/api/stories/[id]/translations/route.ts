import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  applyFunctionWordGlosses,
  ensureCompleteWordTranslations,
  missingWordTranslations,
} from "@/lib/stories/complete-word-translations";
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
 *
 * Library stories: apply free closed-class glosses only (no Gemini spend).
 * Personal stories: closed-class glosses + Gemini fill for anything left.
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
  if (!story.is_library && story.user_id !== user.id) {
    return NextResponse.json({ error: "Story not found" }, { status: 404 });
  }

  const language: Language = story.language ?? "es";
  const existingWords = story.word_translations ?? {};

  // Shared library: never call Gemini from the reader path (cost gate).
  // Closed-class glosses are free and fix the most common seed gaps.
  if (story.is_library) {
    const merged = applyFunctionWordGlosses(
      story.body,
      existingWords,
      language,
    );
    const changed =
      Object.keys(merged).length !== Object.keys(existingWords).length ||
      missingWordTranslations(story.body, existingWords).length >
        missingWordTranslations(story.body, merged).length;

    if (changed) {
      const { error: updateError } = await supabase
        .from("stories")
        .update({ word_translations: merged })
        .eq("id", id)
        .eq("is_library", true);

      if (updateError) {
        // Still return the merged map even if persistence fails.
        console.error(
          `[stories/${id}/translations] Library gloss persist failed:`,
          updateError.message,
        );
      }
    }

    return NextResponse.json({
      sentences: story.sentence_translations ?? null,
      words: merged,
      updated: changed,
    });
  }

  if (missingWordTranslations(story.body, existingWords).length === 0) {
    return NextResponse.json({
      sentences: story.sentence_translations ?? null,
      words: existingWords,
      updated: false,
    });
  }

  try {
    const { words: merged } = await ensureCompleteWordTranslations(
      story.body,
      existingWords,
      language,
      { label: `stories/${id}/translations` },
    );

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
