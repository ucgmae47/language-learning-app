import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { generateObject } from "ai";
import { z } from "zod";
import type { CefrLevel, Language } from "@/lib/supabase/types";
import { STARTER_SUGGESTIONS } from "./system-prompt";

const StartersSchema = z.object({
  starters: z
    .array(z.string())
    .length(4)
    .describe(
      "Exactly 4 conversation-opening sentences or questions in the target language.",
    ),
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

export type RecommendationHints = {
  primaryGenre: string;
  interestTopics: string[];
};

/**
 * Generates 4 personalised conversation starter chips.
 *
 * When `hints` is provided (background pre-generation path) the prompt
 * is also shaped by the recommendation engine's genre/topic selection,
 * making the starters consistent with what the user would see in stories.
 *
 * Falls back to level-appropriate static starters if the AI call fails.
 */
export async function generateChatStarters(
  displayName: string,
  cefrLevel: CefrLevel,
  interests: string[],
  language: Language = "es",
  hints?: RecommendationHints,
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

    // When the recommendation engine has driven topic selection, use it.
    const recommendationClause = hints
      ? `The personalisation engine suggests focusing on the "${hints.primaryGenre}" theme` +
        (hints.interestTopics.length > 0
          ? ` and the learner's strongest interests: ${hints.interestTopics.join(", ")}.`
          : ".")
      : "";

    const { object } = await generateObject({
      model: google("gemini-2.5-flash-lite"),
      schema: StartersSchema,
      prompt: `You are a ${langName} conversation tutor creating personalised conversation openers for a student.

STUDENT PROFILE
- Name: ${displayName}
- CEFR Level: ${cefrLevel}
- ${interestClause}
${recommendationClause ? `- ${recommendationClause}` : ""}

TASK
Generate exactly 4 conversation-opening sentences or questions written in ${langName}.
These will be shown as clickable suggestion chips for the student to start a conversation.

REQUIREMENTS
- Write in ${LEVEL_LANG[language][cefrLevel]}
- Each starter must be different in style:
    1. A casual personal remark
    2. A question about the student's life or day
    3. An opinion or preference question tied to their interests
    4. A cultural or topic question relevant to the language
- Reference the student's interests/recommended theme naturally — don't force it
- Each starter must feel fresh and specific, NOT generic
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
