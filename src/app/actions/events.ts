"use server";

import { after } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { insertEvent, type EventInsertData } from "@/lib/events/log-event";
import { aggregateTopicScores } from "@/lib/events/aggregate";
import type { Language } from "@/lib/supabase/types";

/**
 * Server action — called from client components (news dwell, explore clicks,
 * recipe generation, vocabulary saves, etc.).
 *
 * Gets the authenticated user from the current session, writes the event to
 * user_events, then schedules aggregation via after() so the response is
 * never blocked.
 */
export async function logEvent(data: EventInsertData): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return;

  await insertEvent(supabase, user.id, data);

  const userId = user.id;
  const language = data.language as Language;

  after(async () => {
    await aggregateTopicScores(userId, language);
  });
}
