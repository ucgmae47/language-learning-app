import { NextResponse } from "next/server";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { generateObject } from "ai";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import type { Language } from "@/lib/supabase/types";

const CorrectionSchema = z.object({
  original: z.string().describe(
    "The exact substring from the student's text that contains the error. Must appear verbatim.",
  ),
  corrected: z.string().describe("The corrected replacement for the original span."),
  type: z
    .enum(["spelling", "conjugation", "word_choice", "grammar", "accent"])
    .describe("Category of the error."),
  explanation: z.string().describe(
    "A short, friendly explanation of why this is wrong and what the rule is.",
  ),
});

const FeedbackSchema = z.object({
  corrections: z.array(CorrectionSchema).describe(
    "All errors found. Each original must be a verbatim substring of the submitted text.",
  ),
  overall_score: z
    .number()
    .min(0)
    .max(100)
    .describe("Overall writing score 0-100. 100 = flawless."),
  summary: z
    .string()
    .describe("2-3 sentence overall assessment written in English, friendly and encouraging."),
  strength: z
    .string()
    .describe("One specific thing the student did particularly well."),
  focus_area: z
    .string()
    .describe("One concrete thing the student should focus on practicing next."),
});

const LANG_NAMES: Record<Language, string> = { es: "Spanish", fr: "French" };

export async function POST(request: Request) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: { content?: unknown; language?: unknown; cefrLevel?: unknown };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const content = typeof body.content === "string" ? body.content.trim() : "";
  const language = (body.language as Language) ?? "es";
  const cefrLevel = typeof body.cefrLevel === "string" ? body.cefrLevel : "B1";

  if (!content || content.length < 10) {
    return NextResponse.json({ error: "Entry is too short to evaluate." }, { status: 400 });
  }

  const langName = LANG_NAMES[language];

  const prompt = `You are an expert ${langName} language tutor reviewing a student's journal entry.
The student is a ${cefrLevel} level learner.

Your job is to:
1. Find ALL errors: spelling mistakes, wrong verb conjugations, incorrect gender/number agreement, missing or wrong accents, and unnatural word choices.
2. For each error, quote the EXACT text from the entry as "original" — it must appear verbatim in the student's text, including surrounding words if needed for context. Keep it as short as possible while uniquely identifying the error location.
3. Provide the corrected form.
4. Give a friendly, educational explanation in English.
5. Score the overall writing 0-100.
6. Write a short encouraging summary.

Student's ${langName} journal entry:
"""
${content}
"""

Return structured feedback. If the entry is flawless, return an empty corrections array and a score of 100.`;

  try {
    const google = createGoogleGenerativeAI({ apiKey: process.env.GEMINI_API_KEY! });

    const { object: feedback } = await generateObject({
      model: google("gemini-2.5-flash-lite"),
      schema: FeedbackSchema,
      prompt,
    });

    return NextResponse.json({ feedback });
  } catch (err) {
    console.error("[journal/evaluate]", err);
    return NextResponse.json(
      { error: "AI evaluation failed. Please try again." },
      { status: 500 },
    );
  }
}
