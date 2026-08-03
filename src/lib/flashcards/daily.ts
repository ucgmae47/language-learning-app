import type { Idiom } from "@/lib/flashcards/types";
import { IDIOMS_ES } from "@/lib/flashcards/idioms-es";
import { IDIOMS_FR } from "@/lib/flashcards/idioms-fr";
import type { Language } from "@/lib/supabase/types";

/** Cards shown in one daily lesson. */
export const DAILY_DECK_SIZE = 8;

export function getIdiomBank(language: Language): Idiom[] {
  return language === "fr" ? IDIOMS_FR : IDIOMS_ES;
}

export function resolveIdioms(
  language: Language,
  cardIds: string[],
): Idiom[] {
  const bank = getIdiomBank(language);
  const byId = new Map(bank.map((i) => [i.id, i]));
  return cardIds
    .map((id) => byId.get(id))
    .filter((i): i is Idiom => Boolean(i));
}

/** Deterministic shuffle so the same user/date always gets the same order. */
function seededShuffle<T>(items: T[], seed: string): T[] {
  const arr = [...items];
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  for (let i = arr.length - 1; i > 0; i--) {
    h ^= h << 13;
    h ^= h >>> 17;
    h ^= h << 5;
    const j = Math.abs(h) % (i + 1);
    [arr[i], arr[j]] = [arr[j]!, arr[i]!];
  }
  return arr;
}

/**
 * Pick a daily subset from the static bank.
 * Prefers cards not used in `excludeIds` when enough remain.
 */
export function pickDailyCardIds(
  language: Language,
  userId: string,
  lessonDate: string,
  excludeIds: string[] = [],
  size = DAILY_DECK_SIZE,
): string[] {
  const bank = getIdiomBank(language);
  const exclude = new Set(excludeIds);
  const fresh = bank.filter((i) => !exclude.has(i.id));
  const pool = fresh.length >= size ? fresh : bank;
  const shuffled = seededShuffle(pool, `${userId}:${language}:${lessonDate}`);
  return shuffled.slice(0, Math.min(size, shuffled.length)).map((i) => i.id);
}

export function todayDateString(date = new Date()): string {
  return date.toISOString().slice(0, 10);
}

export function addDays(dateStr: string, days: number): string {
  const d = new Date(`${dateStr}T12:00:00.000Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}
