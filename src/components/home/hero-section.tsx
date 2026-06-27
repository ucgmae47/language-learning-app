import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";

export function HeroSection() {
  return (
    <section className="relative overflow-hidden px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(16,185,129,0.18),_transparent_45%),radial-gradient(circle_at_bottom_left,_rgba(14,165,233,0.12),_transparent_40%)]" />

      <div className="relative mx-auto max-w-6xl">
        <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-800">
          <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
          Adaptive learning for Spanish B1–B2
        </div>

        <div className="mt-6 grid gap-10 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
          <div>
            <h1 className="max-w-2xl text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
              Learn Spanish through stories, conversation, and daily habits.
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-8 text-slate-600">
              A personalized platform that adapts to your interests, tracks
              your progress, and keeps you engaged with reading, quizzes, and
              conversational practice.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="#assessment"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-emerald-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700"
              >
                Take CEFR assessment
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
              <Link
                href="#features"
                className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-700 transition hover:border-emerald-200 hover:text-emerald-700"
              >
                Explore features
              </Link>
            </div>
          </div>

          <div className="rounded-3xl border border-emerald-100 bg-white/80 p-6 shadow-xl shadow-emerald-100/40 backdrop-blur">
            <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">
              Today&apos;s focus
            </p>
            <p className="mt-3 text-2xl font-semibold text-slate-900">
              Word of the Day
            </p>
            <p className="mt-2 text-3xl font-bold text-emerald-700">
              perseverar
            </p>
            <p className="mt-1 text-sm text-slate-500">to persevere · verb</p>
            <p className="mt-4 rounded-2xl bg-slate-50 p-4 text-sm leading-6 text-slate-600">
              &ldquo;Si quieres dominar el español, debes{" "}
              <span className="font-medium text-emerald-700">perseverar</span>{" "}
              cada día.&rdquo;
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
