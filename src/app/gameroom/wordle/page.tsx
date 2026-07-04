import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { WordleGame } from "@/components/games/wordle/wordle-game";
import { getDailyWordEs, WORDS_ES } from "@/lib/games/words-es";
import { getDailyWordFr, WORDS_FR } from "@/lib/games/words-fr";
import type { Language, Profile } from "@/lib/supabase/types";

export default async function WordlePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single<Profile>();

  const language: Language = profile?.language ?? "es";
  const target = language === "fr" ? getDailyWordFr() : getDailyWordEs();
  const wordList = language === "fr" ? WORDS_FR : WORDS_ES;

  return (
    <WordleGame
      target={target}
      wordList={wordList}
      language={language}
    />
  );
}
