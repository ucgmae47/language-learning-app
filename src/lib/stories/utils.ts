/**
 * Shared story text utilities.
 * Used both server-side (story generation route) and client-side (story reader).
 * Must stay as a pure, dependency-free module so it can run in both environments.
 */

/**
 * Split a single paragraph into sentences.
 * Splits on . ! ? when followed by whitespace and a non-whitespace character.
 * Imperfect for abbreviations but reliable for AI-generated prose.
 */
export function splitSentences(paragraph: string): string[] {
  return paragraph
    .split(/(?<=[.!?])\s+(?=\S)/u)
    .map((s) => s.trim())
    .filter(Boolean);
}

/**
 * Split the full story body (double-newline paragraphs) into an ordered list
 * of all sentences, preserving the same order the client component will use.
 */
export function allSentences(body: string): string[] {
  return body
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean)
    .flatMap((para) => splitSentences(para));
}

/**
 * Strip leading/trailing punctuation from a token and lowercase it.
 * Used for word translation lookup keys.
 */
export function cleanWord(token: string): string {
  return token.replace(/^[¡¿«"'([\s]+|[!?.,:;»"')[\]\s—–\-]+$/gu, "").toLowerCase();
}

/**
 * Extract unique content words from the story body for bulk translation.
 * Filters out tokens that are too short, numeric, or look like punctuation.
 */
export function extractContentWords(body: string): string[] {
  const seen = new Set<string>();
  body.split(/\s+/).forEach((raw) => {
    const word = cleanWord(raw);
    if (word.length >= 3 && !/^\d+$/.test(word) && /\p{L}/u.test(word)) {
      seen.add(word);
    }
  });
  return [...seen];
}
