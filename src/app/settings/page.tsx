import { redirect } from "next/navigation";
import Link from "next/link";
import { Settings, ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { SettingsForm } from "@/components/settings/settings-form";
import { isInterestTopic } from "@/lib/interests/topics";
import type {
  InterestTopic,
  Language,
  LanguageProfile,
  Profile,
} from "@/lib/supabase/types";

export const metadata = { title: "Settings — LinguaPath" };

export default async function SettingsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login?next=/settings");

  const [profileResult, langProfilesResult, interestsResult] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).single<Profile>(),
    supabase
      .from("language_profiles")
      .select("*")
      .eq("user_id", user.id)
      .returns<LanguageProfile[]>(),
    supabase
      .from("user_interests")
      .select("topic")
      .eq("user_id", user.id)
      .returns<{ topic: string }[]>(),
  ]);

  const profile = profileResult.data;
  const langProfiles: LanguageProfile[] = langProfilesResult.data ?? [];
  const assessedLanguages = langProfiles.map((lp) => ({
    language: lp.language,
    cefr_level: lp.cefr_level,
  }));

  // Fallback: if language_profiles is empty but profile has a language, still show it.
  if (
    assessedLanguages.length === 0 &&
    profile?.language &&
    profile.cefr_level
  ) {
    assessedLanguages.push({
      language: profile.language,
      cefr_level: profile.cefr_level,
    });
  }

  const selectedInterests: InterestTopic[] = (interestsResult.data ?? [])
    .map((row) => row.topic)
    .filter(isInterestTopic);

  const displayName =
    profile?.display_name ?? user.user_metadata?.display_name ?? "";
  const activeLanguage: Language = profile?.language ?? "es";
  const wotdEmails: boolean = user.user_metadata?.wotd_emails !== false; // default on

  return (
    <main className="min-h-screen bg-[#07070f]">
      <div className="mx-auto max-w-xl px-4 py-10">
        <Link
          href="/dashboard"
          className="mb-8 inline-flex items-center gap-1.5 text-sm text-slate-400 transition hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          Dashboard
        </Link>

        <div className="mb-8 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 text-white shadow-sm">
            <Settings className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-3xl font-black text-white">⚙️ Settings</h1>
            <p className="text-sm text-slate-400">Manage your profile and preferences</p>
          </div>
        </div>

        <SettingsForm
          displayName={displayName}
          email={user.email ?? ""}
          wotdEmails={wotdEmails}
          activeLanguage={activeLanguage}
          assessedLanguages={assessedLanguages}
          selectedInterests={selectedInterests}
        />
      </div>
    </main>
  );
}
