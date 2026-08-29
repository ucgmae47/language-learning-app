import { redirect } from "next/navigation";
import { Flame, BookOpen } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { logWordSeen } from "@/app/actions/word-of-the-day";
import { getCefrAdaptationSuggestion } from "@/app/actions/cefr-adapt";
import { WordOfTheDay } from "@/components/dashboard/word-of-the-day";
import { CefrAdaptBanner } from "@/components/dashboard/cefr-adapt-banner";
import { SpinWheel } from "@/components/dashboard/spin-wheel";
import { getWordForDate } from "@/lib/word-of-the-day/bank";
import { getStreakStatus } from "@/lib/streak/track";
import { isStoriesOnlyPreview } from "@/lib/features/preview-gate";
import type { Language, Profile } from "@/lib/supabase/types";

const LANG_META: Record<Language, { flag: string; label: string; assessmentHref: string }> = {
  es: { flag: "🇪🇸", label: "Spanish", assessmentHref: "/assessment/es" },
  fr: { flag: "🇫🇷", label: "French", assessmentHref: "/assessment/fr" },
};

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const [profileResult, cefrSuggestion, streakStatus] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).single<Profile>(),
    getCefrAdaptationSuggestion(),
    // Derived from session_metrics rather than profiles.streak_count so a
    // lapsed streak drops to 0 the moment it lapses.
    getStreakStatus(supabase, user.id),
  ]);

  const profile = profileResult.data;
  const language: Language = profile?.language ?? "es";

  const today = new Date();
  const todayStr = today.toISOString().slice(0, 10);
  const wordEntry = getWordForDate(today, language);
  await logWordSeen(wordEntry.word);

  const activeLangMeta = LANG_META[language];

  const storiesOnlyPreview = isStoriesOnlyPreview();

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#07070f]">
      <div className="mx-auto max-w-6xl px-3 py-6 sm:px-6 sm:py-10">
        {/* ── Stats row ────────────────────────────────────────────────── */}
        <div className="mb-6 flex flex-wrap items-center gap-3 sm:mb-8 sm:gap-4">
          <div className="flex min-w-0 flex-1 items-center gap-3 rounded-2xl border border-orange-500/20 bg-gradient-to-br from-orange-500/20 to-red-500/10 px-4 py-3 shadow-lg shadow-orange-500/10 sm:flex-none sm:px-5 sm:py-4">
            <Flame className="h-5 w-5 shrink-0 text-orange-400 sm:h-6 sm:w-6" aria-hidden="true" />
            <div className="min-w-0">
              <p className="text-xs font-medium text-orange-300/70">Current streak</p>
              <p className="text-xl font-black text-white sm:text-2xl">
                {streakStatus.streak}
                <span className="ml-1 text-sm font-medium text-orange-300/70">
                  {streakStatus.streak === 1 ? "day" : "days"}
                </span>
              </p>
            </div>
          </div>

          <div className="flex min-w-0 flex-1 items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 sm:flex-none sm:px-5 sm:py-4">
            <BookOpen className="h-5 w-5 shrink-0 text-violet-400 sm:h-6 sm:w-6" aria-hidden="true" />
            <div className="min-w-0">
              <p className="text-xs font-medium text-slate-400">Stories read</p>
              <p className="text-xl font-black text-white sm:text-2xl">
                {profile?.stories_read ?? 0}
              </p>
            </div>
          </div>

        </div>

        {/* ── Adaptive CEFR banner ─────────────────────────────────────── */}
        {cefrSuggestion && <CefrAdaptBanner data={cefrSuggestion} />}

        {/* ── Word of the Day ──────────────────────────────────────────── */}
        <div className="mb-12">
          <WordOfTheDay entry={wordEntry} date={todayStr} />
        </div>

        {/* ── Spin Wheel section ───────────────────────────────────────── */}
        <section aria-labelledby="wheel-heading" className="py-2 sm:py-4">
          <div className="mb-6 text-center sm:mb-8">
            <h2
              id="wheel-heading"
              className="text-2xl font-black tracking-tight text-white sm:text-4xl"
            >
              What will you practice{" "}
              <span className="bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
                today?
              </span>
            </h2>
            <p className="mt-2 px-2 text-sm text-slate-500">
              Use the arrows or spin for a random activity
            </p>
          </div>

          <SpinWheel storiesOnlyPreview={storiesOnlyPreview} />
        </section>

        {/* Retake assessment */}
        <p className="mt-14 text-center text-xs text-slate-600">
          Want to retest your {activeLangMeta.flag} {activeLangMeta.label} level?{" "}
          <a
            href={activeLangMeta.assessmentHref}
            className="text-emerald-500 hover:text-emerald-400 hover:underline"
          >
            Retake the assessment →
          </a>
        </p>
      </div>
    </div>
  );
}
