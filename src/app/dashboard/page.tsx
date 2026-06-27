import { redirect } from "next/navigation";
import { LogOut, BookText, Puzzle, MessageCircle, Brain } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { logout } from "@/app/actions/auth";
import { logWordSeen } from "@/app/actions/word-of-the-day";
import { WordOfTheDay } from "@/components/dashboard/word-of-the-day";
import { getWordForDate } from "@/lib/word-of-the-day/bank";
import type { Profile } from "@/lib/supabase/types";

const quickLinks = [
  {
    href: "/stories",
    label: "Today's Story",
    icon: BookText,
    color: "bg-emerald-50 text-emerald-700",
  },
  {
    href: "#",
    label: "Daily Puzzle",
    icon: Puzzle,
    color: "bg-sky-50 text-sky-700",
  },
  {
    href: "/chat",
    label: "Chat Practice",
    icon: MessageCircle,
    color: "bg-violet-50 text-violet-700",
  },
  {
    href: "/assessment",
    label: "CEFR Assessment",
    icon: Brain,
    color: "bg-amber-50 text-amber-700",
  },
] as const;

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const today = new Date();
  const todayStr = today.toISOString().slice(0, 10);
  const wordEntry = getWordForDate(today);

  const [profileResult] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).single<Profile>(),
    logWordSeen(wordEntry.word),
  ]);

  const profile = profileResult.data;
  const displayName =
    profile?.display_name ?? user.user_metadata?.display_name ?? "Learner";

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-emerald-100 bg-white">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4 sm:px-6">
          <div>
            <p className="text-sm text-slate-500">Welcome back,</p>
            <p className="font-semibold text-slate-900">{displayName}</p>
          </div>
          <div className="flex items-center gap-4">
            {profile && (
              <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800">
                {profile.cefr_level}
              </span>
            )}
            <form action={logout}>
              <button
                type="submit"
                className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-600 transition hover:border-red-200 hover:text-red-600"
              >
                <LogOut className="h-4 w-4" aria-hidden="true" />
                Sign out
              </button>
            </form>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
        {/* Stats row */}
        <div className="mb-8 flex items-center gap-4">
          <div className="rounded-2xl bg-emerald-600 px-5 py-4 text-white shadow-sm">
            <p className="text-xs font-medium opacity-80">Current streak</p>
            <p className="mt-0.5 text-3xl font-bold">
              {profile?.streak_count ?? 0}
              <span className="ml-1 text-sm font-medium opacity-80">days</span>
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
            <p className="text-xs font-medium text-slate-500">Stories read</p>
            <p className="mt-0.5 text-3xl font-bold text-slate-900">
              {profile?.stories_read ?? 0}
            </p>
          </div>
        </div>

        {/* Word of the Day */}
        <div className="mb-8">
          <WordOfTheDay entry={wordEntry} date={todayStr} />
        </div>

        {/* Quick-launch cards */}
        <h2 className="mb-4 text-lg font-semibold text-slate-900">
          What would you like to do?
        </h2>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {quickLinks.map((link) => {
            const Icon = link.icon;
            return (
              <a
                key={link.label}
                href={link.href}
                className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-md"
              >
                <span
                  className={`flex h-10 w-10 items-center justify-center rounded-xl ${link.color}`}
                >
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </span>
                <span className="text-sm font-medium text-slate-800">
                  {link.label}
                </span>
              </a>
            );
          })}
        </div>
      </main>
    </div>
  );
}
