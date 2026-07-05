import { NextResponse } from "next/server";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { generateObject } from "ai";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const JudgeSchema = z.object({
  correct: z
    .boolean()
    .describe(
      "True if the student's answer conveys the same meaning as the target, even if minor accent marks are missing. False if meaning, word choice, or grammar is noticeably wrong.",
    ),
  score: z
    .number()
    .min(0)
    .max(100)
    .describe("Overall quality score (0-100)."),
  feedback: z
    .string()
    .describe(
      "1-2 sentences of friendly, specific feedback in English. If wrong, explain the main error. If correct, give brief encouragement.",
    ),
  corrected: z
    .string()
    .describe(
      "The corrected version of the student's attempt. If the attempt is correct, echo it back unchanged.",
    ),
  corrections: z
    .array(
      z.object({
        original: z.string().describe("The incorrect word or phrase from the student's attempt."),
        corrected: z.string().describe("What it should be."),
        explanation: z.string().describe("Brief reason in English (≤10 words)."),
      }),
    )
    .describe("List of specific word/phrase corrections. Empty array if the attempt is correct."),
});

export type JudgeResult = z.infer<typeof JudgeSchema>;

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { english, target, attempt, language, cefrLevel } = (await req.json()) as {
      english: string;
      target: string;
      attempt: string;
      language: string;
      cefrLevel: string;
    };

    const google = createGoogleGenerativeAI({ apiKey: process.env.GEMINI_API_KEY! });

    const { object } = await generateObject({
      model: google("gemini-2.5-flash-lite"),
      schema: JudgeSchema,
      prompt: `You are a ${language === "fr" ? "French" : "Spanish"} language teacher evaluating a ${cefrLevel} student's translation.

English original: "${english}"
Correct ${language === "fr" ? "French" : "Spanish"} translation: "${target}"
Student's attempt: "${attempt}"

Evaluate the student's attempt. Be lenient about missing accent marks (e.g. "mañana" vs "manana" = still correct). But flag genuine grammar, word-choice, or conjugation errors.`,
    });

    return NextResponse.json(object satisfies JudgeResult);
  } catch (err) {
    console.error("[sentence-builder/judge]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to evaluate answer" },
      { status: 500 },
    );
  }
}
