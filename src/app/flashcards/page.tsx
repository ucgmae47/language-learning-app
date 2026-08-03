import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Layers } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getOrCreateTodayLesson } from "@/app/actions/flashcards";
import { FlashcardDeckClient } from "@/components/flashcards/flashcard-deck-client";
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
    .select("language, display_name, cefr_level")
    .eq("id", user.id)
    .single();

  const language: Language = profile?.language ?? "es";
  const flag = language === "es" ? "🇪🇸" : "🇫🇷";
  const langName = language === "es" ? "Spanish" : "French";
  const displayName =
    profile?.display_name ?? user.user_metadata?.display_name ?? "Learner";
  const cefrLevel = profile?.cefr_level ?? "B1";

  const lessonResult = await getOrCreateTodayLesson();

  return (
    <div className="min-h-screen bg-[#07070f]">
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
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-fuchsia-500 to-pink-600 shadow-lg shadow-fuchsia-500/30">
              <Layers className="h-4 w-4 text-white" aria-hidden="true" />
            </div>
            <div>
              <h1 className="text-lg font-extrabold leading-none text-white">
                Idiom Flashcards
              </h1>
              <p className="text-xs text-slate-400">
                {flag} {langName} · daily lesson
              </p>
            </div>
          </div>
        </div>

        <div className="text-sm text-slate-400">
          <span className="font-semibold text-fuchsia-400">{cefrLevel}</span>
          {" · "}
          <span className="font-semibold text-slate-300">{displayName}</span>
        </div>
      </header>

      <main className="mx-auto max-w-xl px-4 py-8">
        {"error" in lessonResult ? (
          <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 px-5 py-8 text-center">
            <p className="text-sm font-medium text-amber-200">
              {lessonResult.error}
            </p>
            <p className="mt-2 text-xs text-amber-200/70">
              In Supabase SQL editor, run{" "}
              <code className="rounded bg-black/30 px-1.5 py-0.5">
                supabase/idiom-daily-lessons-migration.sql
              </code>
            </p>
          </div>
        ) : (
          <>
            {lessonResult.lesson.status === "studying" && (
              <div className="mb-6 rounded-2xl border border-fuchsia-500/20 bg-fuchsia-500/10 px-4 py-3 text-sm text-fuchsia-300">
                Today&apos;s lesson: {lessonResult.cards.length} idioms. Your
                progress is saved — leave anytime and pick up where you left off.
                Finish the deck for a short quiz.
              </div>
            )}
            {lessonResult.lesson.status === "quiz" && (
              <div className="mb-6 rounded-2xl border border-sky-500/20 bg-sky-500/10 px-4 py-3 text-sm text-sky-300">
                Flashcards done — quick quiz time to lock them in.
              </div>
            )}
            <FlashcardDeckClient
              lesson={lessonResult.lesson}
              cards={lessonResult.cards}
              language={language}
            />
          </>
        )}
      </main>
    </div>
  );
}
