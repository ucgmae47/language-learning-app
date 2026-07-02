"use server";

import { createClient } from "@/lib/supabase/server";
import type { Language } from "@/lib/supabase/types";

export async function saveLanguage(
  language: Language,
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Not authenticated." };

  const { error } = await supabase
    .from("profiles")
    .update({ language })
    .eq("id", user.id);

  if (error) return { error: error.message };
  return {};
}
