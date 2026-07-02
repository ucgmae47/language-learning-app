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

  const langLabel = language === "fr" ? "🇫🇷 French" : "🇪🇸 Spanish";

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex h-16 max-w-5xl items-center gap-4 px-4 sm:px-6">
          <Link
            href="/dashboard"
            className="flex items-center gap-1.5 text-sm text-slate-500 transition hover:text-slate-800"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Dashboard
          </Link>

          <div className="flex flex-1 items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-100">
              <Puzzle className="h-4 w-4 text-sky-700" aria-hidden="true" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-900">Daily Crossword</p>
              <p className="text-xs text-slate-400">{formattedDate}</p>
            </div>
          </div>

          <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-600">
            {langLabel}
          </span>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-900">{puzzle.title}</h1>
          <p className="mt-1 text-sm text-slate-500">
            Fill in the grid — click a clue or a cell to begin. Type letters, use
            Backspace to correct, and arrow keys to move.
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <CrosswordGrid puzzle={puzzle} />
        </div>
      </main>
    </div>
  );
}
