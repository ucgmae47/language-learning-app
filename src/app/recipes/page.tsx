import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { RecipeClient } from "@/components/recipes/recipe-client";
import type { Language, Profile, LanguageProfile } from "@/lib/supabase/types";

export default async function RecipesPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [profileResult, langProfileResult] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).single<Profile>(),
    supabase
      .from("language_profiles")
      .select("*")
      .eq("user_id", user.id)
      .limit(1)
      .returns<LanguageProfile[]>(),
  ]);

  const profile = profileResult.data;
  const language: Language = profile?.language ?? "es";
  const displayName =
    profile?.display_name ?? user.user_metadata?.display_name ?? "Learner";
  const cefrLevel =
    langProfileResult.data?.[0]?.cefr_level ?? profile?.cefr_level ?? "B1";

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
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500 to-red-600 shadow-lg shadow-orange-500/30">
              <span className="text-base" aria-hidden="true">🍳</span>
            </div>
            <div>
              <h1 className="text-lg font-extrabold leading-none text-white">Recipe Explorer</h1>
              <p className="text-xs text-slate-400">Cook and learn with authentic recipes</p>
            </div>
          </div>
        </div>

        <div className="text-sm text-slate-400">
          <span className="font-semibold text-orange-400">{cefrLevel}</span>
          {" · "}
          <span className="font-semibold text-slate-300">{displayName}</span>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 py-8">
        <RecipeClient language={language} cefrLevel={cefrLevel} />
      </main>
    </div>
  );
}
