import { NextResponse } from "next/server";
import {
  generateDailyLibraryStories,
  isDailyLibraryCronEnabled,
} from "@/lib/stories/daily-library";

/**
 * GET /api/cron/daily-library-stories
 *
 * Generates one shared Story Library entry per language × CEFR level for today
 * (UTC), via Gemini. Idempotent: skips combos that already have a library
 * story created today. Protected by CRON_SECRET.
 *
 * Also invoked from /api/cron/nightly so Hobby's 2-cron limit is respected.
 */
export const maxDuration = 300;

function authorize(request: Request): boolean {
  const authHeader = request.headers.get("authorization");
  const expected = `Bearer ${process.env.CRON_SECRET}`;
  return Boolean(process.env.CRON_SECRET && authHeader === expected);
}

export async function GET(request: Request) {
  if (!authorize(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isDailyLibraryCronEnabled()) {
    return NextResponse.json({
      skipped: true,
      reason: "ENABLE_DAILY_LIBRARY_STORIES=false",
    });
  }

  try {
    // Leave headroom under maxDuration for retries / Gemini latency.
    const result = await generateDailyLibraryStories({
      skipExistingToday: true,
      timeBudgetMs: 270_000,
    });

    console.log(
      `[daily-library-cron] ${result.date}: created=${result.created.length} skipped=${result.skipped.length} failed=${result.failed.length}`,
    );

    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[daily-library-cron]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
