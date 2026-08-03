import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { CalendarClient } from "@/components/calendar/calendar-client";
import type { Language, Profile, LanguageProfile } from "@/lib/supabase/types";

async function fetchInitialEvents(language: Language, year: number, month: number) {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    const res = await fetch(
      `${baseUrl}/api/calendar/events?language=${language}&year=${year}&month=${month}`,
      { next: { revalidate: 86400 } },
    );
    if (!res.ok) return null;
    return (await res.json()) as { events: unknown[]; month_note: string };
  } catch {
    return null;
  }
}

export default async function CalendarPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [profileResult, langProfileResult] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).single<Profile>(),
    supabase
      .from("language_profiles")
      .select("*")
      .eq("user_id", user.id)
      .limit(1)
      .returns<LanguageProfile[]>(),
  ]);

  const profile = profileResult.data;
  const language: Language = profile?.language ?? "es";
  const displayName =
    profile?.display_name ?? user.user_metadata?.display_name ?? "Learner";
  const cefrLevel =
    langProfileResult.data?.[0]?.cefr_level ?? profile?.cefr_level ?? "B1";

  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;

  const initialData = await fetchInitialEvents(language, year, month);

  return (
    <div className="min-h-screen bg-[#07070f]">
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
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-cyan-600 shadow-lg shadow-blue-500/30">
              <span className="text-base" aria-hidden="true">📅</span>
            </div>
            <div>
              <h1 className="text-lg font-extrabold leading-none text-white">Cultural Calendar</h1>
              <p className="text-xs text-slate-400">Holidays & festivals worldwide</p>
            </div>
          </div>
        </div>

        <div className="text-sm text-slate-400">
          <span className="font-semibold text-blue-400">{cefrLevel}</span>
          {" · "}
          <span className="font-semibold text-slate-300">{displayName}</span>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 py-8">
        <CalendarClient
          language={language}
          initialYear={year}
          initialMonth={month}
          initialData={initialData as { events: { date: string; name: string; country: string; emoji: string; description: string; type: "holiday" | "festival" | "cultural" }[]; month_note: string } | null}
        />
      </main>
    </div>
  );
}
