import { NextResponse } from "next/server";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { generateObject } from "ai";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import type { Language } from "@/lib/supabase/types";

const LANG_NAMES: Record<Language, string> = { es: "Spanish", fr: "French" };

// ── Schema: pick a secret word ────────────────────────────────────────────────

const SecretSchema = z.object({
  wordInEnglish: z.string().describe("The secret word or phrase in English."),
  wordInTargetLanguage: z.string().describe("The secret word or phrase in the target language."),
  openingHint: z.string().describe(
    "A one-sentence opening hint in the target language that sets the scene without giving it away.",
  ),
});

// ── Schema: answer a question ─────────────────────────────────────────────────

const AnswerSchema = z.object({
  isCorrectLanguage: z
    .boolean()
    .describe("True if the question is written in the required target language."),
  languageNote: z
    .string()
    .optional()
    .describe("If isCorrectLanguage is false, a short message (in English) telling the user to ask in the target language."),
  answer: z
    .enum(["yes", "no", "partially", "not_applicable"])
    .optional()
    .describe("The yes/no answer. Omit if isCorrectLanguage is false."),
  responseText: z
    .string()
    .optional()
    .describe(
      "A brief, natural response in the target language (e.g. '¡Sí!' or 'No, no exactamente.'). Omit if isCorrectLanguage is false.",
    ),
});

// ── Schema: evaluate a guess ──────────────────────────────────────────────────

const GuessSchema = z.object({
  correct: z.boolean(),
  message: z.string().describe("A short, fun reaction in the target language."),
});

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const action = body.action as string;
  const language = (body.language as Language) ?? "es";
  const cefrLevel = (body.cefrLevel as string) ?? "B1";
  const langName = LANG_NAMES[language];

  const google = createGoogleGenerativeAI({ apiKey: process.env.GEMINI_API_KEY! });

  // ── START: pick a secret word ───────────────────────────────────────────────
  if (action === "start") {
    try {
      const { object } = await generateObject({
        model: google("gemini-2.5-flash-lite"),
        schema: SecretSchema,
        prompt: `You are hosting a game of 20 Questions for a ${cefrLevel}-level ${langName} learner.
Pick a concrete, common noun — an animal, everyday object, food item, job, or well-known place.
Avoid abstract concepts, proper nouns of people, or anything offensive.
Choose something a ${cefrLevel} learner would recognise in ${langName}.
The opening hint must be in ${langName} and must NOT reveal what the thing is — just hint at the general domain.`,
      });
      return NextResponse.json(object);
    } catch (err) {
      console.error("[20q/start]", err);
      return NextResponse.json({ error: "Failed to start game." }, { status: 500 });
    }
  }

  // ── ASK: answer a yes/no question ──────────────────────────────────────────
  if (action === "ask") {
    const secretWord = body.secretWord as string;
    const question = body.question as string;

    try {
      const { object } = await generateObject({
        model: google("gemini-2.5-flash-lite"),
        schema: AnswerSchema,
        prompt: `You are playing 20 Questions. The secret is: "${secretWord}".
The player must ask ALL questions in ${langName}. 

Player's question: "${question}"

1. First decide: is this question written in ${langName}? Even a single-word answer counts if it's in ${langName}.
   - If the question is in English or any other language, set isCorrectLanguage to false and provide a languageNote.
   - If it IS in ${langName}, set isCorrectLanguage to true.

2. If isCorrectLanguage is true, answer the question honestly (yes/no/partially) based on the secret.
   Respond in ${langName} with a short, natural, engaging answer (1 short sentence max).
   Do NOT reveal the secret word directly.`,
      });
      return NextResponse.json(object);
    } catch (err) {
      console.error("[20q/ask]", err);
      return NextResponse.json({ error: "Failed to answer question." }, { status: 500 });
    }
  }

  // ── GUESS: evaluate the player's final guess ───────────────────────────────
  if (action === "guess") {
    const secretWord = body.secretWord as string;
    const secretInTargetLang = body.secretInTargetLanguage as string;
    const guess = body.guess as string;

    try {
      const { object } = await generateObject({
        model: google("gemini-2.5-flash-lite"),
        schema: GuessSchema,
        prompt: `You are playing 20 Questions. The secret is "${secretWord}" (${langName}: "${secretInTargetLang}").
The player guessed: "${guess}"
Is this correct? Accept close synonyms, alternate forms, and the ${langName} equivalent as correct.
Write a short, fun message in ${langName} reacting to the guess.`,
      });
      return NextResponse.json(object);
    } catch (err) {
      console.error("[20q/guess]", err);
      return NextResponse.json({ error: "Failed to evaluate guess." }, { status: 500 });
    }
  }

  return NextResponse.json({ error: "Unknown action." }, { status: 400 });
}
