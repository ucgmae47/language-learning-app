import type { Language } from "@/lib/supabase/types";
import type {
  ConjugationMood,
  ConjugationPerson,
  ConjugationResult,
  ConjugationTense,
} from "@/lib/dictionary/types";

type VerbeccForm = {
  c?: string[];
  pr?: string;
  p?: string;
  n?: string;
  g?: string;
};

type VerbeccResponse = {
  value?: {
    verb?: {
      infinitive?: string;
      predicted?: boolean;
    };
    moods?: Record<string, Record<string, VerbeccForm[]>>;
  };
};

const MOOD_ORDER_ES = [
  "indicativo",
  "subjuntivo",
  "imperativo",
  "condicional",
  "infinitivo",
  "gerundio",
  "participo",
] as const;

const MOOD_ORDER_FR = [
  "indicatif",
  "subjonctif",
  "impératif",
  "conditionnel",
  "infinitif",
  "participe",
] as const;

const PREFERRED_PRONOUNS_ES = new Set([
  "yo",
  "tú",
  "él",
  "nosotros",
  "vosotros",
  "ellos",
  "usted",
  "ustedes",
]);

const PREFERRED_PRONOUNS_FR = new Set([
  "je",
  "tu",
  "il",
  "nous",
  "vous",
  "ils",
]);

function titleCase(slug: string): string {
  return slug
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function pickPersons(
  forms: VerbeccForm[],
  language: Language,
): ConjugationPerson[] {
  const preferred =
    language === "fr" ? PREFERRED_PRONOUNS_FR : PREFERRED_PRONOUNS_ES;

  const people: ConjugationPerson[] = [];
  const seen = new Set<string>();

  for (const form of forms) {
    const pronoun = (form.pr ?? "").trim();
    const text = (form.c?.[0] ?? "").trim();
    if (!text) continue;

    // Non-finite forms (infinitive, gerund, participle) have no pronoun.
    if (!pronoun) {
      if (!seen.has(text)) {
        seen.add(text);
        people.push({ pronoun: "—", form: text });
      }
      continue;
    }

    if (!preferred.has(pronoun.toLowerCase())) continue;
    if (seen.has(pronoun)) continue;
    seen.add(pronoun);
    people.push({ pronoun, form: text });
  }

  // Fallback if filtering removed everything (e.g. unusual mood).
  if (people.length === 0) {
    for (const form of forms) {
      const text = (form.c?.[0] ?? "").trim();
      if (!text) continue;
      people.push({ pronoun: form.pr ?? "—", form: text });
    }
  }

  return people;
}

function orderMoodKeys(moods: Record<string, unknown>, language: Language): string[] {
  const preferred = language === "fr" ? MOOD_ORDER_FR : MOOD_ORDER_ES;
  const keys = Object.keys(moods);
  const ordered: string[] = [];

  for (const key of preferred) {
    if (keys.includes(key)) ordered.push(key);
  }
  for (const key of keys) {
    if (!ordered.includes(key)) ordered.push(key);
  }
  return ordered;
}

export function normalizeVerbecc(
  raw: VerbeccResponse,
  language: Language,
  fallbackVerb: string,
): ConjugationResult | null {
  const moodsRaw = raw.value?.moods;
  if (!moodsRaw || Object.keys(moodsRaw).length === 0) return null;

  const moods: ConjugationMood[] = [];

  for (const moodId of orderMoodKeys(moodsRaw, language)) {
    const tensesRaw = moodsRaw[moodId];
    if (!tensesRaw) continue;

    const tenses: ConjugationTense[] = Object.entries(tensesRaw).map(
      ([tenseId, forms]) => ({
        id: tenseId,
        label: titleCase(tenseId),
        persons: pickPersons(forms ?? [], language),
      }),
    );

    if (tenses.every((t) => t.persons.length === 0)) continue;

    moods.push({
      id: moodId,
      label: titleCase(moodId),
      tenses,
    });
  }

  if (moods.length === 0) return null;

  return {
    infinitive: raw.value?.verb?.infinitive ?? fallbackVerb,
    language,
    predicted: Boolean(raw.value?.verb?.predicted),
    moods,
  };
}

export async function fetchConjugation(
  verb: string,
  language: Language,
): Promise<ConjugationResult | null> {
  const base = (process.env.VERBEC_BASE_URL ?? "https://verbe.cc").replace(
    /\/$/,
    "",
  );
  const encoded = encodeURIComponent(verb.trim().toLowerCase());
  const url = `${base}/verbecc/conjugate/${language}/${encoded}`;

  const res = await fetch(url, {
    next: { revalidate: 86400 },
    headers: { Accept: "application/json" },
  });

  if (!res.ok) return null;

  const json = (await res.json()) as VerbeccResponse;
  return normalizeVerbecc(json, language, verb.trim().toLowerCase());
}
