import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Trophy, Flame, BookOpen } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/lib/supabase/types";

type LeaderboardEntry = {
  id: string;
  display_name: string | null;
  streak_count: number;
  stories_read: number;
  cefr_level: string;
  score: number;
  rank: number;
};

const CEFR_COLORS: Record<string, string> = {
  A1: "bg-slate-700 text-slate-200",
  A2: "bg-blue-900 text-blue-200",
  B1: "bg-teal-900 text-teal-200",
  B2: "bg-emerald-900 text-emerald-200",
  C1: "bg-purple-900 text-purple-200",
  C2: "bg-amber-900 text-amber-200",
};

function rankStyle(rank: number) {
  if (rank === 1) return "bg-gradient-to-br from-yellow-400 to-amber-500 text-[#07070f]";
  if (rank === 2) return "bg-gradient-to-br from-slate-300 to-slate-400 text-[#07070f]";
  if (rank === 3) return "bg-gradient-to-br from-amber-700 to-amber-600 text-white";
  return "bg-white/8 text-slate-400";
}

function initials(name: string | null) {
  if (!name) return "?";
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function avatarColor(id: string) {
  const colors = [
    "from-pink-600 to-rose-500",
    "from-purple-600 to-indigo-500",
    "from-blue-600 to-cyan-500",
    "from-emerald-600 to-teal-500",
    "from-amber-600 to-yellow-500",
    "from-orange-600 to-red-500",
  ];
  const code = id.charCodeAt(0) + id.charCodeAt(id.length - 1);
  return colors[code % colors.length];
}

export default async function LeaderboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, display_name, streak_count, stories_read, cefr_level")
    .limit(50)
    .returns<Pick<Profile, "id" | "display_name" | "streak_count" | "stories_read" | "cefr_level">[]>();

  const raw = profiles ?? [];

  const ranked: LeaderboardEntry[] = raw
    .map((p) => ({
      ...p,
      score: p.streak_count * 10 + p.stories_read * 5,
    }))
    .sort((a, b) => b.score - a.score)
    .map((p, i) => ({ ...p, rank: i + 1 }));

  const currentUserRank = ranked.find((r) => r.id === user.id);

  const currentProfile = raw.find((p) => p.id === user.id);
  const displayName =
    currentProfile?.display_name ?? user.user_metadata?.display_name ?? "Learner";

  return (
    <div className="min-h-screen bg-[#07070f]">
      {/* Header */}
      <header className="sticky top-16 z-40 flex items-center justify-between border-b border-white/8 bg-gradient-to-r from-[#0d0d1e] to-[#12122a] px-6 py-4">
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard"
            className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-300 transition hover:bg-white/10 hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Dashboard
          </Link>

          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-yellow-500 to-amber-600 shadow-lg shadow-yellow-500/30">
              <Trophy className="h-4 w-4 text-white" aria-hidden="true" />
            </div>
            <div>
              <h1 className="text-lg font-extrabold leading-none text-white">Leaderboard</h1>
              <p className="text-xs text-slate-400">Top learners this season</p>
            </div>
          </div>
        </div>

        <div className="text-sm text-slate-400">
          Signed in as{" "}
          <span className="font-semibold text-yellow-400">{displayName}</span>
        </div>
      </header>

      {/* Main */}
      <main className="mx-auto max-w-2xl px-4 py-8">
        <div className="flex flex-col gap-6">
          {/* Current user rank banner */}
          {currentUserRank && (
            <div className="flex items-center justify-between rounded-2xl border border-emerald-500/30 bg-emerald-500/8 px-4 py-4">
              <div className="flex items-center gap-3">
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br ${avatarColor(currentUserRank.id)} text-sm font-bold text-white shadow-lg`}
                >
                  {initials(currentUserRank.display_name)}
                </div>
                <div>
                  <p className="text-sm font-bold text-emerald-300">Your Rank</p>
                  <p className="text-xs text-slate-400">{currentUserRank.display_name ?? "You"}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-2xl font-extrabold text-white">
                  #{currentUserRank.rank}
                </p>
                <p className="text-xs text-slate-400">{currentUserRank.score} pts</p>
              </div>
            </div>
          )}

          {/* Score explanation */}
          <p className="text-xs text-slate-600">
            Score = streak × 10 + stories × 5
          </p>

          {/* Top 3 podium */}
          {ranked.length >= 1 && (
            <div className="grid grid-cols-3 gap-3">
              {([ranked[1], ranked[0], ranked[2]] as (LeaderboardEntry | undefined)[])
                .filter((e): e is LeaderboardEntry => e !== undefined)
                .map((entry, podiumIdx) => {
                const podiumRank = podiumIdx === 0 ? 2 : podiumIdx === 1 ? 1 : 3;
                const height = podiumRank === 1 ? "h-28" : podiumRank === 2 ? "h-20" : "h-16";
                const isMe = entry.id === user.id;

                return (
                  <div key={entry.id} className="flex flex-col items-center gap-2">
                    <div
                      className={`flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br ${avatarColor(entry.id)} text-sm font-bold text-white shadow-lg ${isMe ? "ring-2 ring-emerald-500" : ""}`}
                    >
                      {initials(entry.display_name)}
                    </div>
                    <p className="text-center text-xs font-semibold text-white truncate max-w-full px-1">
                      {entry.display_name ?? "Learner"}
                    </p>
                    <p className="text-xs text-slate-500">{entry.score} pts</p>
                    <div
                      className={`w-full ${height} flex items-end justify-center rounded-t-xl pb-2 ${
                        podiumRank === 1
                          ? "bg-gradient-to-b from-yellow-500/30 to-yellow-500/10 border border-yellow-500/30"
                          : podiumRank === 2
                          ? "bg-gradient-to-b from-slate-500/30 to-slate-500/10 border border-slate-500/30"
                          : "bg-gradient-to-b from-amber-700/30 to-amber-700/10 border border-amber-700/30"
                      }`}
                    >
                      <span className="text-2xl">
                        {podiumRank === 1 ? "🥇" : podiumRank === 2 ? "🥈" : "🥉"}
                      </span>
                    </div>
                  </div>
                );
                })}
            </div>
          )}

          {/* Full table */}
          <div className="flex flex-col gap-2">
            {ranked.map((entry) => {
              const isMe = entry.id === user.id;
              return (
                <div
                  key={entry.id}
                  className={`flex items-center gap-3 rounded-2xl border px-4 py-3 transition ${
                    isMe
                      ? "border-emerald-500/40 bg-emerald-500/8"
                      : "border-white/6 bg-white/3 hover:bg-white/5"
                  }`}
                >
                  {/* Rank badge */}
                  <div
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-extrabold ${rankStyle(entry.rank)}`}
                  >
                    {entry.rank <= 3 ? (
                      <span>{entry.rank === 1 ? "🥇" : entry.rank === 2 ? "🥈" : "🥉"}</span>
                    ) : (
                      entry.rank
                    )}
                  </div>

                  {/* Avatar */}
                  <div
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${avatarColor(entry.id)} text-xs font-bold text-white`}
                  >
                    {initials(entry.display_name)}
                  </div>

                  {/* Name + level */}
                  <div className="flex-1 min-w-0">
                    <p className={`truncate text-sm font-semibold ${isMe ? "text-emerald-300" : "text-white"}`}>
                      {entry.display_name ?? "Learner"}
                      {isMe && <span className="ml-1.5 text-xs text-emerald-500">(you)</span>}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span
                        className={`rounded-md px-1.5 py-0.5 text-[10px] font-bold ${CEFR_COLORS[entry.cefr_level] ?? "bg-slate-700 text-slate-200"}`}
                      >
                        {entry.cefr_level}
                      </span>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="shrink-0 flex items-center gap-3 text-xs text-slate-400">
                    <span className="flex items-center gap-1">
                      <Flame className="h-3 w-3 text-orange-400" />
                      {entry.streak_count}
                    </span>
                    <span className="flex items-center gap-1">
                      <BookOpen className="h-3 w-3 text-blue-400" />
                      {entry.stories_read}
                    </span>
                    <span className="font-bold text-white">{entry.score}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {ranked.length === 0 && (
            <div className="rounded-2xl border border-dashed border-white/10 py-16 text-center text-sm text-slate-500">
              No players on the leaderboard yet.
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
