/**
 * Feature ids open during soft-launch (FREE_PREVIEW_STORIES_ONLY).
 *
 * Temporarily narrowed to just Story while the rest of the wheel gets
 * stabilized — bugs kept turning up in games/tools during testing, and the
 * plan is to focus polish on Story alone before re-opening the others.
 * See PREVIEW_ALWAYS_OPEN_PREFIXES in preview-gate.ts for the matching
 * route-level lock (this set only controls the dashboard wheel).
 */
export const PREVIEW_UNLOCKED_FEATURE_IDS = new Set(["story"]);
