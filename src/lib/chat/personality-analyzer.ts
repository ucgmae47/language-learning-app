/**
 * Chat personality analyzer.
 *
 * Reads the last N user messages from a conversation and uses Gemini to infer
 * the learner's communication style.  The result is stored in
 * profiles.personality_traits so the tutor persona persists across sessions.
 *
 * Designed to run inside next/server after() callbacks — non-blocking, uses
 * the service-role Supabase client so it works after the request context ends.
 */

import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { generateObject } from "ai";
import { z } from "zod";
import { createServiceClient } from "@/lib/supabase/service";
import type { PersonalityTraits } from "@/lib/supabase/types";

const PersonalitySchema = z.object({
  tone: z
    .enum(["sarcastic", "playful", "formal", "casual", "warm", "reserved"])
    .describe(
      "The learner's overall conversational tone based on their word choices.",
    ),
  energy: z
    .enum(["high", "medium", "low"])
    .describe(
      "Message energy: high = exclamatory/enthusiastic, low = terse/measured.",
    ),
  depth: z
    .enum(["prefers_small_talk", "mixed", "prefers_deep_discussion"])
    .describe(
      "Whether the learner gravitates toward light topics or deeper reflection.",
    ),
  humor: z
    .enum(["frequent", "occasional", "rare"])
    .describe("How often the learner uses humour, jokes, or wordplay."),
  emotional_style: z
    .enum(["expressive", "balanced", "analytical"])
    .describe(
      "expressive = shares feelings freely; analytical = fact/logic focused; balanced = in between.",
    ),
  mirror_notes: z
    .string()
    .max(200)
    .describe(
      "One or two sentences for the AI tutor: how to best mirror this specific learner's style. Be concrete. E.g. 'Uses dry irony. Dislikes over-explanation. Responds well to rhetorical questions.'",
    ),
});

/**
 * Analyse the learner's messages and persist the detected traits.
 * Safe to call in background — all errors are caught and logged.
 */
export async function analyzeAndStorePersonality(
  userId: string,
  /** The last ~10 user messages from the conversation (plain text, newest last). */
  recentUserMessages: string[],
): Promise<void> {
  if (recentUserMessages.length < 3) return; // Not enough signal yet.

  try {
    const google = createGoogleGenerativeAI({
      apiKey: process.env.GEMINI_API_KEY ?? "",
    });

    const sample = recentUserMessages.slice(-12).join("\n---\n");

    const { object } = await generateObject({
      model: google("gemini-2.5-flash-lite"),
      schema: PersonalitySchema,
      maxRetries: 0,
      prompt: `You are analyzing a language learner's chat messages to understand how they communicate.

MESSAGES (newest at the bottom):
${sample}

Based ONLY on evidence in these messages, infer the learner's communication personality.
Be conservative — if there isn't enough evidence for a dimension, choose the neutral option.
Focus on HOW they write, not WHAT they write about.`,
    });

    const traits: PersonalityTraits = {
      ...object,
      updated_at: new Date().toISOString(),
    };

    const supabase = createServiceClient();
    const { error } = await supabase
      .from("profiles")
      .update({ personality_traits: traits })
      .eq("id", userId);

    if (error) {
      console.error("[personality] DB update failed:", error.message);
    }
  } catch (err) {
    // Non-fatal — the tutor simply won't mirror personality this session.
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[personality] Analysis failed:", msg);
  }
}
