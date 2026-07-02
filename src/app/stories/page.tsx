import { redirect } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { ArrowLeft, BookOpen, Clock } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { StoryGenerator } from "@/components/stories/story-generator";
import type { Story } from "@/lib/supabase/types";

export const metadata: Metadata = {
  title: "Stories | LinguaPath",
};

export default async function StoriesPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: stories } = await supabase
    .from("stories")
    .select("id, title, cefr_level, topics, word_count, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(20)
    .returns<
      Pick<Story, "id" | "title" | "cefr_level" | "topics" | "word_count" | "created_at">[]
    >();

  return (
    <div className="min-h-screen bg-[#07070f] px-4 py-10 sm:px-6">
      <div className="mx-auto max-w-3xl">
        <Link
          href="/dashboard"
          className="mb-8 inline-flex items-center gap-1.5 text-sm text-slate-400 transition hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Back to dashboard
        </Link>

        <div className="mb-8">
          <h1 className="text-3xl font-black text-white">📖 Your Stories</h1>
          <p className="mb-6 mt-1 text-sm text-slate-400">
            AI-generated reading passages personalised to your level and interests.
          </p>
          <StoryGenerator />
        </div>

        {!stories || stories.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-white/15 bg-white/5 p-12 text-center">
            <BookOpen className="mx-auto h-10 w-10 text-slate-600" />
            <p className="mt-4 font-bold text-slate-300">No stories yet</p>
            <p className="mt-1 text-sm text-slate-500">
              Hit &ldquo;Generate new story&rdquo; to create your first personalised passage.
            </p>
          </div>
        ) : (
          <ul className="flex flex-col gap-3">
            {stories.map((story) => {
              const date = new Date(story.created_at).toLocaleDateString(
                "en-US",
                { month: "short", day: "numeric", year: "numeric" },
              );
              const readingMins = story.word_count
                ? Math.max(1, Math.round(story.word_count / 180))
                : null;

              return (
                <li key={story.id}>
                  <Link
                    href={`/stories/${story.id}`}
                    className="flex items-center justify-between gap-4 rounded-2xl border border-white/8 bg-white/5 p-5 transition hover:-translate-y-0.5 hover:border-violet-500/30 hover:bg-white/8 hover:shadow-lg hover:shadow-violet-500/10"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-bold text-white">
                        {story.title}
                      </p>
                      <div className="mt-1.5 flex flex-wrap items-center gap-2">
                        <span className="rounded-lg bg-violet-500/20 px-2 py-0.5 text-xs font-bold text-violet-300">
                          {story.cefr_level}
                        </span>
                        {story.topics.slice(0, 2).map((t) => (
                          <span
                            key={t}
                            className="rounded-lg border border-white/8 bg-white/5 px-2 py-0.5 text-xs text-slate-400 capitalize"
                          >
                            {t}
                          </span>
                        ))}
                        {readingMins && (
                          <span className="flex items-center gap-1 text-xs text-slate-500">
                            <Clock className="h-3 w-3" />
                            {readingMins} min read
                          </span>
                        )}
                      </div>
                    </div>
                    <span className="shrink-0 text-xs text-slate-500">{date}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
