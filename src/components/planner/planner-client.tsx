"use client";

import { useState } from "react";
import { Loader2, Sparkles } from "lucide-react";
import type { Language } from "@/lib/supabase/types";

type DayPlan = {
  day: string;
  focus: string;
  activities: { feature: string; duration_minutes: number; description: string }[];
  tip: string;
};

type PlannerResult = {
  week_theme: string;
  daily_plans: string;
  weekly_goals: string;
  motivation: string;
};

type ParsedPlan = {
  week_theme: string;
  daily_plans: DayPlan[];
  weekly_goals: string[];
  motivation: string;
};

type Props = {
  language: Language;
  cefrLevel: string;
  weakAreas: string[];
  interests: string[];
};

const MINUTES_OPTIONS = [15, 30, 45, 60];

const INTEREST_OPTIONS = [
  { value: "food", label: "Food & Cooking" },
  { value: "travel", label: "Travel" },
  { value: "sports", label: "Sports" },
  { value: "technology", label: "Technology" },
  { value: "culture", label: "Culture & Arts" },
  { value: "music", label: "Music" },
  { value: "film", label: "Film & TV" },
  { value: "science", label: "Science" },
  { value: "business", label: "Business" },
  { value: "history", label: "History" },
];

const DAY_GRADIENTS = [
  "from-violet-500 to-purple-600",
  "from-blue-500 to-cyan-600",
  "from-emerald-500 to-green-600",
  "from-amber-500 to-orange-600",
  "from-pink-500 to-rose-600",
  "from-indigo-500 to-blue-600",
  "from-teal-500 to-emerald-600",
];

function PlanSkeleton() {
  return (
    <div className="flex flex-col gap-4 animate-pulse">
      <div className="h-8 w-2/3 rounded-xl bg-white/6" />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {Array.from({ length: 7 }).map((_, i) => (
          <div key={i} className="rounded-2xl border border-white/8 bg-white/4 p-4 h-40" />
        ))}
      </div>
    </div>
  );
}

export function PlannerClient({ language, cefrLevel, weakAreas, interests: defaultInterests }: Props) {
  const [availableMinutes, setAvailableMinutes] = useState(30);
  const [selectedInterests, setSelectedInterests] = useState<string[]>(defaultInterests.slice(0, 3));
  const [plan, setPlan] = useState<ParsedPlan | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingMsg, setLoadingMsg] = useState("");

  const langName = language === "es" ? "Spanish" : "French";

  function toggleInterest(value: string) {
    setSelectedInterests((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value],
    );
  }

  async function generate() {
    setIsLoading(true);
    setError(null);
    setPlan(null);
    const messages = [
      "Analyzing your learning profile…",
      "Crafting personalized activities…",
      "Balancing your schedule…",
      "Finalizing your week…",
    ];
    let msgIdx = 0;
    setLoadingMsg(messages[0]!);
    const interval = setInterval(() => {
      msgIdx = (msgIdx + 1) % messages.length;
      setLoadingMsg(messages[msgIdx]!);
    }, 2000);

    try {
      const res = await fetch("/api/planner", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          language,
          cefrLevel,
          weakAreas,
          interests: selectedInterests,
          availableMinutes,
        }),
      });
      if (!res.ok) throw new Error("Failed to generate plan");
      const raw = (await res.json()) as PlannerResult;

      let dailyPlans: DayPlan[] = [];
      try {
        dailyPlans = JSON.parse(raw.daily_plans) as DayPlan[];
      } catch {
        dailyPlans = [];
      }

      const goals = raw.weekly_goals
        .split("\n")
        .map((g) => g.trim())
        .filter(Boolean);

      setPlan({
        week_theme: raw.week_theme,
        daily_plans: dailyPlans,
        weekly_goals: goals,
        motivation: raw.motivation,
      });
    } catch {
      setError("Couldn't generate your plan. Please try again.");
    } finally {
      clearInterval(interval);
      setIsLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Settings */}
      {!plan && !isLoading && (
        <div className="rounded-2xl border border-white/8 bg-white/4 p-5 flex flex-col gap-5">
          <p className="text-sm font-bold text-white">
            Customize your {langName} study plan
          </p>

          {/* Minutes */}
          <div>
            <p className="text-xs text-slate-400 mb-2">Available minutes per day</p>
            <div className="flex gap-2">
              {MINUTES_OPTIONS.map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setAvailableMinutes(m)}
                  className={`flex-1 rounded-xl border py-2.5 text-sm font-bold transition ${
                    availableMinutes === m
                      ? "border-violet-500/60 bg-violet-500/20 text-violet-200"
                      : "border-white/10 bg-white/4 text-slate-400 hover:bg-white/8"
                  }`}
                >
                  {m}m
                </button>
              ))}
            </div>
          </div>

          {/* Interests */}
          <div>
            <p className="text-xs text-slate-400 mb-2">Your interests (select up to 5)</p>
            <div className="flex flex-wrap gap-2">
              {INTEREST_OPTIONS.map(({ value, label }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => toggleInterest(value)}
                  disabled={!selectedInterests.includes(value) && selectedInterests.length >= 5}
                  className={`rounded-xl border px-3 py-1.5 text-xs font-medium transition disabled:opacity-40 ${
                    selectedInterests.includes(value)
                      ? "border-violet-500/60 bg-violet-500/20 text-violet-200"
                      : "border-white/10 bg-white/4 text-slate-400 hover:bg-white/8"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {weakAreas.length > 0 && (
            <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 px-3 py-2.5">
              <p className="text-xs font-bold text-amber-400 mb-1">Areas to improve</p>
              <p className="text-xs text-amber-200/80">{weakAreas.join(", ")}</p>
            </div>
          )}

          <button
            type="button"
            onClick={() => void generate()}
            className="flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-violet-500 to-purple-600 py-3 text-sm font-bold text-white shadow-lg shadow-violet-500/30 transition hover:scale-[1.02] active:scale-95"
          >
            <Sparkles className="h-4 w-4" aria-hidden="true" />
            Generate My Plan
          </button>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {error}
          <button
            type="button"
            onClick={() => { setError(null); setPlan(null); }}
            className="ml-3 underline text-red-300"
          >
            Try again
          </button>
        </div>
      )}

      {/* Loading */}
      {isLoading && (
        <div className="flex flex-col items-center gap-4 py-12">
          <Loader2 className="h-10 w-10 animate-spin text-violet-400" aria-hidden="true" />
          <p className="text-sm text-slate-400">{loadingMsg}</p>
          <PlanSkeleton />
        </div>
      )}

      {/* Plan result */}
      {plan && !isLoading && (
        <div className="flex flex-col gap-5">
          {/* Theme + motivation */}
          <div className="rounded-2xl border border-violet-500/20 bg-violet-500/10 p-5">
            <p className="text-xs font-bold text-violet-400 mb-1">This Week&apos;s Theme</p>
            <p className="text-xl font-extrabold text-white">{plan.week_theme}</p>
            <p className="mt-3 text-sm text-violet-200/90 leading-relaxed">{plan.motivation}</p>
          </div>

          {/* Weekly goals */}
          <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-4">
            <p className="text-xs font-bold text-emerald-400 mb-3">Weekly Goals</p>
            <ul className="flex flex-col gap-2">
              {plan.weekly_goals.map((goal, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-emerald-200/90">
                  <span className="mt-0.5 shrink-0 text-emerald-400">✓</span>
                  {goal}
                </li>
              ))}
            </ul>
          </div>

          {/* Day cards */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {plan.daily_plans.map((day, idx) => (
              <div key={idx} className="rounded-2xl border border-white/8 overflow-hidden">
                <div className={`bg-gradient-to-r ${DAY_GRADIENTS[idx % DAY_GRADIENTS.length]} px-4 py-3`}>
                  <p className="font-extrabold text-white">{day.day}</p>
                  <p className="text-xs text-white/70">{day.focus}</p>
                </div>
                <div className="bg-white/3 px-4 py-3 flex flex-col gap-2.5">
                  {day.activities?.map((act, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <span className="mt-0.5 shrink-0 rounded-lg bg-white/8 px-1.5 py-0.5 text-xs font-bold text-slate-400">
                        {act.duration_minutes}m
                      </span>
                      <div>
                        <p className="text-xs font-bold text-white">{act.feature}</p>
                        <p className="text-xs text-slate-400">{act.description}</p>
                      </div>
                    </div>
                  ))}
                  {day.tip && (
                    <div className="mt-1 rounded-xl border border-white/8 bg-white/5 px-3 py-2">
                      <p className="text-xs text-slate-400">
                        <span className="font-bold text-white">💡 </span>
                        {day.tip}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Regenerate */}
          <button
            type="button"
            onClick={() => { setPlan(null); setError(null); }}
            className="flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 py-3 text-sm font-bold text-slate-300 transition hover:bg-white/10"
          >
            <Sparkles className="h-4 w-4" aria-hidden="true" />
            Adjust Settings &amp; Regenerate
          </button>
        </div>
      )}
    </div>
  );
}
