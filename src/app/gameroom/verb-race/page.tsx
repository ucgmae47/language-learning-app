import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { VerbRaceGame } from "@/components/games/verb-race/verb-race-game";
import { getAllVerbQuestionsEs } from "@/lib/games/verb-race-es";
import { getAllVerbQuestionsFr } from "@/lib/games/verb-race-fr";
import type { Language, Profile } from "@/lib/supabase/types";

export default async function VerbRacePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single<Profile>();
  const language: Language = profile?.language ?? "es";
  const questions = language === "fr" ? getAllVerbQuestionsFr() : getAllVerbQuestionsEs();

  return <VerbRaceGame questions={questions} language={language} />;
}
