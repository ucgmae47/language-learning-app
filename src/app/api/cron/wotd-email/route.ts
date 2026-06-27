import { NextResponse } from "next/server";
import { Resend } from "resend";
import { createServiceClient } from "@/lib/supabase/service";
import { getWordForDate } from "@/lib/word-of-the-day/bank";
import {
  buildWotdEmailHtml,
  buildWotdEmailText,
} from "@/lib/email/wotd-template";

/**
 * GET /api/cron/wotd-email
 *
 * Called by Vercel Cron at 08:00 UTC daily (see vercel.json).
 * Protected by the CRON_SECRET header that Vercel injects automatically.
 */
export async function GET(request: Request) {
  const resend = new Resend(process.env.RESEND_API_KEY);

  const authHeader = request.headers.get("authorization");
  const expected = `Bearer ${process.env.CRON_SECRET}`;

  if (authHeader !== expected) {
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

  if (emails.length === 0) {
    return NextResponse.json({ sent: 0, word: wordEntry.word });
  }

  const html = buildWotdEmailHtml(wordEntry, todayStr);
  const text = buildWotdEmailText(wordEntry, todayStr);

  const FROM = process.env.WOTD_FROM_EMAIL ?? "words@linguapath.app";
  const SUBJECT = `🇪🇸 Word of the Day: ${wordEntry.word}`;

  // Resend free tier sends one email at a time; batch in chunks of 50
  // to respect rate limits while keeping latency reasonable.
  const CHUNK = 50;
  let sent = 0;

  for (let i = 0; i < emails.length; i += CHUNK) {
    const chunk = emails.slice(i, i + CHUNK);
    await Promise.allSettled(
      chunk.map((to) =>
        resend.emails.send({ from: FROM, to, subject: SUBJECT, html, text }),
      ),
    );
    sent += chunk.length;
  }

  console.log(
    `[wotd-cron] Sent "${wordEntry.word}" to ${sent} users on ${todayStr}`,
  );

  return NextResponse.json({ sent, word: wordEntry.word, date: todayStr });
}
