"use server";

import { createClient } from "@/lib/supabase/server";

type UserAchievement = {
  id: string;
  user_id: string;
  achievement_id: string;
  unlocked_at: string;
};

export async function getUnlockedAchievements(): Promise<UserAchievement[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data } = await supabase
    .from("user_achievements")
    .select("*")
    .eq("user_id", user.id)
    .order("unlocked_at", { ascending: false })
    .returns<UserAchievement[]>();

  return data ?? [];
}

export async function unlockAchievement(
  achievementId: string,
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { error } = await supabase.from("user_achievements").insert({
    user_id: user.id,
    achievement_id: achievementId,
  });

  // Ignore unique constraint violations (already unlocked)
  if (error && !error.message.includes("duplicate")) {
    return { error: error.message };
  }
  return {};
}
