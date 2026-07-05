import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { WordSoupGame } from "@/components/games/word-soup/word-soup-game";
import { WORD_SOUP_ES, ES_LETTER_WEIGHTS } from "@/lib/games/word-soup-words-es";
import { WORD_SOUP_FR, FR_LETTER_WEIGHTS } from "@/lib/games/word-soup-words-fr";
import type { Language, Profile } from "@/lib/supabase/types";

export default async function WordSoupPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single<Profile>();
  const language: Language = profile?.language ?? "es";

  const wordSet = language === "fr" ? WORD_SOUP_FR : WORD_SOUP_ES;
  const letterWeights = language === "fr" ? FR_LETTER_WEIGHTS : ES_LETTER_WEIGHTS;

  return (
    <WordSoupGame
      language={language}
      letterWeights={letterWeights}
      wordSet={wordSet}
    />
  );
}
