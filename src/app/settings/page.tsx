import { redirect } from "next/navigation";
import Link from "next/link";
import { Settings, ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { SettingsForm } from "@/components/settings/settings-form";
import type { Language, LanguageProfile, Profile } from "@/lib/supabase/types";

export const metadata = { title: "Settings — LinguaPath" };

export default async function SettingsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login?next=/settings");

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
  const assessedLanguages: Language[] = langProfiles.map((lp) => lp.language);

  const displayName =
    profile?.display_name ?? user.user_metadata?.display_name ?? "";
  const activeLanguage: Language = profile?.language ?? "es";
  const wotdEmails: boolean = user.user_metadata?.wotd_emails !== false; // default on

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-xl px-4 py-10">
        {/* Back link */}
        <Link
          href="/dashboard"
          className="mb-8 inline-flex items-center gap-1.5 text-sm text-slate-500 transition hover:text-slate-800"
        >
          <ArrowLeft className="h-4 w-4" />
          Dashboard
        </Link>

        {/* Header */}
        <div className="mb-8 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-700 text-white shadow-sm">
            <Settings className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Settings</h1>
            <p className="text-sm text-slate-500">Manage your profile and preferences</p>
          </div>
        </div>

        <SettingsForm
          displayName={displayName}
          email={user.email ?? ""}
          wotdEmails={wotdEmails}
          activeLanguage={activeLanguage}
          assessedLanguages={assessedLanguages}
        />
      </div>
    </main>
  );
}
