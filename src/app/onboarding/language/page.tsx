import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { LanguagePicker } from "@/components/onboarding/language-picker";
import type { Language } from "@/lib/supabase/types";

export const metadata: Metadata = {
  title: "Choose Your Language | LinguaPath",
};

export default async function LanguagePage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // If the user has already set a non-default language, skip this step.
  // (Default "es" is always set; we check if they've passed through onboarding
  // by looking for user_interests instead, so we always show this screen once.)
  const { data: existing } = await supabase
    .from("user_interests")
    .select("id")
    .eq("user_id", user.id)
    .limit(1);

  // If they already have interests, they've completed onboarding — go to dashboard.
  if (existing && existing.length > 0) redirect("/dashboard");

  const { data: profile } = await supabase
    .from("profiles")
    .select("language")
    .eq("id", user.id)
    .single();

  const currentLanguage = (profile?.language as Language | null) ?? "es";

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-4 py-16">
      <div className="w-full max-w-2xl">
        {/* Progress indicator */}
        <div className="mb-8 flex items-center justify-center gap-2">
          <span className="h-2 w-8 rounded-full bg-emerald-500" />
          <span className="h-2 w-8 rounded-full bg-emerald-500" />
          <span className="h-2 w-8 rounded-full bg-slate-200" />
        </div>

        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-slate-900">
            Which language are you learning?
          </h1>
          <p className="mt-3 text-slate-500">
            Your choice personalises every part of LinguaPath — stories, chat,
            vocabulary, and daily exercises.
          </p>
        </div>

        <LanguagePicker initialLanguage={currentLanguage} />
      </div>
    </div>
  );
}
