import { NextResponse } from "next/server";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createGroq } from "@ai-sdk/groq";
import { generateObject, generateText } from "ai";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import type { JournalFeedback, Language } from "@/lib/supabase/types";

const CORRECTION_TYPES = [
  "spelling",
  "conjugation",
  "word_choice",
  "grammar",
  "accent",
] as const;

const CorrectionTypeSchema = z.preprocess((value) => {
  if (typeof value !== "string") return "grammar";
  const normalized = value.trim().toLowerCase().replace(/\s+/g, "_");
  return (CORRECTION_TYPES as readonly string[]).includes(normalized)
    ? normalized
    : "grammar";
}, z.enum(CORRECTION_TYPES));

const CorrectionSchema = z.object({
  original: z.string().describe(
    "The exact substring from the student's text that contains the error. Must appear verbatim.",
  ),
  corrected: z.string().describe("The corrected replacement for the original span."),
  type: CorrectionTypeSchema.describe(
    "Category of the error: spelling, conjugation, word_choice, grammar, or accent",
  ),
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

function buildPrompt(
  content: string,
  language: Language,
  cefrLevel: string,
): string {
  const langName = LANG_NAMES[language];
  return `You are an expert ${langName} language tutor reviewing a student's journal entry.
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

function normalizeFeedback(raw: z.infer<typeof FeedbackSchema>): JournalFeedback {
  return {
    corrections: raw.corrections.map((c) => ({
      original: c.original,
      corrected: c.corrected,
      type: c.type,
      explanation: c.explanation,
    })),
    overall_score: raw.overall_score,
    summary: raw.summary,
    strength: raw.strength,
    focus_area: raw.focus_area,
  };
}

async function evaluateWithGemini(prompt: string) {
  const google = createGoogleGenerativeAI({
    apiKey: process.env.GEMINI_API_KEY ?? "",
  });
  const { object } = await generateObject({
    model: google("gemini-2.5-flash-lite"),
    schema: FeedbackSchema,
    prompt,
  });
  return object;
}

/** Groq llama-3.1-8b doesn't support json_schema — use text JSON instead. */
async function evaluateWithGroq(prompt: string) {
  const groq = createGroq({ apiKey: process.env.GROQ_API_KEY ?? "" });
  const { text } = await generateText({
    model: groq("llama-3.1-8b-instant"),
    prompt: `${prompt}

Respond with ONLY valid JSON (no markdown, no backticks) in this exact shape:
{
  "corrections": [
    {
      "original": string,
      "corrected": string,
      "type": "spelling" | "conjugation" | "word_choice" | "grammar" | "accent",
      "explanation": string
    }
  ],
  "overall_score": number,
  "summary": string,
  "strength": string,
  "focus_area": string
}`,
    maxOutputTokens: 1200,
  });

  return FeedbackSchema.parse(parseJsonObject(text));
}

export async function POST(request: Request) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { error: "Please sign in to evaluate your journal." },
      { status: 401 },
    );
  }

  let body: { content?: unknown; language?: unknown; cefrLevel?: unknown };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json(
      { error: "Something went wrong reading your entry. Please try again." },
      { status: 400 },
    );
  }

  const content = typeof body.content === "string" ? body.content.trim() : "";
  const language = (body.language as Language) ?? "es";
  const cefrLevel = typeof body.cefrLevel === "string" ? body.cefrLevel : "B1";

  if (!content || content.length < 10) {
    return NextResponse.json(
      { error: "Write a bit more so we can give useful feedback." },
      { status: 400 },
    );
  }

  const prompt = buildPrompt(content, language, cefrLevel);

  const attempts: Array<{
    name: string;
    enabled: boolean;
    run: () => Promise<z.infer<typeof FeedbackSchema>>;
  }> = [
    {
      name: "gemini",
      enabled: Boolean(process.env.GEMINI_API_KEY),
      run: () => evaluateWithGemini(prompt),
    },
    {
      name: "groq",
      enabled: Boolean(process.env.GROQ_API_KEY),
      run: () => evaluateWithGroq(prompt),
    },
  ];

  for (const attempt of attempts) {
    if (!attempt.enabled) continue;
    try {
      const feedback = normalizeFeedback(await attempt.run());
      return NextResponse.json(
        { feedback },
        { headers: { "X-Journal-Source": attempt.name } },
      );
    } catch (err) {
      console.warn(`[journal/evaluate] ${attempt.name} failed:`, err);
    }
  }

  console.error("[journal/evaluate] all providers failed");
  return NextResponse.json(
    {
      error:
        "We couldn't evaluate that entry right now. Please try again in a moment.",
    },
    { status: 503 },
  );
}
