/**
 * Behavioral Interest Engine — topic taxonomy.
 *
 * Every raw signal (news category, story genre, music genre, recipe cuisine,
 * country, vocabulary word) gets normalised to one of 15 canonical topics
 * before being written to user_events.  This lets the aggregator detect
 * cross-feature patterns: e.g. news "Science" + story "sci-fi" + music
 * "electronic" all map to science_technology → strong signal.
 */

export const CANONICAL_TOPICS = [
  "science_technology",
  "history_culture",
  "arts_entertainment",
  "food_cuisine",
  "travel_geography",
  "sports_athletics",
  "nature_environment",
  "health_wellness",
  "business_economics",
  "politics_society",
  "romance_relationships",
  "mystery_thriller",
  "fantasy_adventure",
  "music_performance",
  "language_education",
] as const;

export type CanonicalTopic = (typeof CANONICAL_TOPICS)[number];

// ── Normalisation maps ────────────────────────────────────────────────────────
// Keys are lowercased raw values; values are canonical topics.
// First match wins — order matters for ambiguous terms.

const STORY_GENRE_MAP: Record<string, CanonicalTopic> = {
  fantasy:          "fantasy_adventure",
  adventure:        "fantasy_adventure",
  "sci-fi":         "science_technology",
  "science fiction":"science_technology",
  scifi:            "science_technology",
  mystery:          "mystery_thriller",
  thriller:         "mystery_thriller",
  horror:           "mystery_thriller",
  crime:            "mystery_thriller",
  romance:          "romance_relationships",
  love:             "romance_relationships",
  relationships:    "romance_relationships",
  history:          "history_culture",
  historical:       "history_culture",
  culture:          "history_culture",
  mythology:        "history_culture",
  food:             "food_cuisine",
  cooking:          "food_cuisine",
  cuisine:          "food_cuisine",
  travel:           "travel_geography",
  geography:        "travel_geography",
  sports:           "sports_athletics",
  athletics:        "sports_athletics",
  nature:           "nature_environment",
  environment:      "nature_environment",
  science:          "science_technology",
  technology:       "science_technology",
  health:           "health_wellness",
  wellness:         "health_wellness",
  business:         "business_economics",
  economics:        "business_economics",
  politics:         "politics_society",
  society:          "politics_society",
  comedy:           "arts_entertainment",
  humor:            "arts_entertainment",
  drama:            "arts_entertainment",
  music:            "music_performance",
  art:              "arts_entertainment",
  arts:             "arts_entertainment",
  film:             "arts_entertainment",
  movies:           "arts_entertainment",
};

const NEWS_CATEGORY_MAP: Record<string, CanonicalTopic> = {
  technology:    "science_technology",
  science:       "science_technology",
  business:      "business_economics",
  world:         "history_culture",
  sports:        "sports_athletics",
  entertainment: "arts_entertainment",
  health:        "health_wellness",
  politics:      "politics_society",
  environment:   "nature_environment",
  nature:        "nature_environment",
};

/** Every music genre maps to music_performance. */
export function musicGenreToCanonical(): CanonicalTopic {
  return "music_performance";
}

/** Every cuisine maps to food_cuisine. */
export function cuisineToCanonical(): CanonicalTopic {
  return "food_cuisine";
}

/** Every country click maps to travel_geography. */
export function countryToCanonical(): CanonicalTopic {
  return "travel_geography";
}

/**
 * Maps a raw story genre/topic string to a canonical topic.
 * Returns null if no match found.
 */
export function normalizeStoryGenre(raw: string): CanonicalTopic | null {
  const key = raw.trim().toLowerCase();
  return STORY_GENRE_MAP[key] ?? null;
}

/**
 * Maps a news category string to a canonical topic.
 * Returns "history_culture" as fallback for unknown categories.
 */
export function normalizeNewsCategory(category: string): CanonicalTopic {
  const key = category.trim().toLowerCase();
  return NEWS_CATEGORY_MAP[key] ?? "history_culture";
}

/**
 * General-purpose normaliser.  Tries story genre map first, then news map.
 * Returns "language_education" as the final fallback.
 */
export function normalizeRawTopic(raw: string): CanonicalTopic {
  if (!raw) return "language_education";
  const key = raw.trim().toLowerCase();
  return STORY_GENRE_MAP[key] ?? NEWS_CATEGORY_MAP[key] ?? "language_education";
}

// ── Event weight constants ────────────────────────────────────────────────────

export const WEIGHTS = {
  // News
  NEWS_ARTICLE_OPEN:       0.5,
  NEWS_DWELL_PER_30S:      0.5,  // bonus per 30 s of reading
  NEWS_SCROLLED_TO_END:    1.5,

  // Stories
  STORY_OPENED:            1.0,
  STORY_QUIZ_COMPLETED:    3.0,
  STORY_QUIZ_BONUS:        0.5,  // per correct answer above 2/5

  // Music
  MUSIC_SONG_LIKED:        5.0,
  MUSIC_SONG_DISLIKED:    -2.0,

  // Journal
  JOURNAL_ENTRY_SAVED:     2.0,

  // Recipe
  RECIPE_GENERATED:        1.0,

  // Explore
  EXPLORE_COUNTRY_CLICKED: 1.0,
  EXPLORE_DWELL_PER_60S:   1.0,  // bonus per 60 s in country panel

  // Vocabulary
  VOCAB_WORD_SAVED:        2.0,
} as const;

// ── Anti-binge: within-session diminishing-returns factor ─────────────────────
// After the FIRST event for a topic within a 30-minute session key, subsequent
// events from the SAME source are worth BINGE_FACTOR × their base weight.
export const BINGE_FACTOR = 0.25;

// ── Promotion thresholds (topic_scores → genre_interests) ─────────────────────
export const PROMOTION_TIERS = [
  { minScore: 40, minDays: 5, genreWeight: 14 }, // strong interest
  { minScore: 20, minDays: 3, genreWeight: 8  }, // moderate interest
  { minScore: 10, minDays: 2, genreWeight: 4  }, // mild interest
] as const;

// ── Time decay ────────────────────────────────────────────────────────────────
// Each week, an event's effective weight is multiplied by DECAY_PER_WEEK.
export const DECAY_PER_WEEK = 0.95;

// ── Source diversity bonus ────────────────────────────────────────────────────
// If a topic has events from ≥ SOURCE_DIVERSITY_THRESHOLD distinct sources,
// the aggregated score is multiplied by SOURCE_DIVERSITY_MULTIPLIER.
export const SOURCE_DIVERSITY_THRESHOLD = 3;
export const SOURCE_DIVERSITY_MULTIPLIER = 1.5;

/** Returns the 30-minute session key for the current moment. */
export function currentSessionKey(): string {
  return Math.floor(Date.now() / (30 * 60 * 1000)).toString();
}
