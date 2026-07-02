import { redirect } from "next/navigation";
import Link from "next/link";
import { LogOut, Plus, Settings, Zap, Flame, BookOpen } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { logout } from "@/app/actions/auth";
import { logWordSeen } from "@/app/actions/word-of-the-day";
import { getCefrAdaptationSuggestion } from "@/app/actions/cefr-adapt";
import { WordOfTheDay } from "@/components/dashboard/word-of-the-day";
import { LanguageSwitcher } from "@/components/dashboard/language-switcher";
import { CefrAdaptBanner } from "@/components/dashboard/cefr-adapt-banner";
import { SpinWheel } from "@/components/dashboard/spin-wheel";
import { getWordForDate } from "@/lib/word-of-the-day/bank";
import type { Language, LanguageProfile, Profile } from "@/lib/supabase/types";

const ALL_LANGUAGES: Language[] = ["es", "fr"];

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

  const [profileResult, langProfilesResult, cefrSuggestion] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).single<Profile>(),
    supabase
      .from("language_profiles")
      .select("*")
      .eq("user_id", user.id)
      .returns<LanguageProfile[]>(),
    getCefrAdaptationSuggestion(),
  ]);

  const profile = profileResult.data;
  const langProfiles: LanguageProfile[] = langProfilesResult.data ?? [];
  const language: Language = profile?.language ?? "es";
  const displayName =
    profile?.display_name ?? user.user_metadata?.display_name ?? "Learner";

  const takenLanguages = new Set(langProfiles.map((lp) => lp.language));
  const addableLanguages = ALL_LANGUAGES.filter((l) => !takenLanguages.has(l));

  const today = new Date();
  const todayStr = today.toISOString().slice(0, 10);
  const wordEntry = getWordForDate(today, language);
  await logWordSeen(wordEntry.word);

  const activeLangMeta = LANG_META[language];

  return (
    <div className="min-h-screen bg-[#07070f]">
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 border-b border-white/8 bg-[#07070f]/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4 sm:px-6">
          {/* Logo + greeting */}
          <div className="flex items-center gap-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 shadow-lg shadow-emerald-500/30">
              <Zap className="h-4 w-4 text-white" aria-hidden="true" />
            </span>
            <div className="leading-tight">
              <p className="text-xs text-slate-500">Welcome back,</p>
              <p className="text-sm font-bold text-white">{displayName}</p>
            </div>
          </div>

          {/* Right controls */}
          <div className="flex flex-wrap items-center gap-2">
            {langProfiles.length >= 2 && (
              <LanguageSwitcher profiles={langProfiles} activeLanguage={language} />
            )}

            {langProfiles.length === 1 && profile && (
              <span className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-slate-300">
                <span aria-hidden="true">{activeLangMeta.flag}</span>
                {activeLangMeta.label}
                <span className="rounded-md bg-emerald-500/20 px-1.5 py-0.5 text-emerald-400">
                  {profile.cefr_level}
                </span>
              </span>
            )}

            <Link
              href="/settings"
              className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-slate-400 transition hover:border-white/20 hover:text-white"
            >
              <Settings className="h-3.5 w-3.5" aria-hidden="true" />
              Settings
            </Link>

            <form action={logout}>
              <button
                type="submit"
                className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-slate-400 transition hover:border-red-500/30 hover:text-red-400"
              >
                <LogOut className="h-3.5 w-3.5" aria-hidden="true" />
                Sign out
              </button>
            </form>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
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

          {/* Add language buttons */}
          {addableLanguages.length > 0 && (
            <div className="ml-auto flex gap-2">
              {addableLanguages.map((lang) => (
                <a
                  key={lang}
                  href={LANG_META[lang].assessmentHref}
                  className="flex items-center gap-2 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-sm font-bold text-emerald-400 shadow-lg shadow-emerald-500/10 transition hover:border-emerald-400/50 hover:bg-emerald-500/20"
                >
                  <Plus className="h-4 w-4" aria-hidden="true" />
                  Add {LANG_META[lang].label}
                </a>
              ))}
            </div>
          )}
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
      </main>
    </div>
  );
}
