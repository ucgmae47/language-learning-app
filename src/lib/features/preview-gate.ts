/**
 * Soft-launch gate: Tier 1 + Tier 2 free features are open; Tier 3 AI stays locked.
 * Set FREE_PREVIEW_STORIES_ONLY=false to unlock the full wheel (including Chat / Journal).
 */

import { PREVIEW_UNLOCKED_FEATURE_IDS } from "@/lib/features/unlocked";

/**
 * Pages locked during soft launch (direct URL → dashboard).
 * Sub-routes like /chat/... are covered by prefix match.
 * Note: /chat does NOT lock /chat-room (peer chat is Tier 1).
 * /news is here (not just excluded from the wheel) because its free-tier
 * content is placeholder/fictional articles — misleading if reachable at all.
 */
export const PREVIEW_LOCKED_PAGE_PREFIXES = [
  "/journal",
  "/chat",
  "/news",
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
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}
