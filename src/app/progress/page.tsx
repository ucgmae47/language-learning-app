import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, TrendingUp } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { ProgressClient } from "@/components/progress/progress-client";
import { getProgressStats } from "@/app/actions/progress";

export default async function ProgressPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const stats = await getProgressStats();
  if (!stats) redirect("/login");

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
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 shadow-lg shadow-purple-500/30">
              <TrendingUp className="h-4 w-4 text-white" aria-hidden="true" />
            </div>
            <div>
              <h1 className="text-lg font-extrabold leading-none text-white">Progress</h1>
              <p className="text-xs text-slate-400">Your learning journey</p>
            </div>
          </div>
        </div>

        <div className="text-sm text-slate-400">
          Signed in as{" "}
          <span className="font-semibold text-purple-400">{stats.profile.display_name}</span>
        </div>
      </header>

      {/* Main */}
      <main className="mx-auto max-w-2xl px-4 py-8">
        <ProgressClient stats={stats} />
      </main>
    </div>
  );
}
