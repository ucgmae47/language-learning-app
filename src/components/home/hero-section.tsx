import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";

const LANGUAGES = [
  {
    flag: "🇪🇸",
    name: "Spanish",
    tutor: "Lucía",
    tagline: "500M+ native speakers worldwide",
    href: "/assessment/es",
    gradient: "from-orange-500 via-red-500 to-rose-600",
    glow: "shadow-orange-500/40",
    hoverGlow: "hover:shadow-orange-400/60",
    badge: "🔥 Most popular",
  },
  {
    flag: "🇫🇷",
    name: "French",
    tutor: "Sophie",
    tagline: "Spoken across 5 continents, 29 countries",
    href: "/assessment/fr",
    gradient: "from-blue-500 via-indigo-500 to-violet-600",
    glow: "shadow-blue-500/40",
    hoverGlow: "hover:shadow-blue-400/60",
    badge: "✨ Now available",
  },
] as const;

const STATS = [
  { value: "A1–C2", label: "All CEFR levels" },
  { value: "2", label: "Languages" },
  { value: "5+", label: "Learning modes" },
  { value: "AI", label: "Powered tutors" },
];

export function HeroSection() {
  return (
    <section
      id="languages"
      className="relative overflow-hidden px-4 pb-20 pt-16 sm:px-6 sm:pt-20 lg:px-8"
    >
      {/* Background orbs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-40 -top-40 h-96 w-96 rounded-full bg-emerald-500/10 blur-3xl" />
        <div className="absolute -right-40 top-20 h-96 w-96 rounded-full bg-violet-500/10 blur-3xl" />
        <div className="absolute bottom-0 left-1/2 h-64 w-96 -translate-x-1/2 rounded-full bg-cyan-500/8 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-5xl">
        {/* Badge */}
        <div className="mb-8 flex justify-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-1.5 text-xs font-semibold text-emerald-400">
            <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
            Adaptive · AI-Powered · Gamified
          </span>
        </div>

        {/* Headline */}
        <h1 className="mx-auto max-w-4xl text-center text-5xl font-black tracking-tight text-white sm:text-6xl lg:text-7xl">
          Level up your{" "}
          <span className="bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
            language skills
          </span>
        </h1>
        <p className="mx-auto mt-6 max-w-xl text-center text-lg leading-8 text-slate-400">
          Take a 5-minute CEFR assessment and unlock a fully personalized
          learning experience — stories, AI tutors, drills, and daily
          challenges that adapt to you.
        </p>

        {/* Stats strip */}
        <div className="mx-auto mt-10 flex max-w-2xl flex-wrap justify-center gap-6 sm:gap-10">
          {STATS.map((stat) => (
            <div key={stat.label} className="flex flex-col items-center gap-0.5">
              <span className="text-2xl font-black text-white">{stat.value}</span>
              <span className="text-xs font-medium text-slate-500">{stat.label}</span>
            </div>
          ))}
        </div>

        {/* Language cards */}
        <div className="mt-14 grid gap-6 sm:grid-cols-2">
          {LANGUAGES.map((lang) => (
            <Link
              key={lang.name}
              href={lang.href}
              className={`group relative flex flex-col overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-8 shadow-2xl ${lang.glow} ${lang.hoverGlow} backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-white/20 hover:shadow-2xl`}
            >
              {/* Gradient top bar */}
              <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${lang.gradient}`} />

              {/* Badge */}
              <span className="mb-6 w-fit rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white/80">
                {lang.badge}
              </span>

              {/* Flag + name */}
              <div className="flex items-center gap-4">
                <span className="text-6xl drop-shadow-lg" aria-hidden="true">
                  {lang.flag}
                </span>
                <div>
                  <h2 className="text-3xl font-black text-white">{lang.name}</h2>
                  <p className="text-sm text-slate-400">{lang.tagline}</p>
                </div>
              </div>

              {/* Tutor */}
              <p className="mt-5 text-sm text-slate-400">
                Practice with{" "}
                <span className="font-semibold text-white">{lang.tutor}</span>,
                your AI conversation partner
              </p>

              {/* CTA */}
              <div
                className={`mt-6 flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r ${lang.gradient} py-3.5 text-sm font-bold text-white shadow-lg transition-all group-hover:gap-3`}
              >
                Start {lang.name} assessment
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
              </div>
            </Link>
          ))}
        </div>

        <p className="mt-8 text-center text-sm text-slate-500">
          Already have an account?{" "}
          <Link href="/login" className="font-semibold text-emerald-400 hover:text-emerald-300 hover:underline">
            Sign in →
          </Link>
        </p>
      </div>
    </section>
  );
}
