"use server";

import { createClient } from "@/lib/supabase/server";
import type { CefrLevel } from "@/lib/supabase/types";

export async function saveCefrLevel(level: CefrLevel): Promise<{ error?: string }> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated." };
  }

  const { error } = await supabase
    .from("profiles")
    .update({ cefr_level: level, updated_at: new Date().toISOString() })
    .eq("id", user.id);

  if (error) {
    return { error: error.message };
  }

  return {};
}
