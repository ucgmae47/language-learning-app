import { NextRequest, NextResponse } from "next/server";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { generateObject } from "ai";
import { z } from "zod";

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

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const alpha2 = searchParams.get("alpha2");
  const name = searchParams.get("name");
  const language = (searchParams.get("language") ?? "es") as "es" | "fr";

  if (!alpha2 || !name) {
    return NextResponse.json({ error: "Missing alpha2 or name" }, { status: 400 });
  }

  try {
    // ── 1. REST Countries API ─────────────────────────────────────────────────
    const restRes = await fetch(
      `https://restcountries.com/v3.1/alpha/${alpha2}?fields=name,capital,population,region,subregion,flag`,
      { next: { revalidate: 86400 } },
    );

    let restCountry: RestCountry;
    if (restRes.ok) {
      const data = await restRes.json() as {
        name?: { common?: string };
        capital?: string[];
        population?: number;
        region?: string;
        subregion?: string;
        flag?: string;
      };
      restCountry = {
        name: data.name?.common ?? name,
        capital: data.capital?.[0] ?? "—",
        population: data.population ?? 0,
        region: data.region ?? "—",
        subregion: data.subregion ?? "—",
        flag: data.flag ?? "",
        alpha2,
      };
    } else {
      restCountry = {
        name,
        capital: "—",
        population: 0,
        region: "—",
        subregion: "—",
        flag: "",
        alpha2,
      };
    }

    // ── 2. Gemini — cultural facts ────────────────────────────────────────────
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
      headers: { "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=3600" },
    });
  } catch (err) {
    console.error("[explore/country]", err);
    return NextResponse.json({ error: "Failed to load country info" }, { status: 500 });
  }
}
