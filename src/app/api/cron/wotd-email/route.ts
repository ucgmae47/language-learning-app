import { NextResponse } from "next/server";
import { Resend } from "resend";
import { createServiceClient } from "@/lib/supabase/service";
import { getWordForDate } from "@/lib/word-of-the-day/bank";
import {
  buildWotdEmailHtml,
  buildWotdEmailText,
} from "@/lib/email/wotd-template";
import {
  generateDailyLibraryStories,
  isDailyLibraryCronEnabled,
} from "@/lib/stories/daily-library";

/**
 * GET /api/cron/wotd-email
 *
 * Called by Vercel Cron at 08:00 UTC daily (see vercel.json).
 * Protected by the CRON_SECRET header that Vercel injects automatically.
 *
 * After WOTD emails, also resumes today's Story Library fill (idempotent) in
 * case the midnight nightly job timed out on a shorter Hobby function limit.
 */
export const maxDuration = 300;

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  const expected = `Bearer ${process.env.CRON_SECRET}`;

  if (!process.env.CRON_SECRET || authHeader !== expected) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const today = new Date();
  const todayStr = today.toISOString().slice(0, 10);
  const wordEntry = getWordForDate(today);

  const supabase = createServiceClient();

  // Fetch every confirmed user's email via the admin API.
  const { data: usersData, error: usersError } =
    await supabase.auth.admin.listUsers({ perPage: 1000 });

  if (usersError) {
    console.error("[wotd-cron] Failed to list users:", usersError.message);
    return NextResponse.json({ error: usersError.message }, { status: 500 });
  }

  const emails = usersData.users
    .filter((u) => u.email && u.email_confirmed_at)
    .map((u) => u.email as string);

  let sent = 0;

  if (emails.length > 0) {
    if (!process.env.RESEND_API_KEY) {
      console.warn("[wotd-cron] RESEND_API_KEY missing — skipping email send");
    } else {
      const resend = new Resend(process.env.RESEND_API_KEY);
      const html = buildWotdEmailHtml(wordEntry, todayStr);
      const text = buildWotdEmailText(wordEntry, todayStr);

      const FROM = process.env.WOTD_FROM_EMAIL ?? "words@linguapath.app";
      const SUBJECT = `🇪🇸 Word of the Day: ${wordEntry.word}`;

      // Resend free tier sends one email at a time; batch in chunks of 50
      // to respect rate limits while keeping latency reasonable.
      const CHUNK = 50;

      for (let i = 0; i < emails.length; i += CHUNK) {
        const chunk = emails.slice(i, i + CHUNK);
        await Promise.allSettled(
          chunk.map((to) =>
            resend.emails.send({ from: FROM, to, subject: SUBJECT, html, text }),
          ),
        );
        sent += chunk.length;
      }
    }
  }

  console.log(
    `[wotd-cron] Sent "${wordEntry.word}" to ${sent} users on ${todayStr}`,
  );

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
        timeBudgetMs: 240_000,
      });
      console.log(
        `[wotd-cron] library resume ${library.date}: created=${library.created.length} skipped=${library.skipped.length} failed=${library.failed.length}`,
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error("[wotd-cron] library resume:", message);
      library = { error: message };
    }
  }

  return NextResponse.json({
    sent,
    word: wordEntry.word,
    date: todayStr,
    library,
  });
}
