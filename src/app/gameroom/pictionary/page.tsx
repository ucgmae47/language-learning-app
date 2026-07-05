import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PictionaryLobby } from "@/components/games/pictionary/pictionary-lobby";
import type { Language, Profile } from "@/lib/supabase/types";

export default async function PictionaryPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single<Profile>();
  const language: Language = profile?.language ?? "es";

  return <PictionaryLobby language={language} />;
}
