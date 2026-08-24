import { NextResponse } from "next/server";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { generateObject } from "ai";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { pickSentence } from "@/lib/sentence-builder/bank";
import { isPremiumAiEnabled } from "@/lib/features/premium-ai";
import type { Language, CefrLevel } from "@/lib/supabase/types";

const SentenceSchema = z.object({
  english: z.string().describe("The English sentence (5-12 words)."),
  target: z
    .string()
    .describe(
      "The correct translation in the target language. Include normal punctuation.",
    ),
  words: z
    .array(z.string())
    .describe(
      "The words of the target sentence in their CORRECT grammatical order, exactly as they appear in the sentence. Do NOT include punctuation as separate tokens — attach punctuation to the adjacent word (e.g. 'días.' not 'días' + '.').",
    ),
  distractors: z
    .array(z.string())
    .min(2)
    .max(4)
    .describe(
      "2-4 plausible-but-wrong distractor words in the target language that are NOT in the correct sentence. Choose words that are commonly confused with the correct ones.",
    ),
  hint: z.string().describe("One short grammatical tip relevant to this sentence (≤12 words)."),
});

export type GeneratedSentence = z.infer<typeof SentenceSchema> & {
  /** words + distractors shuffled together — shown in the word bank */
  allWords: string[];
};

const CEFR_GUIDANCE: Record<CefrLevel, string> = {
  A1: "very simple present-tense sentences, basic vocabulary, 5-7 words",
  A2: "simple sentences with common verbs and basic adjectives, 6-8 words",
  B1: "sentences using reflexive verbs, ser/estar contrast, or object pronouns, 7-10 words",
  B2: "sentences with subjunctive mood, relative clauses, or idiomatic phrases, 8-11 words",
  C1: "complex sentences with nuanced vocabulary or advanced grammar structures, 9-12 words",
  C2: "sophisticated sentences with literary vocabulary or subtle stylistic choices, 10-14 words",
};

const LANG_NAMES: Record<Language, string> = { es: "Spanish", fr: "French" };

function fisherYates<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j]!, a[i]!];
  }
  return a;
}

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json() as { language?: Language; cefrLevel?: CefrLevel; topic?: string };
    const { language = "es", cefrLevel = "A1", topic } = body;

    if (!isPremiumAiEnabled() || !process.env.GEMINI_API_KEY) {
      const picked = pickSentence(language, cefrLevel, topic);
      const { english, target, words, distractors, hint, allWords } = picked;
      return NextResponse.json(
        { english, target, words, distractors, hint, allWords } satisfies GeneratedSentence,
        { headers: { "X-Sentence-Source": "static" } },
      );
    }

    const google = createGoogleGenerativeAI({ apiKey: process.env.GEMINI_API_KEY! });

    const guidance = CEFR_GUIDANCE[cefrLevel] ?? CEFR_GUIDANCE.A1;
    const langName = LANG_NAMES[language] ?? "Spanish";
    const topicClause = topic ? ` The topic should relate to: ${topic}.` : "";

    const { object } = await generateObject({
      model: google("gemini-2.5-flash-lite"),
      schema: SentenceSchema,
      prompt: `You are a ${langName} language teacher creating a Duolingo-style sentence construction exercise.

Student level: ${cefrLevel} — ${guidance}.${topicClause}

Generate ONE English sentence and its ${langName} translation.

Rules:
1. The English sentence must be natural; the ${langName} translation must be grammatically correct.
2. The "words" array must contain EXACTLY the words of the ${langName} sentence in their CORRECT ORDER (not shuffled). Punctuation stays attached to its word — never as a separate token.
3. "distractors" are 2-4 extra ${langName} words NOT in the sentence. Make them plausible confusables.
4. "hint" is one short grammar tip specific to this sentence.

Example (do NOT copy this content):
english: "The cat drinks milk every morning."
target: "El gato bebe leche cada mañana."
words: ["El", "gato", "bebe", "leche", "cada", "mañana."]
distractors: ["come", "mucho", "la", "siempre"]
hint: "'bebe' = drinks (liquids); 'come' = eats."`,
    });

    const allWords = fisherYates([...object.words, ...object.distractors]);

    return NextResponse.json(
      { ...object, allWords } satisfies GeneratedSentence,
      { headers: { "X-Sentence-Source": "gemini" } },
    );
  } catch (err) {
    console.error("[sentence-builder/generate]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to generate sentence" },
      { status: 500 },
    );
  }
}
