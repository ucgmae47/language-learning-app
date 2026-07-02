"use server";

import { createClient } from "@/lib/supabase/server";
import type { JournalEntry, JournalFeedback, Language } from "@/lib/supabase/types";

export async function saveJournalEntry(
  content: string,
  language: Language,
  feedback: JournalFeedback,
): Promise<{ id?: string; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  const { data, error } = await supabase
    .from("journal_entries")
    .insert({
      user_id: user.id,
      language,
      content,
      feedback,
      score: feedback.overall_score,
    })
    .select("id")
    .single();

  if (error) return { error: error.message };
  return { id: data.id };
}

export async function getJournalEntries(): Promise<JournalEntry[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data } = await supabase
    .from("journal_entries")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(20)
    .returns<JournalEntry[]>();

  return data ?? [];
}
