import { NextRequest, NextResponse } from "next/server";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createGroq } from "@ai-sdk/groq";
import { generateObject, generateText } from "ai";
import { z } from "zod";
import { lookupStaticDictionary } from "@/lib/dictionary/static-entries";
import type { DictionaryLookup } from "@/lib/dictionary/types";
import type { Language } from "@/lib/supabase/types";
import { requireUser, isUnauthorized } from "@/lib/auth/require-user";

const LookupSchema = z.object({
  lemma: z
    .string()
    .describe("Dictionary headword / infinitive in the target language"),
  isVerb: z.boolean().describe("True if this word is primarily a verb"),
  pronunciation: z
    .string()
    .nullable()
    .describe("Simple phonetic guide for English speakers, or null"),
  primaryTranslation: z
    .string()
    .describe("Short English gloss (1-4 words) suitable for a vocab card"),
  senses: z
    .array(
      z.object({
        partOfSpeech: z
          .string()
          .describe("e.g. verb, noun, adjective, adverb, phrase"),
        definition: z
          .string()
          .describe("Clear English definition for a language learner"),
        exampleNative: z
          .string()
          .describe("Natural example sentence in the target language"),
        exampleEnglish: z.string().describe("English translation of the example"),
      }),
    )
    .min(1)
    .max(5)
    .describe("1-5 senses ordered by commonness"),
  related: z
    .array(z.string())
    .max(6)
    .describe("Related words or common collocations in the target language"),
});

function buildPrompt(q: string, language: Language, cefrLevel: string): string {
  const langName = language === "es" ? "Spanish" : "French";
  return `You are a bilingual dictionary for ${langName} learners (CEFR ${cefrLevel}).

Look up: "${q}"

Rules:
- Respond for ${langName} ↔ English as JSON matching the schema.
- If the query is English, find the best ${langName} equivalent and explain that word.
- If the query is already conjugated, set lemma to the dictionary form (infinitive for verbs).
- Keep definitions concise and learner-friendly at ${cefrLevel}.
- Provide 1–5 senses; put the most common first.
- Examples must be natural ${langName} with accurate English translations.
- Set isVerb=true only when the primary entry is a verb (or verb phrase).
- primaryTranslation should be a short English gloss for flashcards.`;
}

function toLookupResult(
  q: string,
  language: Language,
  object: z.infer<typeof LookupSchema>,
): DictionaryLookup {
  return {
    query: q,
    lemma: object.lemma,
    language,
    isVerb: object.isVerb,
    pronunciation: object.pronunciation,
    senses: object.senses,
    related: object.related,
    primaryTranslation: object.primaryTranslation,
  };
}

function parseJsonObject(text: string): unknown {
  const trimmed = text.trim();
  try {
    return JSON.parse(trimmed);
  } catch {
    const start = trimmed.indexOf("{");
    const end = trimmed.lastIndexOf("}");
    if (start >= 0 && end > start) {
      return JSON.parse(trimmed.slice(start, end + 1));
    }
    throw new Error("No JSON object in model response");
  }
}

async function lookupWithGemini(
  prompt: string,
): Promise<z.infer<typeof LookupSchema>> {
  const google = createGoogleGenerativeAI({
    apiKey: process.env.GEMINI_API_KEY ?? "",
  });
  const { object } = await generateObject({
    model: google("gemini-2.5-flash-lite"),
    schema: LookupSchema,
    prompt,
  });
  return object;
}

/** Groq llama-3.1-8b doesn't support json_schema — use text JSON instead. */
async function lookupWithGroq(
  prompt: string,
): Promise<z.infer<typeof LookupSchema>> {
  const groq = createGroq({ apiKey: process.env.GROQ_API_KEY ?? "" });
  const { text } = await generateText({
    model: groq("llama-3.1-8b-instant"),
    prompt: `${prompt}

Respond with ONLY valid JSON (no markdown, no backticks) in this exact shape:
{
  "lemma": string,
  "isVerb": boolean,
  "pronunciation": string | null,
  "primaryTranslation": string,
  "senses": [
    {
      "partOfSpeech": string,
      "definition": string,
      "exampleNative": string,
      "exampleEnglish": string
    }
  ],
  "related": string[]
}`,
    maxOutputTokens: 800,
  });

  return LookupSchema.parse(parseJsonObject(text));
}

export async function GET(request: NextRequest) {
  const authed = await requireUser();
  if (isUnauthorized(authed)) return authed;

  const { searchParams } = new URL(request.url);
  const q = (searchParams.get("q") ?? "").trim();
  const language = (searchParams.get("language") ?? "es") as Language;
  const cefrLevel = searchParams.get("cefrLevel") ?? "B1";

  if (!q || q.length > 80) {
    return NextResponse.json(
      { error: "Enter a word or short phrase to look up." },
      { status: 400 },
    );
  }

  if (language !== "es" && language !== "fr") {
    return NextResponse.json(
      { error: "That language isn't supported yet." },
      { status: 400 },
    );
  }

  const prompt = buildPrompt(q, language, cefrLevel);
  const attempts: Array<{
    name: string;
    run: () => Promise<z.infer<typeof LookupSchema>>;
    enabled: boolean;
  }> = [
    {
      name: "gemini",
      enabled: Boolean(process.env.GEMINI_API_KEY),
      run: () => lookupWithGemini(prompt),
    },
    {
      name: "groq",
      enabled: Boolean(process.env.GROQ_API_KEY),
      run: () => lookupWithGroq(prompt),
    },
  ];

  for (const attempt of attempts) {
    if (!attempt.enabled) continue;
    try {
      const object = await attempt.run();
      return NextResponse.json(toLookupResult(q, language, object), {
        headers: {
          "Cache-Control": "private, s-maxage=3600, stale-while-revalidate=86400",
          "X-Dictionary-Source": attempt.name,
        },
      });
    } catch (err) {
      console.warn(`[dictionary/lookup] ${attempt.name} failed:`, err);
    }
  }

  // Offline / last-resort: common words so the feature never hard-fails
  const staticHit = lookupStaticDictionary(q, language);
  if (staticHit) {
    return NextResponse.json(staticHit, {
      headers: {
        "Cache-Control": "private, s-maxage=3600, stale-while-revalidate=86400",
        "X-Dictionary-Source": "static",
      },
    });
  }

  console.error("[dictionary/lookup] all providers failed for", q);
  return NextResponse.json(
    {
      error:
        "We couldn't find a definition right now. Try another spelling, or try again in a moment.",
    },
    { status: 503 },
  );
}
