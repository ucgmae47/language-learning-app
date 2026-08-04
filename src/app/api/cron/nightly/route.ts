import { NextResponse } from "next/server";
import { runIdiomDeckCron } from "@/lib/flashcards/run-idiom-cron";
import {
  generateDailyLibraryStories,
  isDailyLibraryCronEnabled,
} from "@/lib/stories/daily-library";

/**
 * GET /api/cron/nightly
 *
 * Single midnight job (see vercel.json) so we stay within Vercel Hobby's
 * 2-cron limit while running:
 *   1. Idiom deck precreation for tomorrow
 *   2. Daily Story Library generation (1 story × language × CEFR level)
 *
 * Protected by CRON_SECRET.
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

  let idioms: Awaited<ReturnType<typeof runIdiomDeckCron>> | { error: string };
  try {
    idioms = await runIdiomDeckCron();
    console.log(
      `[nightly] idioms ${idioms.date} → ${idioms.tomorrow}: created=${idioms.created} skipped=${idioms.skipped}`,
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[nightly] idiom-cron:", message);
    idioms = { error: message };
  }

  let library:
    | Awaited<ReturnType<typeof generateDailyLibraryStories>>
    | { skipped: true; reason: string }
    | { error: string };

  if (!isDailyLibraryCronEnabled()) {
    library = {
      skipped: true,
      reason: "ENABLE_DAILY_LIBRARY_STORIES=false",
    };
  } else {
    try {
      library = await generateDailyLibraryStories({
        skipExistingToday: true,
        timeBudgetMs: 270_000,
      });
      console.log(
        `[nightly] library ${library.date}: created=${library.created.length} skipped=${library.skipped.length} failed=${library.failed.length}`,
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error("[nightly] library-cron:", message);
      library = { error: message };
    }
  }

  const idiomFailed = "error" in idioms;
  const libraryFailed = "error" in library;
  const status = idiomFailed && libraryFailed ? 500 : 200;

  return NextResponse.json({ idioms, library }, { status });
}
