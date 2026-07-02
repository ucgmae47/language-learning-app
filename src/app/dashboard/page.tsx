import { redirect } from "next/navigation";
import Link from "next/link";
import { LogOut, BookText, Puzzle, MessageCircle, Plus, BookOpen, Layers, Settings } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { logout } from "@/app/actions/auth";
import { logWordSeen } from "@/app/actions/word-of-the-day";
import { WordOfTheDay } from "@/components/dashboard/word-of-the-day";
import { LanguageSwitcher } from "@/components/dashboard/language-switcher";
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

  const [profileResult, langProfilesResult] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).single<Profile>(),
    supabase
      .from("language_profiles")
      .select("*")
      .eq("user_id", user.id)
      .returns<LanguageProfile[]>(),
  ]);

  const profile = profileResult.data;
  const langProfiles: LanguageProfile[] = langProfilesResult.data ?? [];
  const language: Language = profile?.language ?? "es";
  const displayName =
    profile?.display_name ?? user.user_metadata?.display_name ?? "Learner";

  // Determine which languages the user can still add.
  const takenLanguages = new Set(langProfiles.map((lp) => lp.language));
  const addableLanguages = ALL_LANGUAGES.filter((l) => !takenLanguages.has(l));

  const today = new Date();
  const todayStr = today.toISOString().slice(0, 10);
  const wordEntry = getWordForDate(today, language);

  await logWordSeen(wordEntry.word);

  const activeLangMeta = LANG_META[language];

  const quickLinks = [
    {
      href: "/stories",
      label: "Today's Story",
      icon: BookText,
      color: "bg-emerald-50 text-emerald-700",
    },
    {
      href: "/crossword",
      label: "Daily Crossword",
      icon: Puzzle,
      color: "bg-sky-50 text-sky-700",
    },
    {
      href: "/chat",
      label: "Chat Practice",
      icon: MessageCircle,
      color: "bg-violet-50 text-violet-700",
    },
    {
      href: "/drills",
      label: "Grammar Drills",
      icon: BookOpen,
      color: "bg-indigo-50 text-indigo-700",
    },
    {
      href: "/flashcards",
      label: "Idiom Flashcards",
      icon: Layers,
      color: "bg-pink-50 text-pink-700",
    },
  ] as const;

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-emerald-100 bg-white">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between gap-3 px-4 sm:px-6">
          <div>
            <p className="text-sm text-slate-500">Welcome back,</p>
            <p className="font-semibold text-slate-900">{displayName}</p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Language switcher (only shown when user has 2+ languages) */}
            {langProfiles.length >= 2 && (
              <LanguageSwitcher
                profiles={langProfiles}
                activeLanguage={language}
              />
            )}

            {/* Single-language badge (when only 1 language taken) */}
            {langProfiles.length === 1 && profile && (
              <span className="flex items-center gap-1 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-700">
                <span aria-hidden="true">{activeLangMeta.flag}</span>
                {activeLangMeta.label} · {profile.cefr_level}
              </span>
            )}

            <Link
              href="/settings"
              className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-600 transition hover:border-slate-300 hover:text-slate-800"
            >
              <Settings className="h-4 w-4" aria-hidden="true" />
              Settings
            </Link>

            <form action={logout}>
              <button
                type="submit"
                className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-600 transition hover:border-red-200 hover:text-red-600"
              >
                <LogOut className="h-4 w-4" aria-hidden="true" />
                Sign out
              </button>
            </form>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
        {/* Stats row */}
        <div className="mb-8 flex flex-wrap items-center gap-4">
          <div className="rounded-2xl bg-emerald-600 px-5 py-4 text-white shadow-sm">
            <p className="text-xs font-medium opacity-80">Current streak</p>
            <p className="mt-0.5 text-3xl font-bold">
              {profile?.streak_count ?? 0}
              <span className="ml-1 text-sm font-medium opacity-80">days</span>
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
            <p className="text-xs font-medium text-slate-500">Stories read</p>
            <p className="mt-0.5 text-3xl font-bold text-slate-900">
              {profile?.stories_read ?? 0}
            </p>
          </div>

          {/* Add a language button */}
          {addableLanguages.length > 0 && (
            <div className="ml-auto flex gap-2">
              {addableLanguages.map((lang) => (
                <a
                  key={lang}
                  href={LANG_META[lang].assessmentHref}
                  className="flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700 shadow-sm transition hover:bg-emerald-100"
                >
                  <Plus className="h-4 w-4" aria-hidden="true" />
                  Add {LANG_META[lang].label}
                </a>
              ))}
            </div>
          )}
        </div>

        {/* Word of the Day */}
        <div className="mb-8">
          <WordOfTheDay entry={wordEntry} date={todayStr} />
        </div>

        {/* Quick-launch cards */}
        <h2 className="mb-4 text-lg font-semibold text-slate-900">
          What would you like to do?
        </h2>

        <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {quickLinks.map((link) => {
            const Icon = link.icon;
            return (
              <a
                key={link.label}
                href={link.href}
                className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-md"
              >
                <span
                  className={`flex h-10 w-10 items-center justify-center rounded-xl ${link.color}`}
                >
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </span>
                <span className="text-sm font-medium text-slate-800">
                  {link.label}
                </span>
              </a>
            );
          })}
        </div>

        {/* Retake assessment link */}
        <p className="mt-6 text-center text-xs text-slate-400">
          Want to retest your {activeLangMeta.flag} {activeLangMeta.label} level?{" "}
          <a
            href={activeLangMeta.assessmentHref}
            className="text-emerald-700 hover:underline"
          >
            Retake the assessment
          </a>
        </p>
      </main>
    </div>
  );
}
