import { redirect } from "next/navigation";
import { Layers } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { FlashcardDeckClient } from "@/components/flashcards/flashcard-deck-client";
import { IDIOMS_ES } from "@/lib/flashcards/idioms-es";
import { IDIOMS_FR } from "@/lib/flashcards/idioms-fr";
import type { Language } from "@/lib/supabase/types";

export const metadata = { title: "Idiom Flashcards — LinguaPath" };

export default async function FlashcardsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login?next=/flashcards");

  const { data: profile } = await supabase
    .from("profiles")
    .select("language, display_name")
    .eq("id", user.id)
    .single();

  const language: Language = profile?.language ?? "es";
  const idioms = language === "es" ? IDIOMS_ES : IDIOMS_FR;
  const flag = language === "es" ? "🇪🇸" : "🇫🇷";
  const langName = language === "es" ? "Spanish" : "French";

  return (
    <main className="min-h-screen bg-[#07070f]">
      <div className="mx-auto max-w-xl px-4 py-10">
        {/* Header */}
        <div className="mb-8 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-fuchsia-500 to-pink-600 shadow-lg shadow-fuchsia-500/30">
            <Layers className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-black text-white">
              ✨ Idiom Flashcards
            </h1>
            <p className="text-sm text-slate-400">
              {flag} {langName} · {idioms.length} expressions
            </p>
          </div>
        </div>

        {/* How to use hint */}
        <div className="mb-6 rounded-2xl border border-fuchsia-500/20 bg-fuchsia-500/10 px-4 py-3 text-sm text-fuchsia-300">
          Click a card to reveal its meaning, then mark whether you know it.
          Cards you&apos;re still learning will cycle back for review.
        </div>

        {/* Deck */}
        <FlashcardDeckClient idioms={idioms} language={language} />
      </div>
    </main>
  );
}
