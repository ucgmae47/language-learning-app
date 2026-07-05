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
  responseText: z
    .string()
    .describe(
      "Always required. " +
      "If isCorrectLanguage is FALSE: a short message in English telling the player to ask in the target language. " +
      "If isCorrectLanguage is TRUE: a brief, natural yes/no answer in the target language (1 sentence max, e.g. '¡Sí!' or 'No, no exactamente.').",
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

Step 1 — Language check: Is this question written in ${langName}?
- If NO (it's in English or any other language): set isCorrectLanguage to false.
  Set responseText to a short English message like "Please ask your question in ${langName}!"
- If YES: set isCorrectLanguage to true.
  Set responseText to a short, natural answer in ${langName} (1 sentence max, e.g. "¡Sí!" or "No, no exactamente.").
  Answer honestly based on the secret. Do NOT reveal the secret word.

You MUST always provide responseText.`,
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
