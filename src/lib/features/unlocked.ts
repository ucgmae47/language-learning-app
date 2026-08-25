/**
 * Feature ids open during soft-launch (FREE_PREVIEW_STORIES_ONLY).
 * Tier 1 = already free. Tier 2 = free via preloaded content.
 * Tier 3 (AI Chat, Journal AI) and News (placeholder content, not real
 * articles) stay locked — see PREVIEW_LOCKED_PAGE_PREFIXES.
 */
export const PREVIEW_UNLOCKED_FEATURE_IDS = new Set([
  // Tier 1 — unlock as-is
  "story",
  "vocabulary",
  "flashcards",
  "crossword",
  "gameroom",
  "drills",
  "chat-room",
  // Tier 2 — free after preload (wheel ids)
  // "news" stays out: the free-tier content is placeholder/fictional
  // articles, not real headlines — misleading to present as unlocked.
  "dictionary",
  "phrasebook",
  "sentence-builder",
  "pronunciation",
  "music",
  "explore",
  "calendar",
  "recipes",
]);
