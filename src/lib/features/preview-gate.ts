/**
 * Soft-launch gate: Tier 1 + Tier 2 free features are open; Tier 3 AI stays locked.
 * Set FREE_PREVIEW_STORIES_ONLY=false to unlock the full wheel (including Chat / Journal).
 */

import { PREVIEW_UNLOCKED_FEATURE_IDS } from "@/lib/features/unlocked";

/**
 * Tier 3 pages locked during soft launch (direct URL → dashboard).
 * Sub-routes like /chat/... are covered by prefix match.
 * Note: /chat does NOT lock /chat-room (peer chat is Tier 1).
 */
export const PREVIEW_LOCKED_PAGE_PREFIXES = [
  "/journal",
  "/chat",
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
  // /chat must not lock /chat-room (peer chat is free Tier 1).
  if (pathname === "/chat" || pathname.startsWith("/chat/")) return true;
  if (pathname === "/journal" || pathname.startsWith("/journal/")) return true;
  return false;
}
