"use server";

import { createClient } from "@/lib/supabase/server";
import type { InterestTopic } from "@/lib/supabase/types";

export async function saveInterests(
  topics: InterestTopic[],
): Promise<{ error?: string }> {
  if (topics.length === 0) {
    return { error: "Please select at least one interest." };
  }

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Not authenticated." };

  // Delete existing interests before inserting so the user can
  // redo onboarding without creating duplicates.
  await supabase.from("user_interests").delete().eq("user_id", user.id);

  const rows = topics.map((topic) => ({
    user_id: user.id,
    topic,
    // Explicit selection is a strong signal — start with weight 5.
    weight: 5,
  }));

  const { error } = await supabase.from("user_interests").insert(rows);

  if (error) return { error: error.message };

  return {};
}
