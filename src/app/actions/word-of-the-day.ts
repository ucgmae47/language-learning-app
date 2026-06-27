"use server";

import { createClient } from "@/lib/supabase/server";

/**
 * Upserts a log entry recording that the current user saw the word of the day.
 * Called server-side during the dashboard render — safe to call on every visit
 * because of the UNIQUE(user_id, date) constraint (ON CONFLICT DO NOTHING).
 */
export async function logWordSeen(word: string): Promise<void> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return;

  await supabase.from("word_of_day_logs").upsert(
    {
      user_id: user.id,
      date: new Date().toISOString().slice(0, 10),
      word,
    },
    { onConflict: "user_id,date", ignoreDuplicates: true },
  );
}
