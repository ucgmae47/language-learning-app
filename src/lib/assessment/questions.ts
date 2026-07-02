import type { CefrLevel } from "@/lib/supabase/types";

export type Question = {
  id: number;
  band: CefrLevel;
  prompt: string;
  options: { label: string; value: string }[];
  correct: string;
};

// ── Spanish questions ─────────────────────────────────────────────────────────

export const QUESTIONS_ES: Question[] = [
  // A2 band
  {
    id: 1,
    band: "A2",
    prompt: "¿Cuál es la forma correcta? «Ella ___ al mercado ayer.»",
    options: [
      { label: "va", value: "A" },
      { label: "fue", value: "B" },
      { label: "irá", value: "C" },
      { label: "iba", value: "D" },
    ],
    correct: "B",
  },
  {
    id: 2,
    band: "A2",
    prompt: 'Choose the correct translation of "I have two sisters."',
    options: [
      { label: "Tengo dos hermanas.", value: "A" },
      { label: "Tenía dos hermanas.", value: "B" },
      { label: "Tuve dos hermanas.", value: "C" },
      { label: "Tendré dos hermanas.", value: "D" },
    ],
    correct: "A",
  },
  {
    id: 3,
    band: "A2",
    prompt: "¿Cuál de estas frases usa «ser» correctamente?",
    options: [
      { label: "El café es caliente.", value: "A" },
      { label: "Mi madre es cansada hoy.", value: "B" },
      { label: "La reunión es a las tres.", value: "C" },
      { label: "El libro es en la mesa.", value: "D" },
    ],
    correct: "C",
  },

  // B1 band
  {
    id: 4,
    band: "B1",
    prompt: "Completa la frase: «Si tuviera más tiempo, ___ más libros.» (condicional)",
    options: [
      { label: "leería", value: "A" },
      { label: "leeré", value: "B" },
      { label: "leo", value: "C" },
      { label: "leyera", value: "D" },
    ],
    correct: "A",
  },
  {
    id: 5,
    band: "B1",
    prompt: "Which sentence uses the subjunctive correctly?",
    options: [
      { label: "Quiero que ella viene mañana.", value: "A" },
      { label: "Espero que él tenga razón.", value: "B" },
      { label: "Sé que tú estás aquí.", value: "C" },
      { label: "Creo que ellos tienen hambre.", value: "D" },
    ],
    correct: "B",
  },
  {
    id: 6,
    band: "B1",
    prompt: "¿Cuál es el significado de «sin embargo» en un texto argumentativo?",
    options: [
      { label: "Por lo tanto / therefore", value: "A" },
      { label: "Además / in addition", value: "B" },
      { label: "No obstante / however", value: "C" },
      { label: "A causa de / because of", value: "D" },
    ],
    correct: "C",
  },
  {
    id: 7,
    band: "B1",
    prompt:
      "Select the sentence that correctly uses the preterite vs. imperfect: «When I was a child, I used to play football.»",
    options: [
      { label: "Cuando era niño, jugué al fútbol.", value: "A" },
      { label: "Cuando fui niño, jugaba al fútbol.", value: "B" },
      { label: "Cuando era niño, jugaba al fútbol.", value: "C" },
      { label: "Cuando fui niño, jugué al fútbol.", value: "D" },
    ],
    correct: "C",
  },

  // B2 band
  {
    id: 8,
    band: "B2",
    prompt: "¿Cuál es la voz pasiva correcta de «El chef preparó la cena»?",
    options: [
      { label: "La cena fue preparada por el chef.", value: "A" },
      { label: "La cena se preparó por el chef.", value: "B" },
      { label: "La cena era preparada por el chef.", value: "C" },
      { label: "La cena ha preparado el chef.", value: "D" },
    ],
    correct: "A",
  },
  {
    id: 9,
    band: "B2",
    prompt:
      "Which option correctly uses the subjunctive in a hypothetical past: «If she had studied, she would have passed.»",
    options: [
      { label: "Si estudiara, habría aprobado.", value: "A" },
      { label: "Si hubiera estudiado, habría aprobado.", value: "B" },
      { label: "Si había estudiado, hubiera aprobado.", value: "C" },
      { label: "Si estudiaría, habría aprobado.", value: "D" },
    ],
    correct: "B",
  },
  {
    id: 10,
    band: "B2",
    prompt: "¿Cuál de las siguientes palabras es un sinónimo de «efímero»?",
    options: [
      { label: "Duradero", value: "A" },
      { label: "Pasajero", value: "B" },
      { label: "Constante", value: "C" },
      { label: "Profundo", value: "D" },
    ],
    correct: "B",
  },
  {
    id: 11,
    band: "B2",
    prompt:
      "Read the excerpt: «Aunque las circunstancias eran adversas, el equipo perseveró con admirable determinación.» What does «adversas» mean?",
    options: [
      { label: "Favourable", value: "A" },
      { label: "Unpredictable", value: "B" },
      { label: "Unfavourable / challenging", value: "C" },
      { label: "Ordinary", value: "D" },
    ],
    correct: "C",
  },
];

/**
 * Calculate CEFR level from a set of answered questions.
 * Works for any question bank that uses the A2/B1/B2 band structure.
 */
export function calculateCefrLevel(
  answers: Record<number, string>,
  questions: Question[] = QUESTIONS_ES,
): CefrLevel {
  let correct = 0;
  let a2Correct = 0;
  let b1Correct = 0;
  let b2Correct = 0;

  for (const q of questions) {
    const given = answers[q.id];
    if (given === q.correct) {
      correct++;
      if (q.band === "A2") a2Correct++;
      else if (q.band === "B1") b1Correct++;
      else if (q.band === "B2") b2Correct++;
    }
  }

  const a2Total = questions.filter((q) => q.band === "A2").length;
  const b1Total = questions.filter((q) => q.band === "B1").length;
  const b2Total = questions.filter((q) => q.band === "B2").length;

  const a2Pct = a2Total > 0 ? a2Correct / a2Total : 0;
  const b1Pct = b1Total > 0 ? b1Correct / b1Total : 0;
  const b2Pct = b2Total > 0 ? b2Correct / b2Total : 0;
  const overall = questions.length > 0 ? correct / questions.length : 0;

  if (b2Pct >= 0.75 && overall >= 0.75) return "B2";
  if (b1Pct >= 0.6 && b2Pct >= 0.4 && overall >= 0.58) return "B1";
  if (a2Pct >= 0.67 && overall >= 0.4) return "A2";
  return "A1";
}

export const LEVEL_DESCRIPTIONS: Record<CefrLevel, string> = {
  A1: "Beginner — you recognise basic words and simple phrases.",
  A2: "Elementary — you can handle everyday expressions and short sentences.",
  B1: "Intermediate — you understand the main points of familiar topics.",
  B2: "Upper-Intermediate — you follow complex texts and engage fluently.",
  C1: "Advanced — you express yourself spontaneously and precisely.",
  C2: "Mastery — you understand virtually everything with ease.",
};
