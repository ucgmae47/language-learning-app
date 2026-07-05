import Link from "next/link";
import { LogOut, Settings, Zap } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { logout } from "@/app/actions/auth";
import {
  LanguageControl,
  type OwnedLanguage,
} from "@/components/dashboard/language-control";
import type { CefrLevel, Language, LanguageProfile, Profile } from "@/lib/supabase/types";

const ALL_LANGUAGES: Language[] = ["es", "fr"];

function buildOwnedLanguages(
  langProfiles: LanguageProfile[],
  profile: Profile | null,
): OwnedLanguage[] {
  const map = new Map<Language, CefrLevel>();

  for (const lp of langProfiles) {
    map.set(lp.language, lp.cefr_level);
  }

  if (profile?.language && !map.has(profile.language)) {
    map.set(profile.language, profile.cefr_level);
  }

  return Array.from(map.entries()).map(([language, cefr_level]) => ({
    language,
    cefr_level,
  }));
}

export async function SiteHeader() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <header className="sticky top-0 z-50 border-b border-white/8 bg-[#07070f]/90 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 shadow-lg shadow-emerald-500/30">
              <Zap className="h-5 w-5 text-white" aria-hidden="true" />
            </span>
            <div className="leading-tight">
              <p className="text-sm font-bold text-white">LinguaPath</p>
              <p className="text-xs text-emerald-400">Personalized Learning</p>
            </div>
          </Link>

          <Link
            href="/login"
            className="text-sm font-medium text-slate-400 transition hover:text-white"
          >
            Sign in
          </Link>
        </div>
      </header>
    );
  }

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

  const ownedLanguages = buildOwnedLanguages(langProfiles, profile ?? null);
  const takenLanguages = new Set<Language>(ownedLanguages.map((lp) => lp.language));
  const addableLanguages = ALL_LANGUAGES.filter((l) => !takenLanguages.has(l));

  return (
    <header className="sticky top-0 z-50 border-b border-white/8 bg-[#07070f]/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
        <Link href="/dashboard" className="flex shrink-0 items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 shadow-lg shadow-emerald-500/30">
            <Zap className="h-5 w-5 text-white" aria-hidden="true" />
          </span>
          <div className="hidden leading-tight sm:block">
            <p className="text-sm font-bold text-white">LinguaPath</p>
            <p className="text-xs text-emerald-400">Personalized Learning</p>
          </div>
        </Link>

        <div className="flex min-w-0 flex-1 items-center justify-end gap-2 sm:gap-3">
          <div className="hidden min-w-0 text-right leading-tight md:block">
            <p className="text-xs text-slate-500">Welcome back,</p>
            <p className="truncate text-sm font-bold text-white">{displayName}</p>
          </div>

          <LanguageControl
            ownedLanguages={ownedLanguages}
            activeLanguage={language}
            addableLanguages={addableLanguages}
          />

          <Link
            href="/settings"
            aria-label="Settings"
            title="Settings"
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-slate-400 transition hover:border-white/20 hover:text-white"
          >
            <Settings className="h-4 w-4" aria-hidden="true" />
          </Link>

          <form action={logout}>
            <button
              type="submit"
              aria-label="Sign out"
              title="Sign out"
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-slate-400 transition hover:border-red-500/30 hover:text-red-400"
            >
              <LogOut className="h-4 w-4" aria-hidden="true" />
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}
