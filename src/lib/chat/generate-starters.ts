import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { generateObject } from "ai";
import { z } from "zod";
import type { CefrLevel } from "@/lib/supabase/types";

const StartersSchema = z.object({
  starters: z
    .array(z.string())
    .length(3)
    .describe("Exactly 3 conversation-opening sentences or questions in Spanish."),
});

const LEVEL_LANG: Record<CefrLevel, string> = {
  A1: "very simple Spanish — present tense only, 4–6 words",
  A2: "simple Spanish — present or simple past, 6–10 words",
  B1: "natural Spanish — mix of tenses, 8–14 words",
  B2: "fluent Spanish — varied tenses including subjunctive where fitting, 10–16 words",
  C1: "sophisticated Spanish — nuanced, idiomatic, 10–18 words",
  C2: "native-level Spanish — rich, varied, rhetorically interesting, any length",
};

// Fallback starters used if the AI call fails.
const FALLBACK: Record<CefrLevel, string[]> = {
  A1: ["Hola, ¿cómo te llamas?", "¿De dónde eres?", "¿Cuántos años tienes?"],
  A2: ["¿Qué hiciste ayer?", "¿Cuál es tu comida favorita?", "¿Tienes mascotas?"],
  B1: ["¿Qué planes tienes para el fin de semana?", "Cuéntame sobre tu trabajo.", "¿Qué programas de televisión te gustan?"],
  B2: ["¿Qué opinas sobre el cambio climático?", "Háblame de un viaje que recuerdes mucho.", "¿Cuál es el mejor consejo que has recibido?"],
  C1: ["¿Cómo crees que la tecnología cambiará la educación?", "¿Qué libro recomiendas y por qué?", "¿Cuál es tu postura sobre la inteligencia artificial?"],
  C2: ["¿Qué distinción harías entre libertad e independencia?", "Discutamos el papel de la cultura en la identidad nacional.", "¿Crees que el arte tiene obligación moral?"],
};

export async function generateChatStarters(
  displayName: string,
  cefrLevel: CefrLevel,
  interests: string[],
): Promise<string[]> {
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
      prompt: `You are a Spanish conversation tutor creating personalised conversation openers for a student.

STUDENT PROFILE
- Name: ${displayName}
- CEFR Level: ${cefrLevel}
- ${interestClause}

TASK
Generate exactly 3 conversation-opening sentences or questions written in Spanish. These will be shown as clickable suggestion chips for the student to start a conversation with their AI tutor.

REQUIREMENTS
- Write in ${LEVEL_LANG[cefrLevel]}
- Each starter must be different in style: one casual remark, one personal question, one opinion question
- Reference the student's interests naturally — don't force them
- Each starter should feel fresh and specific, not generic
- Do NOT include English translations
- Do NOT number or bullet them — just the Spanish text

Return JSON matching the schema exactly.`,
    });

    return object.starters;
  } catch {
    // If AI call fails (quota, network, etc.) return level-appropriate fallbacks.
    return FALLBACK[cefrLevel] ?? FALLBACK.B1;
  }
}
