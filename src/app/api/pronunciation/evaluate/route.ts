import { NextRequest, NextResponse } from "next/server";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { generateObject } from "ai";
import { z } from "zod";

const PronunciationEvalSchema = z.object({
  score: z.number().describe("Pronunciation accuracy score 0-100"),
  grade: z.string().describe("Letter grade: A, B, C, D, or F"),
  feedback: z.string().describe("2-3 sentences of specific pronunciation feedback"),
  phonetic_tips: z.string().describe(
    "Specific tips for difficult sounds in this phrase, or 'Great pronunciation!' if excellent",
  ),
  encouragement: z.string().describe("Brief encouraging message"),
});

export type PronunciationEval = z.infer<typeof PronunciationEvalSchema>;

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      target: string;
      transcript: string;
      language: string;
    };

    const { target, transcript, language } = body;

    if (!target || !transcript) {
      return NextResponse.json({ error: "target and transcript are required" }, { status: 400 });
    }

    const langName = language === "es" ? "Spanish" : "French";

    const prompt = `You are a ${langName} pronunciation coach. Evaluate how well the learner pronounced a phrase.

Target phrase: "${target}"
What the learner said (speech recognition transcript): "${transcript}"

Compare the two and evaluate pronunciation accuracy. The speech recognition transcript may not be perfect — focus on how close the sounds are.

Score from 0-100 where:
- 90-100: Excellent, native-like
- 70-89: Good, minor issues
- 50-69: Acceptable, some errors
- 30-49: Needs work, multiple errors
- 0-29: Major pronunciation issues

Provide specific, actionable feedback.`;

    const google = createGoogleGenerativeAI({ apiKey: process.env.GEMINI_API_KEY! });

    const { object } = await generateObject({
      model: google("gemini-2.5-flash-lite"),
      schema: PronunciationEvalSchema,
      prompt,
    });

    return NextResponse.json(object);
  } catch (err) {
    console.error("[pronunciation/evaluate]", err);
    return NextResponse.json({ error: "Failed to evaluate pronunciation" }, { status: 500 });
  }
}
