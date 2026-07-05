import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SentenceBuilderClient } from "@/components/sentence-builder/sentence-builder-client";
import { getSentenceStats } from "@/app/actions/sentence-builder";
import type { Language, CefrLevel, Profile } from "@/lib/supabase/types";

export default async function SentenceBuilderPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single<Profile>();
  const language: Language = profile?.language ?? "es";
  const cefrLevel: CefrLevel = profile?.cefr_level ?? "A1";

  const stats = await getSentenceStats(language);

  return (
    <SentenceBuilderClient
      language={language}
      cefrLevel={cefrLevel}
      initialStats={stats}
    />
  );
}
