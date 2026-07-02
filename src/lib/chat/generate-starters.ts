import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { generateObject } from "ai";
import { z } from "zod";
import type { CefrLevel, Language } from "@/lib/supabase/types";
import { STARTER_SUGGESTIONS } from "./system-prompt";

const StartersSchema = z.object({
  starters: z
    .array(z.string())
    .length(3)
    .describe("Exactly 3 conversation-opening sentences or questions in the target language."),
});

const LEVEL_LANG: Record<Language, Record<CefrLevel, string>> = {
  es: {
    A1: "very simple Spanish — present tense only, 4–6 words",
    A2: "simple Spanish — present or simple past, 6–10 words",
    B1: "natural Spanish — mix of tenses, 8–14 words",
    B2: "fluent Spanish — varied tenses including subjunctive where fitting, 10–16 words",
    C1: "sophisticated Spanish — nuanced, idiomatic, 10–18 words",
    C2: "native-level Spanish — rich, varied, rhetorically interesting, any length",
  },
  fr: {
    A1: "very simple French — present tense only, 4–6 words",
    A2: "simple French — present or passé composé, 6–10 words",
    B1: "natural French — mix of tenses, 8–14 words",
    B2: "fluent French — varied tenses including subjunctive where fitting, 10–16 words",
    C1: "sophisticated French — nuanced, idiomatic, 10–18 words",
    C2: "native-level French — rich, varied, rhetorically interesting, any length",
  },
};

const LANG_NAMES: Record<Language, string> = { es: "Spanish", fr: "French" };

export async function generateChatStarters(
  displayName: string,
  cefrLevel: CefrLevel,
  interests: string[],
  language: Language = "es",
): Promise<string[]> {
  const langName = LANG_NAMES[language];

  try {
    const google = createGoogleGenerativeAI({
      apiKey: process.env.GEMINI_API_KEY ?? "",
    });

    const interestClause =
      interests.length > 0
        ? `The learner's interests include: ${interests.join(", ")}.`
        : "The learner hasn't specified interests yet — use universal, engaging topics.";

    const { object } = await generateObject({
      model: google("gemini-2.5-flash-lite"),
      schema: StartersSchema,
      prompt: `You are a ${langName} conversation tutor creating personalised conversation openers for a student.

STUDENT PROFILE
- Name: ${displayName}
- CEFR Level: ${cefrLevel}
- ${interestClause}

TASK
Generate exactly 3 conversation-opening sentences or questions written in ${langName}. These will be shown as clickable suggestion chips for the student to start a conversation with their AI tutor.

REQUIREMENTS
- Write in ${LEVEL_LANG[language][cefrLevel]}
- Each starter must be different in style: one casual remark, one personal question, one opinion question
- Reference the student's interests naturally — don't force them
- Each starter should feel fresh and specific, not generic
- Do NOT include English translations
- Do NOT number or bullet them — just the ${langName} text

Return JSON matching the schema exactly.`,
    });

    return object.starters;
  } catch {
    // If AI call fails (quota, network, etc.) return level-appropriate fallbacks.
    return STARTER_SUGGESTIONS[language][cefrLevel] ?? STARTER_SUGGESTIONS.es.B1;
  }
}
