import { NextRequest, NextResponse } from "next/server";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { generateObject } from "ai";
import { z } from "zod";

const AnalyzerSchema = z.object({
  cefr_level: z.string().describe("Assessed CEFR level: A1, A2, B1, B2, C1, or C2"),
  confidence: z.string().describe("Confidence: High, Medium, or Low"),
  reasoning: z.string().describe("2-3 sentences explaining why this CEFR level was assigned"),
  complex_words: z.string().describe(
    "Comma-separated list of 5-10 vocabulary words that are above B1 level, or 'None found' if text is simple",
  ),
  simplified_version: z.string().describe(
    "A simplified version of the first 2 sentences at A2 level, or 'Text is already simple' if A1/A2",
  ),
  grammar_notes: z.string().describe(
    "Notable grammar structures used (e.g. subjunctive, conditional, passive voice), or 'Basic grammar only' if simple",
  ),
});

export type AnalyzerResult = z.infer<typeof AnalyzerSchema>;

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as { text: string; language: string };
    const { text, language } = body;

    if (!text?.trim()) {
      return NextResponse.json({ error: "text is required" }, { status: 400 });
    }

    const langName = language === "es" ? "Spanish" : "French";

    const prompt = `You are a CEFR language level expert. Analyze the following ${langName} text and determine its difficulty level.

Text to analyze:
"""
${text.slice(0, 2000)}
"""

Assess the CEFR level based on:
- Vocabulary complexity and range
- Grammar structures used
- Sentence complexity
- Idiomatic expressions

Be precise and educational in your analysis.`;

    const google = createGoogleGenerativeAI({ apiKey: process.env.GEMINI_API_KEY! });

    const { object } = await generateObject({
      model: google("gemini-2.5-flash-lite"),
      schema: AnalyzerSchema,
      prompt,
    });

    return NextResponse.json(object);
  } catch (err) {
    console.error("[analyzer]", err);
    return NextResponse.json({ error: "Failed to analyze text" }, { status: 500 });
  }
}
