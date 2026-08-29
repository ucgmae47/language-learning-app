/**
 * Daily reading streak — data helpers over the existing `session_metrics` table.
 *
 * `session_metrics` already has one row per (user, day) with UNIQUE(user_id, date)
 * and an index on (user_id, date DESC), so it is the activity calendar; no new
 * table or column is needed.
 *
 * `getStreakStatus` is the READ path used for display — it derives the streak
 * from that calendar rather than trusting `profiles.streak_count`, so a lapsed
 * streak renders as 0 immediately even when the stored count is stale.
 *
 * `markDailyActivity` is the WRITE path. It is fired from story reading/quiz
 * saves and must never fail them, so every error is swallowed and logged.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Profile, SessionMetric } from "@/lib/supabase/types";
import { computeStreak, utcToday } from "./compute";

/** How far back to read the activity calendar. This is a hard ceiling on the
 *  streak we can measure — an inclusive `.gte` over N days can only ever yield
 *  N+1 distinct days — so it is set well beyond any streak a learner is likely
 *  to reach rather than merely beyond what we display. Still one index range
 *  scan over a handful of tiny rows. */
const LOOKBACK_DAYS = 400;

const DAY_MS = 24 * 60 * 60 * 1000;

export type StreakStatus = {
  /** Consecutive active days ending today or yesterday; 0 once lapsed. */
  streak: number;
  /** True when today already has a `session_metrics` row — the streak is safe. */
  activeToday: boolean;
};

/**
 * Reads the user's recent activity calendar as `YYYY-MM-DD` strings, newest
 * first. Returns null when the query failed, so callers can tell "no activity
 * on record" apart from "we could not find out".
 */
async function fetchActivityDates(
  supabase: SupabaseClient<Database>,
  userId: string,
): Promise<string[] | null> {
  const since = new Date(Date.now() - LOOKBACK_DAYS * DAY_MS)
    .toISOString()
    .slice(0, 10);

  const { data, error } = await supabase
    .from("session_metrics")
    .select("date")
    .eq("user_id", userId)
    .gte("date", since)
    .order("date", { ascending: false })
    .returns<Pick<SessionMetric, "date">[]>();

  if (error) {
    console.error("[streak] fetch session_metrics failed:", error.message);
    return null;
  }

  return (data ?? []).map((row) => row.date);
}

/**
 * Derives a user's streak from their activity calendar. Also reports whether
 * today is already counted, so a page can render both the number and the
 * "read today?" nudge from a single query.
 *
 * Never throws — this is called during render from Server Components and the
 * app has no `error.tsx` to catch it.
 */
export async function getStreakStatus(
  supabase: SupabaseClient<Database>,
  userId: string,
): Promise<StreakStatus> {
  try {
    const dates = await fetchActivityDates(supabase, userId);
    if (dates === null) return { streak: 0, activeToday: false };

    const today = utcToday();

    return {
      streak: computeStreak(dates, today),
      activeToday: dates.includes(today),
    };
  } catch (err) {
    console.error("[streak] getStreakStatus threw:", err);
    return { streak: 0, activeToday: false };
  }
}

/**
 * Marks today as active and refreshes the stored `profiles.streak_count`.
 *
 * On return (barring a logged failure) both of these hold: today has a
 * `session_metrics` row, AND `profiles.streak_count` equals the derived streak.
 * The two are checked independently — "today is already marked" does not imply
 * the profile column was ever refreshed for today, which matters because
 * `saveStoryAttempt` writes today's row itself before this ever runs.
 *
 * Called from the story progress autosave, which fires per sentence on a 400ms
 * debounce. It runs inside `after()`, off the response path, and the steady
 * state costs two small indexed reads issued in parallel and no writes at all:
 * the insert is skipped when today is already on the calendar, and the profile
 * update is skipped when the stored count already matches.
 *
 * Never throws — reading must not fail because the streak bookkeeping did.
 */
export async function markDailyActivity(
  supabase: SupabaseClient<Database>,
  userId: string,
): Promise<void> {
  try {
    const today = utcToday();

    const [dates, storedResult] = await Promise.all([
      fetchActivityDates(supabase, userId),
      supabase
        .from("profiles")
        .select("streak_count")
        .eq("id", userId)
        .maybeSingle<Pick<Profile, "streak_count">>(),
    ]);

    if (dates === null) return; // already logged

    // ── Write 1: put today on the calendar, only if it isn't there yet. ──
    if (!dates.includes(today)) {
      // `ignoreDuplicates` keeps this safe against a race with
      // saveStoryAttempt's own upsert — reading is not a completed story, so
      // this row must never clobber the counters that action owns.
      const { error: insertError } = await supabase
        .from("session_metrics")
        .upsert(
          {
            user_id: userId,
            date: today,
            stories_read: 0,
            quiz_score_avg: null,
            drills_completed: 0,
            chat_turns: 0,
            minutes_active: 0,
          },
          { onConflict: "user_id,date", ignoreDuplicates: true },
        );

      if (insertError) {
        console.error("[streak] mark today active failed:", insertError.message);
        return;
      }
    }

    // Today is on the calendar now either way, so count it in. computeStreak
    // dedupes, so appending it when it was already there is harmless.
    const streak = computeStreak([...dates, today], today);

    if (storedResult.error) {
      console.error(
        "[streak] read stored streak_count failed:",
        storedResult.error.message,
      );
      // Fall through and write anyway — a stale column is worse than a
      // redundant update.
    } else if (storedResult.data?.streak_count === streak) {
      return; // ── Write 2 skipped: already correct. ──
    }

    const { error: profileError } = await supabase
      .from("profiles")
      .update({ streak_count: streak })
      .eq("id", userId);

    if (profileError) {
      console.error("[streak] profile update failed:", profileError.message);
    }
  } catch (err) {
    console.error("[streak] markDailyActivity threw:", err);
  }
}
