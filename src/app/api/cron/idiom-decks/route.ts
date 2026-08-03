import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import {
  addDays,
  pickDailyCardIds,
  todayDateString,
} from "@/lib/flashcards/daily";
import type { Language } from "@/lib/supabase/types";

/**
 * GET /api/cron/idiom-decks
 *
 * Nightly job: for users who completed today's idiom lesson, pre-create
 * tomorrow's deck so the next visit needs no generation work.
 * Protected by CRON_SECRET (same pattern as wotd-email).
 */
export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  const expected = `Bearer ${process.env.CRON_SECRET}`;

  if (!process.env.CRON_SECRET || authHeader !== expected) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const today = todayDateString();
  const tomorrow = addDays(today, 1);
  const supabase = createServiceClient();

  const { data: completers, error } = await supabase
    .from("idiom_daily_lessons")
    .select("user_id, language, card_ids")
    .eq("lesson_date", today)
    .eq("status", "completed");

  if (error) {
    console.error("[idiom-cron] fetch completers:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
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

  console.log(
    `[idiom-cron] ${today} → ${tomorrow}: created=${created} skipped=${skipped} completers=${completers?.length ?? 0}`,
  );

  return NextResponse.json({
    date: today,
    tomorrow,
    completers: completers?.length ?? 0,
    created,
    skipped,
  });
}
