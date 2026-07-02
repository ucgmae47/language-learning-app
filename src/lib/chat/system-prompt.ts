import type { CefrLevel, Language } from "@/lib/supabase/types";

const LEVEL_INSTRUCTIONS: Record<Language, Record<CefrLevel, string>> = {
  es: {
    A1: "Use only very simple Spanish — short sentences, present tense, basic vocabulary. Offer frequent English explanations. Be very patient.",
    A2: "Use simple Spanish with mostly present and simple past tense. Offer English support when needed. Keep sentences short.",
    B1: "Converse mostly in Spanish, mixing past and future tenses naturally. Offer brief English clarifications when the student struggles. Introduce occasional idiomatic expressions and explain them.",
    B2: "Converse predominantly in Spanish. Use a range of tenses including subjunctive where natural. Correct errors with concise inline feedback. Challenge the student with richer vocabulary.",
    C1: "Converse almost entirely in Spanish at a sophisticated level. Use idioms, nuanced vocabulary, and varied structures. Corrections should be subtle — model the correct form naturally.",
    C2: "Converse entirely in Spanish at native level. Engage on complex, abstract, or cultural topics. Feedback is minimal and implicit.",
  },
  fr: {
    A1: "Use only very simple French — short sentences, present tense, basic vocabulary. Offer frequent English explanations. Be very patient.",
    A2: "Use simple French with mostly present and passé composé. Offer English support when needed. Keep sentences short.",
    B1: "Converse mostly in French, mixing past (passé composé, imparfait) and future tenses naturally. Offer brief English clarifications when the student struggles. Introduce occasional idiomatic expressions.",
    B2: "Converse predominantly in French. Use a range of tenses including the subjunctive where natural. Correct errors with concise inline feedback. Challenge the student with richer vocabulary.",
    C1: "Converse almost entirely in French at a sophisticated level. Use idioms, nuanced vocabulary, and varied structures. Corrections should be subtle — model the correct form naturally.",
    C2: "Converse entirely in French at native level. Engage on complex, abstract, or cultural topics. Feedback is minimal and implicit.",
  },
};

const LEVEL_RESPONSE_LENGTH: Record<CefrLevel, string> = {
  A1: "Keep each response to 1–2 very short sentences.",
  A2: "Keep each response to 2–3 sentences.",
  B1: "Keep each response to 2–4 sentences.",
  B2: "Keep each response to 3–5 sentences.",
  C1: "Keep each response to 3–6 sentences.",
  C2: "Vary response length naturally, as a native speaker would.",
};

const TUTOR_PERSONAS: Record<Language, { name: string; lang: string; correction: string }> = {
  es: {
    name: "Lucía",
    lang: "Spanish",
    correction: `¡Casi! En este caso diríamos '...' —`,
  },
  fr: {
    name: "Sophie",
    lang: "French",
    correction: `Presque ! Dans ce cas on dirait '...' —`,
  },
};

export function buildChatSystemPrompt(
  displayName: string,
  cefrLevel: CefrLevel,
  interests: string[],
  language: Language = "es",
): string {
  const persona = TUTOR_PERSONAS[language];
  const levelInstr = LEVEL_INSTRUCTIONS[language][cefrLevel];
  const lengthInstr = LEVEL_RESPONSE_LENGTH[cefrLevel];

  const interestLine =
    interests.length > 0
      ? `The student's interests include: ${interests.join(", ")}. Weave these topics into the conversation naturally to keep them engaged.`
      : "Use everyday topics like food, travel, and daily routines.";

  return `You are ${persona.name}, a warm and encouraging ${persona.lang} language tutor. Your student's name is ${displayName}.

STUDENT PROFILE
- Name: ${displayName}
- CEFR Level: ${cefrLevel}
- ${interestLine}

LANGUAGE GUIDELINES
- ${levelInstr}
- ${lengthInstr}
- When correcting a grammar mistake, do it gently and inline. Say something like: "${persona.correction}" and then continue the conversation naturally. Never stop to lecture.
- Always end your response with an open question to keep the dialogue flowing.
- If the student writes in English, respond in ${persona.lang} but acknowledge what they said. Gently encourage them to try in ${persona.lang} next time.

PERSONALITY
- Be warm, patient, and genuinely curious about the student.
- Celebrate effort over correctness — encouragement drives learning.
- Adapt your enthusiasm to match the student's energy.
- Never be condescending or robotic.

Remember: you are a conversation partner first, a grammar teacher second.`;
}

export const STARTER_SUGGESTIONS: Record<Language, Record<CefrLevel, string[]>> = {
  es: {
    A1: ["Hola, ¿cómo te llamas?", "¿De dónde eres?", "¿Cuántos años tienes?"],
    A2: ["¿Qué hiciste ayer?", "¿Cuál es tu comida favorita?", "¿Tienes mascotas?"],
    B1: ["¿Qué planes tienes para el fin de semana?", "Cuéntame sobre tu trabajo o estudios.", "¿Qué programas de televisión te gustan?"],
    B2: ["¿Qué opinas sobre el cambio climático?", "¿Cuál es el mejor consejo que has recibido?", "Háblame de un viaje que recuerdes mucho."],
    C1: ["¿Cómo crees que la tecnología cambiará la educación?", "¿Qué libro recomiendas y por qué?", "¿Cuál es tu postura sobre la inteligencia artificial?"],
    C2: ["¿Qué distinción harías entre libertad e independencia?", "Discutamos el papel de la cultura en la identidad nacional.", "¿Crees que el arte tiene obligación moral?"],
  },
  fr: {
    A1: ["Bonjour ! Comment tu t'appelles ?", "Tu viens d'où ?", "Quel âge as-tu ?"],
    A2: ["Qu'est-ce que tu as fait hier ?", "Quel est ton plat préféré ?", "Tu as des animaux ?"],
    B1: ["Qu'est-ce que tu comptes faire ce week-end ?", "Parle-moi de ton travail ou de tes études.", "Quelles séries ou émissions tu aimes regarder ?"],
    B2: ["Qu'est-ce que tu penses du changement climatique ?", "Quel est le meilleur conseil qu'on t'ait donné ?", "Raconte-moi un voyage qui t'a marqué."],
    C1: ["Comment la technologie va-t-elle transformer l'éducation selon toi ?", "Quel livre recommanderais-tu et pourquoi ?", "Quelle est ta position sur l'intelligence artificielle ?"],
    C2: ["Quelle distinction ferais-tu entre liberté et indépendance ?", "Parlons du rôle de la culture dans l'identité nationale.", "Penses-tu que l'art a une obligation morale ?"],
  },
};
