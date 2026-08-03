"use server";

import { createClient } from "@/lib/supabase/server";
import {
  addDays,
  pickDailyCardIds,
  resolveIdioms,
  todayDateString,
} from "@/lib/flashcards/daily";
import type { Idiom } from "@/lib/flashcards/types";
import type {
  IdiomDailyLesson,
  IdiomLessonStatus,
  Language,
} from "@/lib/supabase/types";

export type DailyLessonPayload = {
  lesson: IdiomDailyLesson;
  cards: Idiom[];
};

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("language")
    .eq("id", user.id)
    .single();

  const language: Language = profile?.language ?? "es";
  return { supabase, user, language };
}

async function createLessonRow(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  language: Language,
  lessonDate: string,
  excludeIds: string[] = [],
): Promise<IdiomDailyLesson | null> {
  const cardIds = pickDailyCardIds(language, userId, lessonDate, excludeIds);

  const { data, error } = await supabase
    .from("idiom_daily_lessons")
    .insert({
      user_id: userId,
      language,
      lesson_date: lessonDate,
      card_ids: cardIds,
    })
    .select("*")
    .single();

  if (error) {
    // Race: another request created today's row
    if (error.code === "23505") {
      const { data: existing } = await supabase
        .from("idiom_daily_lessons")
        .select("*")
        .eq("user_id", userId)
        .eq("language", language)
        .eq("lesson_date", lessonDate)
        .maybeSingle();
      return existing;
    }
    console.error("[flashcards] createLessonRow:", error.message);
    return null;
  }

  return data;
}

/** Load today's lesson (create if missing). Resumes in-progress progress. */
export async function getOrCreateTodayLesson(): Promise<
  DailyLessonPayload | { error: string }
> {
  const ctx = await requireUser();
  if (!ctx) return { error: "Not authenticated" };
  const { supabase, user, language } = ctx;
  const today = todayDateString();

  const { data: existing, error } = await supabase
    .from("idiom_daily_lessons")
    .select("*")
    .eq("user_id", user.id)
    .eq("language", language)
    .eq("lesson_date", today)
    .maybeSingle();

  if (error) {
    console.error("[flashcards] getOrCreateTodayLesson:", error.message);
    return {
      error:
        "Flashcard lessons aren't set up yet. Run the idiom_daily_lessons migration in Supabase.",
    };
  }

  let lesson = existing;

  if (!lesson) {
    // Prefer excluding yesterday's cards so nights feel fresh
    const yesterday = addDays(today, -1);
    const { data: prev } = await supabase
      .from("idiom_daily_lessons")
      .select("card_ids")
      .eq("user_id", user.id)
      .eq("language", language)
      .eq("lesson_date", yesterday)
      .maybeSingle();

    lesson = await createLessonRow(
      supabase,
      user.id,
      language,
      today,
      prev?.card_ids ?? [],
    );
  }

  if (!lesson) {
    return { error: "Couldn't start today's idiom lesson. Please try again." };
  }

  const cards = resolveIdioms(language, lesson.card_ids);
  if (cards.length === 0) {
    return { error: "Today's lesson has no cards." };
  }

  return { lesson, cards };
}

export async function saveLessonProgress(input: {
  lessonId: string;
  currentIdx: number;
  knownIds: string[];
  reviewIds: string[];
  status?: IdiomLessonStatus;
}): Promise<{ error?: string }> {
  const ctx = await requireUser();
  if (!ctx) return { error: "Not authenticated" };
  const { supabase, user } = ctx;

  const { error } = await supabase
    .from("idiom_daily_lessons")
    .update({
      current_idx: input.currentIdx,
      known_ids: input.knownIds,
      review_ids: input.reviewIds,
      updated_at: new Date().toISOString(),
      ...(input.status ? { status: input.status } : {}),
    })
    .eq("id", input.lessonId)
    .eq("user_id", user.id);

  if (error) {
    console.error("[flashcards] saveLessonProgress:", error.message);
    return { error: "Couldn't save progress." };
  }
  return {};
}

export async function completeLessonQuiz(input: {
  lessonId: string;
  answers: Record<string, string>;
  score: number;
}): Promise<{ error?: string }> {
  const ctx = await requireUser();
  if (!ctx) return { error: "Not authenticated" };
  const { supabase, user } = ctx;

  const { error } = await supabase
    .from("idiom_daily_lessons")
    .update({
      status: "completed",
      quiz_answers: input.answers,
      quiz_score: Math.max(0, Math.min(100, Math.round(input.score))),
      completed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", input.lessonId)
    .eq("user_id", user.id);

  if (error) {
    console.error("[flashcards] completeLessonQuiz:", error.message);
    return { error: "Couldn't save quiz results." };
  }
  return {};
}
