import { redirect } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { QuizClient } from "@/components/assessment/quiz-client";
import { QUESTIONS } from "@/lib/assessment/questions";

export const metadata: Metadata = {
  title: "CEFR Assessment | LinguaPath",
  description: "Find out your Spanish proficiency level.",
};

export default async function AssessmentPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-10 sm:px-6">
      <div className="mx-auto max-w-xl">
        <Link
          href="/dashboard"
          className="mb-8 inline-flex items-center gap-1.5 text-sm text-slate-500 transition hover:text-slate-800"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Back to dashboard
        </Link>

        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-900">
            Spanish Proficiency Assessment
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            {QUESTIONS.length} questions · A2 to B2 · takes about 5 minutes.
            Answer honestly — there are no penalties for guessing.
          </p>
        </div>

        <QuizClient />
      </div>
    </div>
  );
}
