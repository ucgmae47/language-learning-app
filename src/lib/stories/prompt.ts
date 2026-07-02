import type { CefrLevel, Language } from "@/lib/supabase/types";

// Level guidance is language-agnostic (grammatical complexity maps the same way).
const LEVEL_GUIDANCE: Record<CefrLevel, string> = {
  A1: "Use only the most basic vocabulary (greetings, numbers, colours, family). Present tense only. Very short sentences (5–8 words). 150–200 words total.",
  A2: "Use everyday vocabulary. Present and simple past. Sentences up to 12 words. 200–280 words total.",
  B1: "Use a broad everyday vocabulary including some idiomatic expressions. Mix present, past, and future tenses naturally. 300–400 words total.",
  B2: "Use a wide vocabulary including some less common words. Mix all tenses including subjunctive where natural. Complex sentence structures. 400–520 words total.",
  C1: "Use sophisticated vocabulary, nuanced expression, and a variety of complex structures. Subjunctive, conditional, and passive voice used freely. 500–650 words total.",
  C2: "Write at native level — rich vocabulary, idioms, cultural references, and varied rhetorical devices. 600–750 words total.",
};

const LANGUAGE_NAMES: Record<Language, string> = {
  es: "Spanish",
  fr: "French",
};

const DEFAULT_TOPICS = ["everyday life", "culture", "travel"];

export function buildStoryPrompt(
  cefrLevel: CefrLevel,
  userInterests: string[],
  selectedTopic?: string,
  language: Language = "es",
  topGenres: string[] = [],
): string {
  const langName = LANGUAGE_NAMES[language];

  // Build genre hint from behavioural interest graph (top 2 learned genres).
  // Shown only when not overridden by an explicit topic selection.
  const genreHint =
    topGenres.length > 0
      ? ` The learner has shown strong interest in ${topGenres.join(" and ")} stories.`
      : "";

  // Selected genre takes priority; fall back to user interests, then defaults.
  let themeInstruction: string;
  if (selectedTopic) {
    const extras =
      userInterests.length > 0
        ? ` Subtly incorporate the learner's onboarding interests (${userInterests.join(", ")}) where it fits naturally.`
        : "";
    themeInstruction = `Genre: **${selectedTopic}**.${extras}`;
  } else {
    const topicList =
      userInterests.length > 0
        ? userInterests.join(", ")
        : DEFAULT_TOPICS.join(", ");
    themeInstruction = `Weave the following topic(s) naturally into the narrative: ${topicList}.${genreHint}`;
  }

  const levelGuide = LEVEL_GUIDANCE[cefrLevel];

  return `You are an expert ${langName} language educator creating immersive reading material.

TASK
Write an original short story in ${langName} and then produce a 5-question comprehension quiz in English.

STORY REQUIREMENTS
- Language: entirely in ${langName} — no English in the story body
- Level: ${cefrLevel}. ${levelGuide}
- Theme: ${themeInstruction}
- Structure: 5–7 paragraphs, each separated by a single blank line
- Tone: engaging and vivid — the reader should want to continue
- Title: in ${langName}, evocative, 3–8 words

QUIZ REQUIREMENTS
- Exactly 5 multiple-choice questions written in English
- Each question must have exactly 4 options (A, B, C, D)
- Questions must test reading comprehension and inference, NOT vocabulary translation
- Vary the difficulty: 2 straightforward recall questions, 2 inference questions, 1 evaluative question
- Only one option is correct; distractors must be plausible

Return the result as structured JSON matching the schema exactly.`;
}
