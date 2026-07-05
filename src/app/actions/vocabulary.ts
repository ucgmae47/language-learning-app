"use server";

import { after } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { applySM2 } from "@/lib/srs";
import { insertEvent } from "@/lib/events/log-event";
import { WEIGHTS } from "@/lib/events/taxonomy";
import { aggregateTopicScores } from "@/lib/events/aggregate";
import type { SrsGrade } from "@/lib/srs";
import type { Language } from "@/lib/supabase/types";

type VocabularyCard = {
  id: string;
  user_id: string;
  language: string;
  word: string;
  translation: string;
  context: string | null;
  source: string;
  ease_factor: number;
  interval_days: number;
  repetitions: number;
  due_date: string;
  created_at: string;
};

type VocabStats = {
  total: number;
  due: number;
  mastered: number;
};

async function getUserAndLanguage() {
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

export async function saveWord(
  word: string,
  translation: string,
  context: string | null,
  source: string,
): Promise<{ error?: string }> {
  const ctx = await getUserAndLanguage();
  if (!ctx) return { error: "Not authenticated" };
  const { supabase, user, language } = ctx;

  const today = new Date().toISOString().slice(0, 10);

  const { error } = await supabase.from("vocabulary_cards").upsert(
    {
      user_id: user.id,
      language,
      word,
      translation,
      context: context ?? null,
      source,
      due_date: today,
      ease_factor: 2.5,
      interval_days: 1,
      repetitions: 0,
    },
    // ignoreDuplicates=true so existing SRS progress is never overwritten
    { onConflict: "user_id,language,word", ignoreDuplicates: true },
  );

  if (error) return { error: error.message };

  // Log vocabulary save as a language_education signal
  void insertEvent(supabase, user.id, {
    language,
    source: "vocabulary",
    event_type: "word_saved",
    topic: "language_education",
    raw_topic: source,
    weight: WEIGHTS.VOCAB_WORD_SAVED,
  });

  const userId = user.id;
  after(async () => {
    await aggregateTopicScores(userId, language);
  });

  return {};
}

export async function getDueCards(limit = 20): Promise<VocabularyCard[]> {
  const ctx = await getUserAndLanguage();
  if (!ctx) return [];
  const { supabase, user, language } = ctx;

  const today = new Date().toISOString().slice(0, 10);

  const { data } = await supabase
    .from("vocabulary_cards")
    .select("*")
    .eq("user_id", user.id)
    .eq("language", language)
    .lte("due_date", today)
    .order("due_date", { ascending: true })
    .limit(limit)
    .returns<VocabularyCard[]>();

  return data ?? [];
}

export async function recordReview(
  cardId: string,
  grade: SrsGrade,
): Promise<{ error?: string }> {
  const ctx = await getUserAndLanguage();
  if (!ctx) return { error: "Not authenticated" };
  const { supabase, user } = ctx;

  const { data: card, error: fetchError } = await supabase
    .from("vocabulary_cards")
    .select("ease_factor, interval_days, repetitions")
    .eq("id", cardId)
    .eq("user_id", user.id)
    .single<Pick<VocabularyCard, "ease_factor" | "interval_days" | "repetitions">>();

  if (fetchError || !card) return { error: fetchError?.message ?? "Card not found" };

  const result = applySM2(card, grade);

  const { error } = await supabase
    .from("vocabulary_cards")
    .update({
      ease_factor: result.ease_factor,
      interval_days: result.interval_days,
      repetitions: result.repetitions,
      due_date: result.due_date,
    })
    .eq("id", cardId)
    .eq("user_id", user.id);

  if (error) return { error: error.message };
  return {};
}

export async function getVocabStats(): Promise<VocabStats> {
  const ctx = await getUserAndLanguage();
  if (!ctx) return { total: 0, due: 0, mastered: 0 };
  const { supabase, user, language } = ctx;

  const today = new Date().toISOString().slice(0, 10);

  const { data } = await supabase
    .from("vocabulary_cards")
    .select("due_date, interval_days")
    .eq("user_id", user.id)
    .eq("language", language)
    .returns<{ due_date: string; interval_days: number }[]>();

  const cards = data ?? [];
  const total = cards.length;
  const due = cards.filter((c) => c.due_date <= today).length;
  const mastered = cards.filter((c) => c.interval_days >= 21).length;

  return { total, due, mastered };
}

export async function getAllCards(): Promise<VocabularyCard[]> {
  const ctx = await getUserAndLanguage();
  if (!ctx) return [];
  const { supabase, user, language } = ctx;

  const { data } = await supabase
    .from("vocabulary_cards")
    .select("*")
    .eq("user_id", user.id)
    .eq("language", language)
    .order("created_at", { ascending: false })
    .returns<VocabularyCard[]>();

  return data ?? [];
}
