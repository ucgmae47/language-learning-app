/**
 * Temporary soft-launch gate: only Stories (library) is open.
 * Set FREE_PREVIEW_STORIES_ONLY=false to unlock the full wheel again.
 */

import { PREVIEW_UNLOCKED_FEATURE_IDS } from "@/lib/features/unlocked";

/**
 * Locked feature page prefixes (direct URL access redirects to dashboard).
 * Sub-routes like /gameroom/wordle are covered by prefix match.
 */
export const PREVIEW_LOCKED_PAGE_PREFIXES = [
  "/news",
  "/dictionary",
  "/vocabulary",
  "/flashcards",
  "/phrasebook",
  "/crossword",
  "/gameroom",
  "/sentence-builder",
  "/drills",
  "/journal",
  "/pronunciation",
  "/chat",
  "/chat-room",
  "/music",
  "/explore",
  "/calendar",
  "/recipes",
  "/planner",
  "/progress",
  "/achievements",
  "/leaderboard",
] as const;

export function isStoriesOnlyPreview(): boolean {
  // Default ON unless explicitly disabled.
  return process.env.FREE_PREVIEW_STORIES_ONLY !== "false";
}

export function isFeatureUnlocked(featureId: string): boolean {
  if (!isStoriesOnlyPreview()) return true;
  return PREVIEW_UNLOCKED_FEATURE_IDS.has(featureId);
}

export function isPathLockedInPreview(pathname: string): boolean {
  if (!isStoriesOnlyPreview()) return false;
  return PREVIEW_LOCKED_PAGE_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );
}
