/**
 * Daily reading streak — pure date maths.
 *
 * All arithmetic happens in UTC on `YYYY-MM-DD` strings (via `Date.UTC`) so the
 * result never drifts with the server's local timezone or with DST. The activity
 * dates come from `session_metrics.date`, which PostgREST returns in exactly
 * that shape, and "today" is produced the same way `saveStoryAttempt` already
 * does it: `new Date().toISOString().slice(0, 10)`.
 */

const DAY_MS = 24 * 60 * 60 * 1000;

/** Today as a `YYYY-MM-DD` string in UTC. */
export function utcToday(): string {
  return new Date().toISOString().slice(0, 10);
}

/**
 * Converts a `YYYY-MM-DD` string to the UTC epoch-ms of that calendar day, or
 * null when the string is malformed. Working in epoch-ms makes month and year
 * boundaries fall out for free (2026-02-28 → 2026-03-01, 2025-12-31 → 2026-01-01).
 */
function toUtcDay(date: string): number | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  if (!match) return null;

  const ms = Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  if (!Number.isFinite(ms)) return null;

  // Date.UTC silently normalises overflow, so reject anything that did not
  // round-trip — "2026-02-30" must not become 2026-03-02.
  return new Date(ms).toISOString().slice(0, 10) === date ? ms : null;
}

/**
 * Counts consecutive days of activity ending at the most recent activity date.
 *
 *  - Returns 0 when the most recent activity is neither today nor yesterday
 *    (the streak has lapsed).
 *  - Otherwise walks back one calendar day at a time and stops at the first gap.
 *
 * Input may be unordered and may contain duplicate dates; neither inflates the
 * count.
 */
export function computeStreak(
  activityDates: readonly string[],
  today: string,
): number {
  const todayUtc = toUtcDay(today);
  if (todayUtc === null) return 0;

  // Dedupe before counting, then sort newest-first — callers must not have to
  // guarantee either.
  const days = [
    ...new Set(
      activityDates
        .map(toUtcDay)
        .filter((day): day is number => day !== null && day <= todayUtc),
    ),
  ].sort((a, b) => b - a);

  const mostRecent = days[0];
  if (mostRecent === undefined) return 0;

  // Lapsed: nothing today or yesterday means there is no live streak.
  if (mostRecent !== todayUtc && mostRecent !== todayUtc - DAY_MS) return 0;

  let streak = 1;
  let expected = mostRecent - DAY_MS;

  for (const day of days.slice(1)) {
    if (day !== expected) break; // first gap ends the streak
    streak += 1;
    expected -= DAY_MS;
  }

  return streak;
}
