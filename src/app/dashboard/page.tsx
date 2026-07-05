import { redirect } from "next/navigation";
import { Flame, BookOpen } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { logWordSeen } from "@/app/actions/word-of-the-day";
import { getCefrAdaptationSuggestion } from "@/app/actions/cefr-adapt";
import { WordOfTheDay } from "@/components/dashboard/word-of-the-day";
import { CefrAdaptBanner } from "@/components/dashboard/cefr-adapt-banner";
import { SpinWheel } from "@/components/dashboard/spin-wheel";
import { getWordForDate } from "@/lib/word-of-the-day/bank";
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

  const [profileResult, cefrSuggestion] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).single<Profile>(),
    getCefrAdaptationSuggestion(),
  ]);

  const profile = profileResult.data;
  const language: Language = profile?.language ?? "es";

  const today = new Date();
  const todayStr = today.toISOString().slice(0, 10);
  const wordEntry = getWordForDate(today, language);
  await logWordSeen(wordEntry.word);

  const activeLangMeta = LANG_META[language];

  return (
    <div className="min-h-screen bg-[#07070f]">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        {/* ── Stats row ────────────────────────────────────────────────── */}
        <div className="mb-8 flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-3 rounded-2xl border border-orange-500/20 bg-gradient-to-br from-orange-500/20 to-red-500/10 px-5 py-4 shadow-lg shadow-orange-500/10">
            <Flame className="h-6 w-6 text-orange-400" aria-hidden="true" />
            <div>
              <p className="text-xs font-medium text-orange-300/70">Current streak</p>
              <p className="text-2xl font-black text-white">
                {profile?.streak_count ?? 0}
                <span className="ml-1 text-sm font-medium text-orange-300/70">days</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-5 py-4">
            <BookOpen className="h-6 w-6 text-violet-400" aria-hidden="true" />
            <div>
              <p className="text-xs font-medium text-slate-400">Stories read</p>
              <p className="text-2xl font-black text-white">
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
        <section aria-labelledby="wheel-heading" className="py-4">
          <div className="mb-8 text-center">
            <h2
              id="wheel-heading"
              className="text-3xl font-black tracking-tight text-white sm:text-4xl"
            >
              What will you practice{" "}
              <span className="bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
                today?
              </span>
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              Scroll, click the arrows, or spin for a random activity
            </p>
          </div>

          <SpinWheel />
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
