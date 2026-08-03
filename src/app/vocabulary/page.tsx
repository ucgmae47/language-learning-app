import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, BookOpen, Flame } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { VocabBankClient } from "@/components/vocabulary/vocab-bank-client";
import { getDueCards, getVocabStats } from "@/app/actions/vocabulary";
import type { Profile } from "@/lib/supabase/types";

export default async function VocabularyPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single<Profile>();

  const displayName =
    profile?.display_name ?? user.user_metadata?.display_name ?? "Learner";
  const streak = profile?.streak_count ?? 0;

  const [dueCards, stats] = await Promise.all([getDueCards(20), getVocabStats()]);

  return (
    <div className="min-h-screen bg-[#07070f]">
      {/* Header */}
      <header className="sticky top-16 z-40 flex items-center justify-between border-b border-white/8 bg-gradient-to-r from-[#0d0d1e] to-[#12122a] px-6 py-4">
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard"
            className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-300 transition hover:bg-white/10 hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Dashboard
          </Link>

          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-lg shadow-emerald-500/30">
              <BookOpen className="h-4 w-4 text-white" aria-hidden="true" />
            </div>
            <div>
              <h1 className="text-lg font-extrabold leading-none text-white">
                Vocabulary Bank
              </h1>
              <p className="text-xs text-slate-400">Spaced repetition learning</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {streak > 0 && (
            <div className="flex items-center gap-1.5 rounded-xl border border-orange-500/30 bg-orange-500/10 px-3 py-1.5">
              <Flame className="h-3.5 w-3.5 text-orange-400" aria-hidden="true" />
              <span className="text-sm font-bold text-orange-300">{streak}</span>
            </div>
          )}
          <div className="text-sm text-slate-400">
            Signed in as{" "}
            <span className="font-semibold text-emerald-400">{displayName}</span>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="mx-auto max-w-2xl px-4 py-8">
        <VocabBankClient initialDueCards={dueCards} initialStats={stats} />
      </main>
    </div>
  );
}
