/**
 * Personal AI story queue / on-demand generation is a Premium-path feature.
 * Default OFF so Free tier only serves the shared library (near-zero COGS).
 * Set ENABLE_PERSONAL_STORY_QUEUE=true to re-enable for local testing.
 */
export function isPersonalStoryQueueEnabled(): boolean {
  return process.env.ENABLE_PERSONAL_STORY_QUEUE === "true";
}
