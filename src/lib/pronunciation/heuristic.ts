export type PronunciationEval = {
  score: number;
  grade: string;
  feedback: string;
  phonetic_tips: string;
  encouragement: string;
};

function normalize(s: string): string {
  return s
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\p{L}\p{N}\s]/gu, "")
    .replace(/\s+/g, " ");
}

function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;
  const prev = new Array<number>(n + 1);
  const curr = new Array<number>(n + 1);
  for (let j = 0; j <= n; j++) prev[j] = j;
  for (let i = 1; i <= m; i++) {
    curr[0] = i;
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(curr[j - 1]! + 1, prev[j]! + 1, prev[j - 1]! + cost);
    }
    for (let j = 0; j <= n; j++) prev[j] = curr[j]!;
  }
  return prev[n]!;
}

function similarityRatio(a: string, b: string): number {
  if (!a && !b) return 1;
  if (!a || !b) return 0;
  const dist = levenshtein(a, b);
  return 1 - dist / Math.max(a.length, b.length);
}

function gradeFromScore(score: number): string {
  if (score >= 90) return "A";
  if (score >= 80) return "B";
  if (score >= 70) return "C";
  if (score >= 60) return "D";
  return "F";
}

const ES_TIPS = [
  "Roll the Spanish r (as in 'perro') with the tip of the tongue against the alveolar ridge.",
  "Spanish vowels are pure and short — avoid English diphthongs (e.g. say 'o' not 'oh').",
  "The letter j / soft g is a strong [x] sound, like clearing your throat gently.",
  "Stress the correct syllable — wrong stress is a common giveaway for learners.",
];

const FR_TIPS = [
  "Keep French vowels forward and rounded; avoid English schwa where a clear vowel is needed.",
  "Practice nasal vowels (an, on, in) without adding an English 'n' consonant at the end.",
  "The French r is produced in the throat [ʁ], not with the tip of the tongue.",
  "Liaison links a silent final consonant to a following vowel — listen for the join.",
];

function pickTip(language: string, score: number): string {
  if (score >= 90) return "Great pronunciation!";
  const tips = language === "fr" ? FR_TIPS : ES_TIPS;
  return tips[Math.floor(Math.random() * tips.length)]!;
}

function feedbackFor(score: number, language: string): string {
  const lang = language === "fr" ? "French" : "Spanish";
  if (score >= 90) {
    return `Excellent match to the target phrase. Your ${lang} pronunciation sounds clear and natural. Keep practicing at this level with longer sentences.`;
  }
  if (score >= 80) {
    return `Good attempt — most of the phrase came through clearly. Focus on the vowels and word stress that differed slightly from the target.`;
  }
  if (score >= 70) {
    return `Acceptable pronunciation with a few mismatches. Slow down, listen once more, and repeat the phrase in shorter chunks.`;
  }
  if (score >= 60) {
    return `Several sounds or words differed from the target. Compare your transcript carefully and practice the difficult syllables in isolation.`;
  }
  return `The spoken attempt was quite different from the target phrase. Replay the model audio, then try one word at a time before combining them.`;
}

function encouragementFor(score: number): string {
  if (score >= 90) return "Outstanding work — you're sounding confident!";
  if (score >= 80) return "Nice job — a little polish and you'll nail it.";
  if (score >= 70) return "You're on the right track. Keep going!";
  if (score >= 60) return "Progress takes repetition. Try again when ready.";
  return "Every attempt builds muscle memory. You've got this!";
}

/**
 * Offline pronunciation evaluation via normalized string similarity.
 * Used when AI evaluation is unavailable (free / soft-launch tier).
 */
export function evaluatePronunciation(
  target: string,
  transcript: string,
  language: string,
): PronunciationEval {
  const t = normalize(target);
  const u = normalize(transcript);
  const ratio = similarityRatio(t, u);
  const score = Math.round(Math.max(0, Math.min(100, ratio * 100)));
  const grade = gradeFromScore(score);

  return {
    score,
    grade,
    feedback: feedbackFor(score, language),
    phonetic_tips: pickTip(language, score),
    encouragement: encouragementFor(score),
  };
}
