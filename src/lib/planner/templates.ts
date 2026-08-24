export type PlannerInput = {
  language: string;
  cefrLevel: string;
  weakAreas: string[];
  interests: string[];
  availableMinutes: number;
};

export type PlannerResult = {
  week_theme: string;
  daily_plans: string;
  weekly_goals: string;
  motivation: string;
};

type DayPlan = {
  day: string;
  focus: string;
  activities: { feature: string; duration_minutes: number; description: string }[];
  tip: string;
};

const DAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
] as const;

const FREE_FEATURES = [
  "Stories",
  "Flashcards",
  "Drills",
  "Music",
  "Phrasebook",
  "Pronunciation Coach",
  "Explore",
  "Recipe Explorer",
  "Crossword",
  "Game Room",
] as const;

function splitMinutes(total: number, parts: number): number[] {
  const base = Math.max(5, Math.floor(total / parts));
  const mins = Array.from({ length: parts }, () => base);
  let used = base * parts;
  let i = 0;
  while (used < total && i < parts) {
    mins[i]! += 1;
    used += 1;
    i += 1;
  }
  // Trim if we overshot due to min 5
  while (mins.reduce((a, b) => a + b, 0) > total && mins.some((m) => m > 5)) {
    const idx = mins.findIndex((m) => m > 5);
    if (idx < 0) break;
    mins[idx]! -= 1;
  }
  return mins;
}

function pickInterest(interests: string[], fallback: string): string {
  if (interests.length === 0) return fallback;
  return interests[Math.floor(Math.random() * interests.length)]!;
}

function pickWeak(weakAreas: string[], fallback: string): string {
  if (weakAreas.length === 0) return fallback;
  return weakAreas[Math.floor(Math.random() * weakAreas.length)]!;
}

function langLabel(language: string): string {
  return language === "fr" ? "French" : "Spanish";
}

/**
 * Build a static 7-day study plan using free-tier features only.
 */
export function buildWeeklyPlan(input: PlannerInput): PlannerResult {
  const {
    language,
    cefrLevel,
    weakAreas = [],
    interests = [],
    availableMinutes = 30,
  } = input;
  const mins = Math.max(15, Math.min(120, availableMinutes || 30));
  const lang = langLabel(language);
  const interest = pickInterest(interests, "everyday conversation");
  const weak = pickWeak(weakAreas, "vocabulary");

  const week_theme =
    interests.length > 0
      ? `${cefrLevel} ${lang}: ${interest} focus week`
      : `${cefrLevel} ${lang}: balanced skills week`;

  const dayFocuses = [
    `Warm-up & ${weak}`,
    `Stories about ${interest}`,
    "Practical phrases",
    "Listening with music",
    "Grammar drills",
    "Culture & food",
    "Review & play",
  ];

  const activitySets: { feature: (typeof FREE_FEATURES)[number]; description: string }[][] = [
    [
      { feature: "Flashcards", description: `Review ${weak} flashcards at ${cefrLevel} pace` },
      { feature: "Drills", description: `Short grammar drill targeting ${weak}` },
      { feature: "Pronunciation Coach", description: "Say 3 key phrases from today's cards aloud" },
    ],
    [
      { feature: "Stories", description: `Read one story linked to ${interest}` },
      { feature: "Flashcards", description: "Save 5 new words from the story" },
      { feature: "Crossword", description: "Reinforce story vocabulary in a puzzle" },
    ],
    [
      { feature: "Phrasebook", description: `Practice phrases for ${interest}` },
      { feature: "Pronunciation Coach", description: "Record and compare 5 phrasebook lines" },
      { feature: "Explore", description: "Visit one country page and note a local phrase" },
    ],
    [
      { feature: "Music", description: `Listen to one ${lang} song; note 3 lyric phrases` },
      { feature: "Flashcards", description: "Turn lyric words into quick review cards" },
      { feature: "Phrasebook", description: "Match song themes to useful everyday phrases" },
    ],
    [
      { feature: "Drills", description: `Focused ${cefrLevel} grammar set for ${weak}` },
      { feature: "Stories", description: "Reread yesterday's story focusing on verb forms" },
      { feature: "Pronunciation Coach", description: "Practice stressed syllables from drills" },
    ],
    [
      { feature: "Recipe Explorer", description: `Cook-along vocab from a ${lang}-speaking cuisine` },
      { feature: "Explore", description: "Read cultural notes for the recipe's country" },
      { feature: "Flashcards", description: "Save kitchen and food vocabulary" },
    ],
    [
      { feature: "Game Room", description: "Play one short game to recycle the week's words" },
      { feature: "Crossword", description: "Weekend puzzle using mixed week vocabulary" },
      { feature: "Music", description: "Fun listening cooldown — sing along if you can" },
    ],
  ];

  const tips = [
    `Keep sessions short and focused — ${mins} minutes beats cramming.`,
    "Underline one new phrase per story and reuse it tomorrow.",
    "Say phrases out loud before you memorize them silently.",
    "Listen once for the gist, once for words you almost know.",
    `Mistakes on ${weak} drills are data — retry the same set later.`,
    "Connect food words to real meals you already cook.",
    "End the week by listing 10 words you can now use.",
  ];

  const daily: DayPlan[] = DAYS.map((day, i) => {
    const set = activitySets[i]!;
    const durations = splitMinutes(mins, set.length);
    return {
      day,
      focus: dayFocuses[i]!,
      activities: set.map((a, j) => ({
        feature: a.feature,
        duration_minutes: durations[j]!,
        description: a.description,
      })),
      tip: tips[i]!,
    };
  });

  const weekly_goals = [
    `Complete at least 5 study sessions of ~${mins} minutes in ${lang}.`,
    `Practice ${weak} with Flashcards or Drills on 3 different days.`,
    `Explore one cultural feature (Explore, Recipe Explorer, or Music) tied to ${interest}.`,
  ].join("\n");

  const motivation = `This ${cefrLevel} week is built around what you care about — ${interest} — while giving extra attention to ${weak}. Stick to the ${mins}-minute daily window and you'll finish Sunday with clearer vocabulary and more confident speaking. Small, steady wins add up.`;

  return {
    week_theme,
    daily_plans: JSON.stringify(daily),
    weekly_goals,
    motivation,
  };
}
