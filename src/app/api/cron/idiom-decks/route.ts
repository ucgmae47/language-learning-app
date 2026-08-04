import { NextResponse } from "next/server";
import { runIdiomDeckCron } from "@/lib/flashcards/run-idiom-cron";

/**
 * GET /api/cron/idiom-decks
 *
 * Nightly job: for users who completed today's idiom lesson, pre-create
 * tomorrow's deck so the next visit needs no generation work.
 * Protected by CRON_SECRET (same pattern as wotd-email).
 *
 * Prefer /api/cron/nightly in vercel.json (Hobby 2-cron limit); this route
 * remains for manual / targeted runs.
 */
export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  const expected = `Bearer ${process.env.CRON_SECRET}`;

  if (!process.env.CRON_SECRET || authHeader !== expected) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await runIdiomDeckCron();
    console.log(
      `[idiom-cron] ${result.date} → ${result.tomorrow}: created=${result.created} skipped=${result.skipped} completers=${result.completers}`,
    );
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[idiom-cron]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
