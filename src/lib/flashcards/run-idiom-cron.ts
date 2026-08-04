/**
 * Nightly idiom-deck precreation for users who completed today's lesson.
 */

import { createServiceClient } from "@/lib/supabase/service";
import {
  addDays,
  pickDailyCardIds,
  todayDateString,
} from "@/lib/flashcards/daily";
import type { Language } from "@/lib/supabase/types";

export type IdiomCronResult = {
  date: string;
  tomorrow: string;
  completers: number;
  created: number;
  skipped: number;
};

export async function runIdiomDeckCron(): Promise<IdiomCronResult> {
  const today = todayDateString();
  const tomorrow = addDays(today, 1);
  const supabase = createServiceClient();

  const { data: completers, error } = await supabase
    .from("idiom_daily_lessons")
    .select("user_id, language, card_ids")
    .eq("lesson_date", today)
    .eq("status", "completed");

  if (error) {
    throw new Error(error.message);
  }

  let created = 0;
  let skipped = 0;

  for (const row of completers ?? []) {
    const language = row.language as Language;

    const { data: existing } = await supabase
      .from("idiom_daily_lessons")
      .select("id")
      .eq("user_id", row.user_id)
      .eq("language", language)
      .eq("lesson_date", tomorrow)
      .maybeSingle();

    if (existing) {
      skipped++;
      continue;
    }

    const cardIds = pickDailyCardIds(
      language,
      row.user_id,
      tomorrow,
      row.card_ids ?? [],
    );

    const { error: insertError } = await supabase
      .from("idiom_daily_lessons")
      .insert({
        user_id: row.user_id,
        language,
        lesson_date: tomorrow,
        card_ids: cardIds,
      });

    if (insertError) {
      console.warn(
        `[idiom-cron] insert failed for ${row.user_id}/${language}:`,
        insertError.message,
      );
      continue;
    }
    created++;
  }

  return {
    date: today,
    tomorrow,
    completers: completers?.length ?? 0,
    created,
    skipped,
  };
}
