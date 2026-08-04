import { NextRequest, NextResponse } from "next/server";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { generateObject } from "ai";
import { z } from "zod";
import { getPhrasebook } from "@/lib/phrasebook/bank";
import { isPremiumAiEnabled } from "@/lib/features/premium-ai";
import { requireUser, isUnauthorized } from "@/lib/auth/require-user";

const PhrasebookSchema = z.object({
  phrases_json: z.string().describe(
    "JSON array of 10 objects, each with: native (phrase in target lang), english (translation), pronunciation (simple phonetics), context (when to use). Return as a raw JSON string.",
  ),
  category_tip: z.string().describe("A helpful tip about this phrase category"),
});

export async function GET(request: NextRequest) {
  const authed = await requireUser();
  if (isUnauthorized(authed)) return authed;

  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category") ?? "Greetings & Farewells";
    const language = (searchParams.get("language") ?? "es") as "es" | "fr";
    const cefrLevel = searchParams.get("cefrLevel") ?? "B1";

    const seeded = getPhrasebook(category, language === "fr" ? "fr" : "es", cefrLevel);

    if (!isPremiumAiEnabled() || !process.env.GEMINI_API_KEY) {
      if (!seeded) {
        return NextResponse.json(
          { error: "No preloaded phrases for this category yet." },
          { status: 404 },
        );
      }
      return NextResponse.json(seeded, {
        headers: { "X-Phrasebook-Source": "static" },
      });
    }

    const langName = language === "es" ? "Spanish" : "French";

    const prompt = `You are a language learning assistant. Generate exactly 10 useful phrases in ${langName} for the category: "${category}".

CEFR level of the learner: ${cefrLevel}
Adjust vocabulary complexity accordingly.

Return a JSON array of 10 objects as a raw JSON string. Each object must have:
- native: the phrase in ${langName}
- english: English translation
- pronunciation: simple phonetic guide (e.g. "bweh-nohs DEE-ahs" for "Buenos días")
- context: brief note on when/where to use this phrase

Also provide a helpful tip about using phrases in the "${category}" category.`;

    const google = createGoogleGenerativeAI({ apiKey: process.env.GEMINI_API_KEY! });

    const { object } = await generateObject({
      model: google("gemini-2.5-flash-lite"),
      schema: PhrasebookSchema,
      prompt,
    });

    let phrases: unknown[];
    try {
      phrases = JSON.parse(object.phrases_json) as unknown[];
    } catch {
      phrases = seeded?.phrases ?? [];
    }

    return NextResponse.json(
      { phrases, category_tip: object.category_tip },
      { headers: { "X-Phrasebook-Source": "gemini" } },
    );
  } catch (err) {
    console.error("[phrasebook]", err);
    return NextResponse.json({ error: "Failed to generate phrasebook" }, { status: 500 });
  }
}
