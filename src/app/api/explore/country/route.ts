import { NextRequest, NextResponse } from "next/server";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { generateObject } from "ai";
import { z } from "zod";
import { getCountryByAlpha2 } from "@/lib/explore/country-data";
import { getCountryFacts } from "@/lib/explore/country-facts";
import { isPremiumAiEnabled } from "@/lib/features/premium-ai";
import type { Language } from "@/lib/supabase/types";
import { requireUser, isUnauthorized } from "@/lib/auth/require-user";

const CountryFactsSchema = z.object({
  fun_facts: z
    .array(z.string())
    .describe("Exactly 5 fascinating and surprising facts about this country"),
  cultural_note: z
    .string()
    .describe(
      "2-3 sentences about the culture, cuisine, music, and traditions that make this country unique",
    ),
  language_note: z
    .string()
    .describe(
      "Interesting notes about the regional dialect, accents, or unique local slang used in this country",
    ),
  famous_for: z
    .string()
    .describe("The 3-4 most iconic things this country is known for, as a comma-separated list"),
  must_know_phrase: z
    .string()
    .describe(
      "One unique local expression or phrase with its English meaning and usage context — formatted as: phrase — meaning",
    ),
});

export type CountryFacts = z.infer<typeof CountryFactsSchema>;

export type RestCountry = {
  name: string;
  capital: string;
  population: number;
  region: string;
  subregion: string;
  flag: string;
  alpha2: string;
};

export type CountryInfoResponse = {
  country: RestCountry;
  facts: CountryFacts;
};

type V5Country = {
  names?: { common?: string };
  codes?: { alpha_2?: string };
  capital?: string[];
  population?: number;
  region?: string;
  subregion?: string;
  flag?: { emoji?: string };
};

function staticFallback(
  alpha2: string,
  name: string,
  language: Language,
): RestCountry {
  const entry = getCountryByAlpha2(alpha2, language);
  const facts = getCountryFacts(alpha2, language);
  return {
    name: entry?.name ?? name,
    capital: facts?.capital ?? "—",
    population: facts?.population ?? 0,
    region: facts?.region ?? "—",
    subregion: facts?.subregion ?? "—",
    flag: entry?.flag ?? "",
    alpha2,
  };
}

async function fetchRestCountry(
  alpha2: string,
  name: string,
  language: Language,
): Promise<RestCountry> {
  const fallback = staticFallback(alpha2, name, language);
  const apiKey = process.env.REST_COUNTRIES_API_KEY;

  if (!apiKey) return fallback;

  try {
    const url = new URL("https://api.restcountries.com/countries/v5/code");
    url.searchParams.set("q", alpha2);
    url.searchParams.set(
      "response_fields",
      "names.common,capital,population,region,subregion,flag.emoji,codes.alpha_2",
    );

    const res = await fetch(url.toString(), {
      next: { revalidate: 86400 },
      headers: { Authorization: `Bearer ${apiKey}` },
    });

    if (!res.ok) {
      console.warn("[explore/country] REST Countries v5 error:", res.status);
      return fallback;
    }

    const json = (await res.json()) as { data?: V5Country[] };
    const item = json.data?.[0];
    if (!item) return fallback;

    return {
      name: item.names?.common ?? fallback.name,
      capital: item.capital?.[0] ?? fallback.capital,
      population: item.population ?? fallback.population,
      region: item.region ?? fallback.region,
      subregion: item.subregion ?? fallback.subregion,
      flag: item.flag?.emoji ?? fallback.flag,
      alpha2: item.codes?.alpha_2 ?? alpha2,
    };
  } catch (err) {
    console.warn("[explore/country] REST Countries fetch failed:", err);
    return fallback;
  }
}

function toResponseFacts(facts: ReturnType<typeof getCountryFacts>): CountryFacts | null {
  if (!facts) return null;
  return {
    fun_facts: facts.fun_facts,
    cultural_note: facts.cultural_note,
    language_note: facts.language_note,
    famous_for: facts.famous_for,
    must_know_phrase: facts.must_know_phrase,
  };
}

export async function GET(request: NextRequest) {
  const authed = await requireUser();
  if (isUnauthorized(authed)) return authed;

  const { searchParams } = new URL(request.url);
  const alpha2 = searchParams.get("alpha2");
  const name = searchParams.get("name");
  const language = (searchParams.get("language") ?? "es") as Language;

  if (!alpha2 || !name) {
    return NextResponse.json({ error: "Missing alpha2 or name" }, { status: 400 });
  }

  try {
    const restCountry = await fetchRestCountry(alpha2, name, language);
    const seeded = toResponseFacts(getCountryFacts(alpha2, language));

    // Free path: preloaded facts (default). Premium AI only when explicitly enabled.
    if (!isPremiumAiEnabled() || !process.env.GEMINI_API_KEY) {
      if (!seeded) {
        return NextResponse.json(
          { error: "No preloaded facts for this country yet." },
          { status: 404 },
        );
      }
      return NextResponse.json(
        { country: restCountry, facts: seeded } satisfies CountryInfoResponse,
        {
          headers: {
            "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=3600",
            "X-Explore-Source": "static",
          },
        },
      );
    }

    const langName = language === "es" ? "Spanish" : "French";
    const prompt = `You are a cultural guide writing for language learners.
Country: ${name} (${alpha2})
Target language: ${langName}

Generate engaging, accurate, and interesting information about ${name} for ${langName} language learners.
The "language_note" should specifically discuss the ${langName} spoken (or influence of ${langName}) in this country — mention dialect characteristics, unique slang, or regional accents.
The "must_know_phrase" should be a real phrase used in this country in ${langName}, with its meaning.`;

    const google = createGoogleGenerativeAI({ apiKey: process.env.GEMINI_API_KEY! });

    const { object: facts } = await generateObject({
      model: google("gemini-2.5-flash-lite"),
      schema: CountryFactsSchema,
      prompt,
    });

    return NextResponse.json({ country: restCountry, facts } satisfies CountryInfoResponse, {
      headers: {
        "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=3600",
        "X-Explore-Source": "gemini",
      },
    });
  } catch (err) {
    console.error("[explore/country]", err);
    // Fall back to seed if AI fails
    const seeded = toResponseFacts(getCountryFacts(alpha2, language));
    if (seeded) {
      const restCountry = staticFallback(alpha2, name, language);
      return NextResponse.json(
        { country: restCountry, facts: seeded } satisfies CountryInfoResponse,
        { headers: { "X-Explore-Source": "static-fallback" } },
      );
    }
    return NextResponse.json({ error: "Failed to load country info" }, { status: 500 });
  }
}
