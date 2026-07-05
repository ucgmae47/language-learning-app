/**
 * Low-level event logging utility.
 *
 * This module exports `insertEvent` — a function that writes a single row to
 * `user_events` and is designed to be called from server actions that already
 * have a Supabase client and user ID.
 *
 * Client components should use the server action wrapper in
 * `src/app/actions/events.ts` instead.
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
import type { SupabaseClient } from "@supabase/supabase-js";
import type { CanonicalTopic } from "./taxonomy";
import { currentSessionKey } from "./taxonomy";
import type { Language } from "@/lib/supabase/types";

export type EventInsertData = {
  language: Language;
  source: string;
  event_type: string;
  topic: CanonicalTopic;
  raw_topic?: string;
  weight: number;
  duration_s?: number;
};

/**
 * Inserts a single event row.  Non-fatal — all errors are caught and logged.
 * Call this from server actions that already hold a supabase client + userId.
 */
export async function insertEvent(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: SupabaseClient<any>,
  userId: string,
  data: EventInsertData,
): Promise<void> {
  try {
    const { error } = await supabase.from("user_events").insert({
      user_id: userId,
      language: data.language,
      source: data.source,
      event_type: data.event_type,
      topic: data.topic,
      raw_topic: data.raw_topic ?? null,
      weight: data.weight,
      duration_s: data.duration_s ?? null,
      session_key: currentSessionKey(),
    });
    if (error) {
      console.error("[events] insertEvent failed:", error.message);
    }
  } catch (err) {
    console.error("[events] insertEvent threw:", err);
  }
}
