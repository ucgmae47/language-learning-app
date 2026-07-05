import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { HangmanGame } from "@/components/games/hangman/hangman-game";
import { getRandomHangmanWordEs } from "@/lib/games/hangman-words-es";
import { getRandomHangmanWordFr } from "@/lib/games/hangman-words-fr";
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
  const getWord = language === "fr" ? getRandomHangmanWordFr : getRandomHangmanWordEs;

  return <HangmanGame getWord={getWord} language={language} />;
}
