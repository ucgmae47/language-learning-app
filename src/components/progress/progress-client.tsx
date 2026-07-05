"use client";

import { Flame, BookOpen, BarChart3, CheckCircle, BookMarked, PenLine } from "lucide-react";

type ProgressStats = {
  profile: {
    display_name: string;
    streak_count: number;
    stories_read: number;
    cefr_level: string;
  };
  storyAttempts: { count: number; avg_score: number };
  journalEntries: { count: number };
  sentenceAttempts: { count: number; correct: number };
  vocabStats: { total: number; mastered: number };
  recentActivity: { date: string; label: string; emoji: string }[];
};

const CEFR_COLORS: Record<string, string> = {
  A1: "from-slate-600 to-slate-500",
  A2: "from-blue-700 to-blue-500",
  B1: "from-teal-700 to-teal-500",
  B2: "from-emerald-700 to-emerald-500",
  C1: "from-purple-700 to-purple-500",
  C2: "from-amber-600 to-yellow-500",
};

const MILESTONES = [
  { label: "First story", threshold: 1 },
  { label: "5 stories", threshold: 5 },
  { label: "10 stories", threshold: 10 },
  { label: "25 stories", threshold: 25 },
  { label: "50 stories", threshold: 50 },
  { label: "100 stories", threshold: 100 },
];

function StatCard({
  icon,
  label,
  value,
  sub,
  accent,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  sub?: string;
  accent?: string;
}) {
  return (
    <div className="flex flex-col gap-2 rounded-2xl border border-white/8 bg-white/4 px-4 py-4 backdrop-blur-sm">
      <div className="flex items-center gap-2">
        <span className={`${accent ?? "text-slate-400"}`}>{icon}</span>
        <span className="text-xs font-medium text-slate-500">{label}</span>
      </div>
      <p className={`text-3xl font-extrabold leading-none ${accent ?? "text-white"}`}>
        {value}
      </p>
      {sub && <p className="text-xs text-slate-500">{sub}</p>}
    </div>
  );
}

export function ProgressClient({ stats }: { stats: ProgressStats }) {
  const { profile, storyAttempts, journalEntries, sentenceAttempts, vocabStats, recentActivity } =
    stats;

  const sentenceAccuracy =
    sentenceAttempts.count > 0
      ? Math.round((sentenceAttempts.correct / sentenceAttempts.count) * 100)
      : 0;

  const cefrGradient = CEFR_COLORS[profile.cefr_level] ?? "from-slate-600 to-slate-500";

  return (
    <div className="flex flex-col gap-8">
      {/* Hero: CEFR level badge */}
      <div className="flex flex-col items-center gap-3 rounded-3xl border border-white/8 bg-gradient-to-br from-white/4 to-white/2 py-10 text-center">
        <p className="text-sm font-semibold text-slate-400">Current Level</p>
        <div
          className={`flex h-28 w-28 items-center justify-center rounded-full bg-gradient-to-br ${cefrGradient} shadow-2xl`}
        >
          <span className="text-4xl font-black text-white">{profile.cefr_level}</span>
        </div>
        <p className="text-lg font-bold text-white">{profile.display_name}</p>
        <p className="text-sm text-slate-400">
          {profile.streak_count > 0 ? (
            <>
              <span className="mr-1 text-orange-400">🔥</span>
              <span className="font-semibold text-orange-300">{profile.streak_count}-day streak</span>
            </>
          ) : (
            "Start your streak today!"
          )}
        </p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-3">
        <StatCard
          icon={<Flame className="h-4 w-4" />}
          label="Current Streak"
          value={profile.streak_count}
          sub="days in a row"
          accent="text-orange-400"
        />
        <StatCard
          icon={<BookOpen className="h-4 w-4" />}
          label="Stories Read"
          value={profile.stories_read}
          sub={`${storyAttempts.count} quizzes taken`}
          accent="text-blue-400"
        />
        <StatCard
          icon={<BarChart3 className="h-4 w-4" />}
          label="Quiz Average"
          value={`${storyAttempts.avg_score}%`}
          sub={`across ${storyAttempts.count} attempts`}
          accent="text-purple-400"
        />
        <StatCard
          icon={<CheckCircle className="h-4 w-4" />}
          label="Sentences"
          value={`${sentenceAccuracy}%`}
          sub={`${sentenceAttempts.correct}/${sentenceAttempts.count} correct`}
          accent="text-emerald-400"
        />
        <StatCard
          icon={<BookMarked className="h-4 w-4" />}
          label="Vocabulary"
          value={vocabStats.total}
          sub={`${vocabStats.mastered} mastered`}
          accent="text-teal-400"
        />
        <StatCard
          icon={<PenLine className="h-4 w-4" />}
          label="Journal Entries"
          value={journalEntries.count}
          sub="written entries"
          accent="text-pink-400"
        />
      </div>

      {/* Learning Journey milestones */}
      <div className="rounded-2xl border border-white/8 bg-white/4 px-5 py-5">
        <h3 className="mb-4 text-sm font-bold text-white">Learning Journey</h3>
        <div className="relative flex items-center justify-between">
          {/* connecting line */}
          <div className="absolute inset-x-0 top-4 h-0.5 bg-white/10" />
          {MILESTONES.map((m, i) => {
            const reached = profile.stories_read >= m.threshold;
            return (
              <div key={i} className="relative flex flex-col items-center gap-1.5 z-10">
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-full border-2 transition-all ${
                    reached
                      ? "border-emerald-500 bg-emerald-500 shadow-lg shadow-emerald-500/30"
                      : "border-white/20 bg-[#07070f]"
                  }`}
                >
                  {reached ? (
                    <CheckCircle className="h-4 w-4 text-white" />
                  ) : (
                    <span className="text-xs font-bold text-slate-600">{i + 1}</span>
                  )}
                </div>
                <span
                  className={`text-center text-[10px] leading-tight ${
                    reached ? "text-emerald-400" : "text-slate-600"
                  }`}
                >
                  {m.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent Activity */}
      {recentActivity.length > 0 && (
        <div className="rounded-2xl border border-white/8 bg-white/4 px-5 py-5">
          <h3 className="mb-4 text-sm font-bold text-white">Recent Activity</h3>
          <div className="flex flex-col gap-2">
            {recentActivity.map((item, i) => (
              <div
                key={i}
                className="flex items-center gap-3 rounded-xl border border-white/5 bg-white/3 px-3 py-2.5"
              >
                <span className="text-lg" aria-hidden="true">
                  {item.emoji}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="truncate text-sm text-slate-300">{item.label}</p>
                </div>
                <time className="shrink-0 text-xs text-slate-600">
                  {new Date(item.date).toLocaleDateString(undefined, {
                    month: "short",
                    day: "numeric",
                  })}
                </time>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
