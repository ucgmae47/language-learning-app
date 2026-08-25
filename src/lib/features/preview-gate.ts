/**
 * Soft-launch gate: only Story is open. Everything else on the wheel is
 * locked while it gets stabilized — see the note in unlocked.ts.
 * Set FREE_PREVIEW_STORIES_ONLY=false to unlock the full wheel (including
 * Chat / Journal).
 */

import { PREVIEW_UNLOCKED_FEATURE_IDS } from "@/lib/features/unlocked";

/**
 * Pages that stay reachable during soft launch regardless of the feature
 * wheel: core navigation/account pages, plus Story itself. Everything else
 * in proxy.ts's PROTECTED_PREFIXES redirects to the dashboard.
 */
export const PREVIEW_ALWAYS_OPEN_PREFIXES = [
  "/dashboard",
  "/onboarding",
  "/settings",
  "/stories",
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
  const isOpen = PREVIEW_ALWAYS_OPEN_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
  return !isOpen;
}
