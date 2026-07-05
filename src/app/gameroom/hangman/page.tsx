import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { HangmanGame } from "@/components/games/hangman/hangman-game";
import { HANGMAN_WORDS_ES, getRandomHangmanWordEs } from "@/lib/games/hangman-words-es";
import { HANGMAN_WORDS_FR, getRandomHangmanWordFr } from "@/lib/games/hangman-words-fr";
import type { Language, Profile } from "@/lib/supabase/types";

export default async function HangmanPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single<Profile>();

  const language: Language = profile?.language ?? "es";
  const initialWord = language === "fr" ? getRandomHangmanWordFr() : getRandomHangmanWordEs();
  const wordList: string[] = language === "fr" ? [...HANGMAN_WORDS_FR] : [...HANGMAN_WORDS_ES];

  return <HangmanGame initialWord={initialWord} wordList={wordList} language={language} />;
}
