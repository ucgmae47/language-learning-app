import Link from "next/link";
import { ArrowRight, Sparkles, BookOpen, MessageCircle, Puzzle } from "lucide-react";

const LANGUAGES = [
  {
    flag: "🇪🇸",
    name: "Spanish",
    tagline: "The world's second most-spoken native language",
    tutor: "Practice with Lucía, your conversational AI tutor",
    href: "/assessment/es",
    accent: "border-orange-200 hover:border-orange-400",
    badge: "bg-orange-50 text-orange-700",
    cta: "bg-orange-500 hover:bg-orange-600",
  },
  {
    flag: "🇫🇷",
    name: "French",
    tagline: "Spoken across 5 continents in 29 countries",
    tutor: "Practice with Sophie, your conversational AI tutor",
    href: "/assessment/fr",
    accent: "border-blue-200 hover:border-blue-400",
    badge: "bg-blue-50 text-blue-700",
    cta: "bg-blue-600 hover:bg-blue-700",
  },
] as const;

const FEATURES = [
  { icon: BookOpen, text: "AI-generated stories tailored to your level" },
  { icon: MessageCircle, text: "Conversational practice with your personal tutor" },
  { icon: Puzzle, text: "Daily crosswords and vocabulary exercises" },
];

export function HeroSection() {
  return (
    <section className="relative overflow-hidden px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
      {/* Background gradients */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(16,185,129,0.15),_transparent_45%),radial-gradient(circle_at_bottom_left,_rgba(14,165,233,0.10),_transparent_40%)]" />

      <div className="relative mx-auto max-w-5xl">
        {/* Badge */}
        <div className="mb-6 flex justify-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-800">
            <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
            Adaptive · Personalised · Free
          </span>
        </div>

        {/* Headline */}
        <h1 className="mx-auto max-w-3xl text-center text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
          Learn a language through stories, conversation, and daily habits.
        </h1>
        <p className="mx-auto mt-5 max-w-xl text-center text-lg leading-8 text-slate-600">
          Take a 5-minute CEFR assessment and get a fully personalised experience
          — AI stories, a chatbot tutor, crosswords, and a daily word that adapts
          to your level and interests.
        </p>

        {/* Feature bullets */}
        <div className="mx-auto mt-6 flex max-w-lg flex-wrap justify-center gap-4">
          {FEATURES.map(({ icon: Icon, text }) => (
            <span key={text} className="flex items-center gap-1.5 text-sm text-slate-500">
              <Icon className="h-4 w-4 text-emerald-500 shrink-0" aria-hidden="true" />
              {text}
            </span>
          ))}
        </div>

        {/* ── Language selection cards ────────────────────────────── */}
        <div className="mt-12 grid gap-6 sm:grid-cols-2">
          {LANGUAGES.map((lang) => (
            <div
              key={lang.name}
              className={`group relative flex flex-col rounded-3xl border-2 bg-white p-8 shadow-sm transition duration-200 hover:shadow-lg ${lang.accent}`}
            >
              {/* Flag + badge */}
              <div className="mb-4 flex items-start justify-between">
                <span className="text-5xl" aria-hidden="true">{lang.flag}</span>
                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${lang.badge}`}>
                  Available now
                </span>
              </div>

              {/* Language name */}
              <h2 className="text-2xl font-bold text-slate-900">{lang.name}</h2>
              <p className="mt-1 text-sm text-slate-500">{lang.tagline}</p>

              {/* Tutor note */}
              <p className="mt-3 text-sm text-slate-600">{lang.tutor}</p>

              {/* CTA */}
              <Link
                href={lang.href}
                className={`mt-6 flex items-center justify-center gap-2 rounded-full py-3 text-sm font-semibold text-white shadow-sm transition ${lang.cta}`}
              >
                Start {lang.name} assessment
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </div>
          ))}
        </div>

        <p className="mt-6 text-center text-xs text-slate-400">
          Already have an account?{" "}
          <Link href="/login" className="text-emerald-700 hover:underline">
            Sign in
          </Link>{" "}
          to continue where you left off.
        </p>
      </div>
    </section>
  );
}
