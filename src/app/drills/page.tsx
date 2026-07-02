import { redirect } from "next/navigation";
import { BookOpen, Zap } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { DrillSessionClient } from "@/components/drills/drill-session-client";
import { QUESTIONS_ES } from "@/lib/drills/questions-es";
import { QUESTIONS_FR } from "@/lib/drills/questions-fr";
import type { Language, GrammarWeakness } from "@/lib/supabase/types";

export const metadata = { title: "Grammar Drills — LinguaPath" };

export default async function DrillsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login?next=/drills");

  const [profileResult, weaknessResult] = await Promise.all([
    supabase
      .from("profiles")
      .select("language, cefr_level, display_name")
      .eq("id", user.id)
      .single(),
    supabase
      .from("grammar_weaknesses")
      .select("*")
      .eq("user_id", user.id)
      .order("last_seen", { ascending: false }),
  ]);

  const language: Language = profileResult.data?.language ?? "es";
  const weaknesses: GrammarWeakness[] = (weaknessResult.data ?? []) as GrammarWeakness[];

  const questions = language === "es" ? QUESTIONS_ES : QUESTIONS_FR;
  const flag = language === "es" ? "🇪🇸" : "🇫🇷";
  const langName = language === "es" ? "Spanish" : "French";

  const topWeak = weaknesses
    .filter((w) => w.attempt_count > 0)
    .sort((a, b) => b.error_count / b.attempt_count - a.error_count / a.attempt_count)
    .slice(0, 3);

  return (
    <main className="min-h-screen bg-[#07070f]">
      <div className="mx-auto max-w-2xl px-4 py-10">
        {/* Header */}
        <div className="mb-8 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-rose-500 to-red-600 shadow-lg shadow-rose-500/30">
            <BookOpen className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-black text-white">
              ⚡ Grammar Drills
            </h1>
            <p className="text-sm text-slate-400">
              {flag} {langName} · powered by Groq AI
            </p>
          </div>
        </div>

        {/* Weak areas banner */}
        {topWeak.length > 0 && (
          <div className="mb-6 rounded-2xl border border-amber-500/20 bg-amber-500/10 p-4">
            <div className="mb-2 flex items-center gap-2">
              <Zap className="h-4 w-4 text-amber-400" />
              <p className="text-sm font-bold text-amber-300">Focus areas for you</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {topWeak.map((w) => (
                <span
                  key={w.concept}
                  className="rounded-xl bg-amber-500/20 px-2.5 py-0.5 text-xs font-semibold text-amber-300"
                >
                  {w.concept.split("-").slice(1).join(" ")} ·{" "}
                  {Math.round((w.error_count / w.attempt_count) * 100)}% error rate
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Drill engine */}
        <DrillSessionClient
          language={language}
          questions={questions}
          weaknesses={weaknesses}
        />
      </div>
    </main>
  );
}
