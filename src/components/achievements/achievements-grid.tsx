"use client";

import { Lock } from "lucide-react";
import { ACHIEVEMENTS } from "@/lib/achievements";
import type { Achievement } from "@/lib/achievements";

type Props = {
  unlockedIds: string[];
};

const CATEGORY_LABELS: Record<Achievement["category"], string> = {
  reading: "Reading",
  vocabulary: "Vocabulary",
  social: "Social",
  streak: "Streak",
  mastery: "Mastery",
};

const CATEGORY_ORDER: Achievement["category"][] = [
  "streak",
  "reading",
  "vocabulary",
  "mastery",
  "social",
];

const CATEGORY_COLORS: Record<Achievement["category"], string> = {
  streak: "text-orange-400",
  reading: "text-blue-400",
  vocabulary: "text-emerald-400",
  mastery: "text-purple-400",
  social: "text-pink-400",
};

export function AchievementsGrid({ unlockedIds }: Props) {
  const unlockedSet = new Set(unlockedIds);

  const byCategory = CATEGORY_ORDER.reduce<
    Record<Achievement["category"], Achievement[]>
  >(
    (acc, cat) => {
      acc[cat] = Object.values(ACHIEVEMENTS).filter((a) => a.category === cat);
      return acc;
    },
    {} as Record<Achievement["category"], Achievement[]>,
  );

  const unlockedCount = Object.values(ACHIEVEMENTS).filter((a) => unlockedSet.has(a.id)).length;
  const totalCount = Object.values(ACHIEVEMENTS).length;

  return (
    <div className="flex flex-col gap-8">
      {/* Summary */}
      <div className="flex flex-col items-center gap-2 rounded-3xl border border-white/8 bg-white/4 py-8 text-center">
        <p className="text-5xl font-black text-white">
          {unlockedCount}
          <span className="text-2xl text-slate-500">/{totalCount}</span>
        </p>
        <p className="text-sm text-slate-400">Achievements Unlocked</p>
        <div className="mt-2 h-2 w-48 overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all"
            style={{ width: `${(unlockedCount / totalCount) * 100}%` }}
          />
        </div>
      </div>

      {/* Categories */}
      {CATEGORY_ORDER.map((category) => {
        const achievements = byCategory[category];
        if (!achievements?.length) return null;

        return (
          <div key={category} className="flex flex-col gap-3">
            <h3
              className={`text-xs font-bold uppercase tracking-widest ${CATEGORY_COLORS[category]}`}
            >
              {CATEGORY_LABELS[category]}
            </h3>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {achievements.map((achievement) => {
                const unlocked = unlockedSet.has(achievement.id);
                return (
                  <div
                    key={achievement.id}
                    className={`relative flex flex-col items-center gap-2 rounded-2xl border px-3 py-4 text-center transition ${
                      unlocked
                        ? "border-white/12 bg-white/6"
                        : "border-white/5 bg-white/2 opacity-50 grayscale"
                    }`}
                  >
                    {!unlocked && (
                      <div className="absolute right-2 top-2">
                        <Lock className="h-3 w-3 text-slate-600" />
                      </div>
                    )}
                    <span className="text-3xl" aria-hidden="true">
                      {achievement.emoji}
                    </span>
                    <div>
                      <p
                        className={`text-xs font-bold leading-tight ${
                          unlocked ? "text-white" : "text-slate-600"
                        }`}
                      >
                        {achievement.label}
                      </p>
                      <p
                        className={`mt-0.5 text-[10px] leading-snug ${
                          unlocked ? "text-slate-400" : "text-slate-700"
                        }`}
                      >
                        {achievement.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
