import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { TwentyQGame } from "@/components/games/twenty-questions/twenty-q-game";
import type { Language, LanguageProfile, Profile } from "@/lib/supabase/types";

export default async function TwentyQPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [profileResult, langProfileResult] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).single<Profile>(),
    supabase
      .from("language_profiles")
      .select("*")
      .eq("user_id", user.id)
      .limit(1)
      .returns<LanguageProfile[]>(),
  ]);

  const profile = profileResult.data;
  const language: Language = profile?.language ?? "es";
  const cefrLevel =
    langProfileResult.data?.[0]?.cefr_level ?? profile?.cefr_level ?? "B1";

  return <TwentyQGame language={language} cefrLevel={cefrLevel} />;
}
