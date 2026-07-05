import { NextResponse } from "next/server";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { generateObject } from "ai";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import type { Language, CefrLevel } from "@/lib/supabase/types";

const SentenceSchema = z.object({
  english: z.string().describe("The English sentence (5-12 words)."),
  target: z.string().describe("The correct translation in the target language, no punctuation at the start or end."),
  words: z
    .array(z.string())
    .describe(
      "ALL the words of the target sentence in SHUFFLED order, each word as it appears in the sentence (with correct capitalisation for the first word). Do NOT include punctuation as separate tokens — attach them to the adjacent word.",
    ),
  distractors: z
    .array(z.string())
    .min(2)
    .max(4)
    .describe(
      "2-4 plausible-but-wrong distractor words from the same language that are NOT in the correct sentence. Keep them short and believable.",
    ),
  hint: z.string().describe("One short grammatical tip relevant to this sentence (10 words max)."),
});

export type GeneratedSentence = z.infer<typeof SentenceSchema> & {
  allWords: string[]; // words + distractors shuffled together
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

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { language, cefrLevel, topic } = (await req.json()) as {
    language: Language;
    cefrLevel: CefrLevel;
    topic?: string;
  };

  const google = createGoogleGenerativeAI({ apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY! });

  const guidance = CEFR_GUIDANCE[cefrLevel] ?? CEFR_GUIDANCE.A1;
  const langName = LANG_NAMES[language];
  const topicClause = topic ? ` The topic should be related to: ${topic}.` : "";

  const { object } = await generateObject({
    model: google("gemini-2.5-flash-lite"),
    schema: SentenceSchema,
    prompt: `You are a ${langName} language teacher creating a Duolingo-style sentence construction exercise.

Target student level: ${cefrLevel} — use ${guidance}.${topicClause}

Generate ONE English sentence and its ${langName} translation.
Rules:
1. The English and ${langName} sentences must be natural and grammatically correct.
2. The "words" array must contain EXACTLY the words of the ${langName} sentence in a SHUFFLED order. Don't split punctuation into separate tokens.
3. The "distractors" are 2-4 extra ${langName} words that are plausible but NOT in the correct sentence. Choose words that sound similar or are commonly confused.
4. The "hint" should briefly explain the key grammar point demonstrated.

Example output structure (DO NOT copy content):
english: "The dog drinks water every day."
target: "El perro bebe agua todos los días."
words: ["todos", "El", "bebe", "los", "días.", "agua", "perro"]
distractors: ["come", "mucho", "la"]
hint: "Use 'bebe' (drinks) not 'come' (eats) for drinking."`,
  });

  // Fisher-Yates shuffle of words + distractors combined
  const combined = [...object.words, ...object.distractors];
  for (let i = combined.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [combined[i], combined[j]] = [combined[j]!, combined[i]!];
  }

  return NextResponse.json({ ...object, allWords: combined } satisfies GeneratedSentence);
}
