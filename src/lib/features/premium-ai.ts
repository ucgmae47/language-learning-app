/**
 * Paid AI extras (Gemini / Groq / GitHub Models content generation).
 * Default OFF so free soft-launch paths use preloaded content only.
 * Set ENABLE_PREMIUM_AI=true to allow on-demand model calls for Tier 2 features.
 */
export function isPremiumAiEnabled(): boolean {
  return process.env.ENABLE_PREMIUM_AI === "true";
}
