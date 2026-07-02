export type DrillConcept = {
  key: string;
  label: string;
  description: string;
};

export type DrillQuestion = {
  id: string;
  concept: string;       // matches grammar_weaknesses.concept
  conceptLabel: string;  // human-readable display label
  /** Main instruction shown to the user, e.g. "Conjugate 'hablar' — yo, preterite" */
  prompt: string;
  /**
   * Optional sentence with a blank to fill in.
   * If present, shown below the prompt.
   * Example: "Cuando ___ niño, jugaba al fútbol."
   */
  sentence?: string;
  /** The canonical correct answer. */
  answer: string;
  /** Other accepted forms (e.g. regional variants or accent-optional spellings). */
  alternates?: string[];
  /** Shown after an incorrect attempt. */
  explanation: string;
};

/** Normalize a string for comparison: lowercase, trim, collapse spaces. */
export function normalizeAnswer(s: string): string {
  return s
    .trim()
    .toLowerCase()
    .normalize("NFC"); // keep accents as-is — accents matter in both languages
}

/** Check locally before calling Groq (fast path for exact matches). */
export function isExactMatch(userAnswer: string, question: DrillQuestion): boolean {
  const norm = normalizeAnswer(userAnswer);
  if (norm === normalizeAnswer(question.answer)) return true;
  return (question.alternates ?? []).some(
    (alt) => norm === normalizeAnswer(alt),
  );
}
