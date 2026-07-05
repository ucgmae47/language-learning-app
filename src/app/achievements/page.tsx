import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Trophy } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { AchievementsGrid } from "@/components/achievements/achievements-grid";
import { getUnlockedAchievements } from "@/app/actions/achievements";
import type { Profile } from "@/lib/supabase/types";

export default async function AchievementsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single<Profile>();

  const displayName =
    profile?.display_name ?? user.user_metadata?.display_name ?? "Learner";

  const unlocked = await getUnlockedAchievements();
  const unlockedIds = unlocked.map((u) => u.achievement_id);

  return (
    <div className="min-h-screen bg-[#07070f]">
      {/* Header */}
      <header className="sticky top-0 z-20 flex items-center justify-between border-b border-white/8 bg-gradient-to-r from-[#0d0d1e] to-[#12122a] px-6 py-4">
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard"
            className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-300 transition hover:bg-white/10 hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Dashboard
          </Link>

          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-yellow-600 shadow-lg shadow-amber-500/30">
              <Trophy className="h-4 w-4 text-white" aria-hidden="true" />
            </div>
            <div>
              <h1 className="text-lg font-extrabold leading-none text-white">
                Achievements
              </h1>
              <p className="text-xs text-slate-400">Your milestones and badges</p>
            </div>
          </div>
        </div>

        <div className="text-sm text-slate-400">
          Signed in as{" "}
          <span className="font-semibold text-amber-400">{displayName}</span>
        </div>
      </header>

      {/* Main */}
      <main className="mx-auto max-w-2xl px-4 py-8">
        <AchievementsGrid unlockedIds={unlockedIds} />
      </main>
    </div>
  );
}
