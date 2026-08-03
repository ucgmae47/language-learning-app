import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, AlertCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { fetchSummarizedNews } from "@/app/actions/news";
import { NewsCard } from "@/components/news/news-card";
import type { Language, LanguageProfile, Profile } from "@/lib/supabase/types";

const LANG_META: Record<Language, { name: string; flag: string }> = {
  es: { name: "Spanish", flag: "🇪🇸" },
  fr: { name: "French", flag: "🇫🇷" },
};

export default async function NewsPage() {
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
  const cefrLevel =
    langProfileResult.data?.[0]?.cefr_level ?? profile?.cefr_level ?? "B1";

  const meta = LANG_META[language];

  const { articles, error } = await fetchSummarizedNews(language, cefrLevel);

  return (
    <div className="min-h-screen bg-[#07070f]">
      {/* Sit below the global site header (h-16 / z-50) so Dashboard stays clickable */}
      <header className="sticky top-16 z-40 border-b border-white/8 bg-gradient-to-r from-[#0d0d1e] to-[#12122a] px-6 py-4">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/dashboard"
              prefetch
              className="relative z-50 flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-300 transition hover:bg-white/10 hover:text-white"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              Dashboard
            </Link>
            <div className="flex items-center gap-2">
              <span className="text-2xl" aria-hidden="true">🌍</span>
              <div>
                <h1 className="text-lg font-extrabold leading-none text-white">
                  Language News
                </h1>
                <p className="text-xs text-slate-400">
                  Today&apos;s headlines summarised in {meta.flag} {meta.name} at {cefrLevel} level
                </p>
              </div>
            </div>
          </div>

          <div className="hidden sm:flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2">
            <span className="text-lg" aria-hidden="true">{meta.flag}</span>
            <span className="text-sm font-semibold text-white">{meta.name}</span>
            <span className="rounded-md bg-emerald-500/20 px-1.5 py-0.5 text-[10px] font-bold text-emerald-400">
              {cefrLevel}
            </span>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-10">
        {/* ── Error / no-key state ────────────────────────────────────────── */}
        {error && (
          <div className="mb-8 flex flex-col items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.03] px-6 py-12 text-center">
            <AlertCircle className="h-8 w-8 text-slate-600" aria-hidden="true" />
            <div>
              <p className="font-semibold text-slate-200">News unavailable</p>
              <p className="mt-1 text-sm text-slate-400">{error}</p>
              {error.includes("NEWS_API_KEY") && (
                <p className="mt-3 text-xs text-slate-500">
                  Add your free key from{" "}
                  <a
                    href="https://newsapi.org/register"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline hover:text-slate-300"
                  >
                    newsapi.org/register
                  </a>{" "}
                  to <code className="rounded bg-white/10 px-1">.env.local</code> as{" "}
                  <code className="rounded bg-white/10 px-1">NEWS_API_KEY</code>.
                </p>
              )}
            </div>
            <Link
              href="/dashboard"
              className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-slate-200 transition hover:bg-white/10"
            >
              Back to Dashboard
            </Link>
          </div>
        )}

        {/* ── Article grid ────────────────────────────────────────────────── */}
        {articles.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {articles.map((article, i) => (
              <NewsCard key={i} article={article} language={language} />
            ))}
          </div>
        ) : !error ? (
          <div className="flex flex-col items-center justify-center gap-4 py-24 text-center">
            <span className="text-5xl" aria-hidden="true">📰</span>
            <p className="text-lg font-bold text-white">No articles found</p>
            <p className="text-sm text-slate-400">Try refreshing the page in a moment.</p>
          </div>
        ) : null}

        {/* ── Refresh note ────────────────────────────────────────────────── */}
        {articles.length > 0 && (
          <p className="mt-8 text-center text-xs text-slate-600">
            Headlines refresh every 30 minutes · Summaries adapted for {cefrLevel} level {meta.name}
          </p>
        )}
      </main>
    </div>
  );
}
