import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { CannonGame } from "@/components/games/cannon/cannon-game";
import { CANNON_PAIRS_ES } from "@/lib/games/cannon-words-es";
import { CANNON_PAIRS_FR } from "@/lib/games/cannon-words-fr";
import type { Language, Profile } from "@/lib/supabase/types";

export default async function CannonPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single<Profile>();
  const language: Language = profile?.language ?? "es";
  const pairs = language === "fr" ? CANNON_PAIRS_FR : CANNON_PAIRS_ES;

  return <CannonGame pairs={pairs} language={language} />;
}
