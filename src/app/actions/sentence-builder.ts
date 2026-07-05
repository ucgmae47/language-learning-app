"use server";

import { createClient } from "@/lib/supabase/server";
import type { Language } from "@/lib/supabase/types";

export async function saveSentenceAttempt(
  language: Language,
  english: string,
  target: string,
  correct: boolean,
): Promise<void> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  await supabase.from("sentence_attempts").insert({
    user_id: user.id,
    language,
    english,
    target,
    correct,
  });
}

export async function getSentenceStats(language: Language): Promise<{
  total: number;
  correct: number;
  streak: number;
}> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { total: 0, correct: 0, streak: 0 };

  const { data } = await supabase
    .from("sentence_attempts")
    .select("correct")
    .eq("user_id", user.id)
    .eq("language", language)
    .order("created_at", { ascending: false })
    .limit(50);

  const rows = data ?? [];
  const total = rows.length;
  const correct = rows.filter((r) => r.correct).length;

  let streak = 0;
  for (const row of rows) {
    if (row.correct) streak++;
    else break;
  }

  return { total, correct, streak };
}
