import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { PlannerClient } from "@/components/planner/planner-client";
import type { Language, Profile, LanguageProfile, UserInterest, GrammarWeakness } from "@/lib/supabase/types";

export default async function PlannerPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [profileResult, langProfileResult, interestsResult, weaknessResult] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).single<Profile>(),
    supabase
      .from("language_profiles")
      .select("*")
      .eq("user_id", user.id)
      .limit(1)
      .returns<LanguageProfile[]>(),
    supabase
      .from("user_interests")
      .select("*")
      .eq("user_id", user.id)
      .order("weight", { ascending: false })
      .limit(5)
      .returns<UserInterest[]>(),
    supabase
      .from("grammar_weaknesses")
      .select("*")
      .eq("user_id", user.id)
      .order("error_count", { ascending: false })
      .limit(5)
      .returns<GrammarWeakness[]>(),
  ]);

  const profile = profileResult.data;
  const language: Language = profile?.language ?? "es";
  const displayName =
    profile?.display_name ?? user.user_metadata?.display_name ?? "Learner";
  const cefrLevel =
    langProfileResult.data?.[0]?.cefr_level ?? profile?.cefr_level ?? "B1";

  const interests = (interestsResult.data ?? []).map((i) => i.topic);
  const weakAreas = (weaknessResult.data ?? []).map((w) => w.concept);

  return (
    <div className="min-h-screen bg-[#07070f]">
      <header className="sticky top-0 z-20 flex items-center justify-between border-b border-white/8 bg-gradient-to-r from-[#0d0d1e] to-[#12122a] px-6 py-4">
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard"
            className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-300 transition hover:bg-white/10 hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Dashboard
          </Link>

          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-lg shadow-emerald-500/30">
              <span className="text-base" aria-hidden="true">📋</span>
            </div>
            <div>
              <h1 className="text-lg font-extrabold leading-none text-white">Lesson Planner</h1>
              <p className="text-xs text-slate-400">Your personalized weekly study plan</p>
            </div>
          </div>
        </div>

        <div className="text-sm text-slate-400">
          <span className="font-semibold text-emerald-400">{cefrLevel}</span>
          {" · "}
          <span className="font-semibold text-slate-300">{displayName}</span>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 py-8">
        <PlannerClient
          language={language}
          cefrLevel={cefrLevel}
          weakAreas={weakAreas}
          interests={interests}
        />
      </main>
    </div>
  );
}
