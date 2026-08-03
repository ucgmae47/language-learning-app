import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { QuizClient } from "@/components/assessment/quiz-client";
import { QUESTIONS_FR } from "@/lib/assessment/questions-fr";

export const metadata: Metadata = {
  title: "French Proficiency Assessment | LinguaPath",
  description: "Find out your French CEFR level in about 5 minutes.",
};

export default async function FrenchAssessmentPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isAuthenticated = !!user;

  return (
    <div className="min-h-screen bg-[#07070f] px-4 py-10 sm:px-6">
      <div className="mx-auto max-w-xl">
        <Link
          href={isAuthenticated ? "/dashboard" : "/"}
          className="mb-8 inline-flex items-center gap-1.5 text-sm text-slate-400 transition hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          {isAuthenticated ? "Back to dashboard" : "Back to home"}
        </Link>

        <div className="mb-8">
          <div className="mb-3 flex items-center gap-3">
            <span className="text-4xl" aria-hidden="true">🇫🇷</span>
            <h1 className="text-3xl font-black text-white">
              French Assessment
            </h1>
          </div>
          <p className="text-sm text-slate-400">
            {QUESTIONS_FR.length} questions · A1 to C2 · takes about 5 minutes.
            Prefer &ldquo;Not sure&rdquo; over guessing, and finish early if it gets too hard.
          </p>
        </div>

        <QuizClient questions={QUESTIONS_FR} language="fr" isAuthenticated={isAuthenticated} />
      </div>
    </div>
  );
}
