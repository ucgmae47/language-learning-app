/**
 * Refresh personalised preset content when learner prefs change
 * (CEFR level or interest topics).
 *
 * Clears the current queued story and chat starters, then regenerates both
 * at the learner's current level / interests. Intended to run inside
 * `after()` so the user-facing response isn't blocked by AI generation.
 */

import { after } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { generateQueuedStory } from "@/lib/stories/queue";
import { generateAndQueueStarters } from "@/lib/chat/queue";
import { isPersonalStoryQueueEnabled } from "@/lib/stories/personal-queue-enabled";
import type { CefrLevel, Language } from "@/lib/supabase/types";

export type PresetRefreshInput = {
  userId: string;
  language: Language;
  cefrLevel: CefrLevel;
  displayName: string;
};

/**
 * Force-refresh the queued story + chat starters for one user/language.
 */
export async function refreshPersonalizedPresets(
  input: PresetRefreshInput,
): Promise<void> {
  const { userId, language, cefrLevel, displayName } = input;

  const tasks: Promise<unknown>[] = [
    generateAndQueueStarters(userId, language, cefrLevel, displayName, {
      force: true,
    }),
  ];

  // Skip personal story AI when Free library mode is on (default).
  if (isPersonalStoryQueueEnabled()) {
    tasks.push(generateQueuedStory(userId, language, cefrLevel, { force: true }));
  }

  await Promise.all(tasks);
}

/**
 * Schedule a non-blocking preset refresh after the current response.
 * Failures are logged and never thrown to the caller.
 */
export function schedulePresetRefresh(input: PresetRefreshInput): void {
  after(async () => {
    try {
      await refreshPersonalizedPresets(input);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error("[preset-refresh] Failed:", message);
    }
  });
}

/**
 * Convenience: load the active profile fields needed for a preset refresh
 * for the given user, then schedule it. No-ops if the profile is missing.
 */
export async function schedulePresetRefreshForUser(
  userId: string,
  overrides?: Partial<Pick<PresetRefreshInput, "language" | "cefrLevel">>,
): Promise<void> {
  const supabase = createServiceClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("language, cefr_level, display_name")
    .eq("id", userId)
    .maybeSingle<{
      language: Language;
      cefr_level: CefrLevel;
      display_name: string | null;
    }>();

  if (!profile) return;

  schedulePresetRefresh({
    userId,
    language: overrides?.language ?? profile.language ?? "es",
    cefrLevel: overrides?.cefrLevel ?? profile.cefr_level ?? "B1",
    displayName: profile.display_name?.trim() || "Learner",
  });
}
