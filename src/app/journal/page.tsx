import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { JournalClient } from "@/components/journal/journal-client";
import { getJournalEntries } from "@/app/actions/journal";
import type { Language, LanguageProfile, Profile } from "@/lib/supabase/types";

export default async function JournalPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const [profileResult, langProfileResult, pastEntries] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).single<Profile>(),
    supabase
      .from("language_profiles")
      .select("*")
      .eq("user_id", user.id)
      .limit(1)
      .returns<LanguageProfile[]>(),
    getJournalEntries(),
  ]);

  const profile = profileResult.data;
  const language: Language = profile?.language ?? "es";
  const cefrLevel =
    langProfileResult.data?.[0]?.cefr_level ?? profile?.cefr_level ?? "B1";

  return (
    <div className="min-h-screen bg-[#07070f]">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-20 border-b border-white/8 bg-gradient-to-r from-[#0d0d1e] to-[#12122a] px-6 py-4">
        <div className="mx-auto flex max-w-3xl items-center gap-4">
          <Link
            href="/dashboard"
            className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-300 transition hover:bg-white/10 hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Dashboard
          </Link>
          <span className="text-xl" aria-hidden="true">📓</span>
          <span className="font-bold text-white">Language Journal</span>
        </div>
      </header>

      <main>
        <JournalClient
          language={language}
          cefrLevel={cefrLevel}
          pastEntries={pastEntries}
        />
      </main>
    </div>
  );
}
