import { redirect } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { ArrowLeft, Puzzle } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { CrosswordGrid } from "@/components/crossword/crossword-grid";
import { getPuzzleForDate } from "@/lib/crossword/puzzles";
import type { Language } from "@/lib/supabase/types";

export const metadata: Metadata = {
  title: "Daily Crossword | LinguaPath",
  description: "Sharpen your vocabulary with today's language crossword puzzle.",
};

export default async function CrosswordPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("language, cefr_level")
    .eq("id", user.id)
    .single();

  const language: Language = profile?.language ?? "es";
  const today = new Date();
  const puzzle = getPuzzleForDate(today, language);

  const formattedDate = today.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  const langLabel = language === "fr" ? "French" : "Spanish";

  return (
    <div className="min-h-screen bg-[#07070f]">
      <header className="sticky top-16 z-40 border-b border-white/8 bg-gradient-to-r from-[#0d0d1e] to-[#12122a]">
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-4 px-4 sm:px-6">
          <Link
            href="/dashboard"
            className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-300 transition hover:bg-white/10 hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Dashboard
          </Link>

          <div className="flex flex-1 items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-sky-500 to-blue-600 shadow-lg shadow-sky-500/30">
              <Puzzle className="h-4 w-4 text-white" aria-hidden="true" />
            </div>
            <div>
              <p className="text-sm font-semibold text-white">Daily Crossword</p>
              <p className="text-xs text-slate-400">{formattedDate}</p>
            </div>
          </div>

          <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-slate-300">
            {langLabel}
          </span>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white">{puzzle.title}</h1>
          <p className="mt-1 text-sm text-slate-400">
            Start typing to fill the highlighted word. Completed words turn green
            and advance automatically. Use Backspace to correct, or click a clue
            to jump.
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 shadow-sm sm:p-6">
          <CrosswordGrid puzzle={puzzle} />
        </div>
      </main>
    </div>
  );
}
