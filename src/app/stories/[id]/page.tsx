import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { ArrowLeft, Clock, ChevronRight } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import type { Story, StoryAttempt } from "@/lib/supabase/types";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const supabase = await createClient();
  const { data } = await supabase
    .from("stories")
    .select("title")
    .eq("id", id)
    .single<Pick<Story, "title">>();

  return { title: data ? `${data.title} | LinguaPath` : "Story | LinguaPath" };
}

export default async function StoryPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: story } = await supabase
    .from("stories")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .single<Story>();

  if (!story) notFound();

  const { data: attempt } = await supabase
    .from("story_attempts")
    .select("score")
    .eq("story_id", id)
    .eq("user_id", user.id)
    .single<Pick<StoryAttempt, "score">>();

  const readingMins = story.word_count
    ? Math.max(1, Math.round(story.word_count / 180))
    : null;

  const paragraphs = story.body
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean);

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-10 sm:px-6">
      <div className="mx-auto max-w-2xl">
        <Link
          href="/stories"
          className="mb-8 inline-flex items-center gap-1.5 text-sm text-slate-500 transition hover:text-slate-800"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          All stories
        </Link>

        {/* Header */}
        <div className="mb-6">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-800">
              {story.cefr_level}
            </span>
            {story.topics.slice(0, 3).map((t) => (
              <span
                key={t}
                className="rounded-full border border-slate-200 bg-white px-2.5 py-0.5 text-xs text-slate-500 capitalize"
              >
                {t}
              </span>
            ))}
            {readingMins && (
              <span className="flex items-center gap-1 text-xs text-slate-400">
                <Clock className="h-3 w-3" />
                {readingMins} min read
              </span>
            )}
          </div>
          <h1 className="text-2xl font-bold leading-snug text-slate-900 sm:text-3xl">
            {story.title}
          </h1>
        </div>

        {/* Story body */}
        <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          {paragraphs.map((para, i) => (
            <p
              key={i}
              className="mt-5 text-base leading-8 text-slate-800 first:mt-0"
            >
              {para}
            </p>
          ))}
        </article>

        {/* Quiz CTA */}
        <div className="mt-6">
          {attempt ? (
            <div className="flex items-center justify-between rounded-2xl border border-emerald-200 bg-emerald-50 px-6 py-4">
              <div>
                <p className="font-semibold text-emerald-900">Quiz completed</p>
                <p className="text-sm text-emerald-700">
                  You scored {attempt.score}/5 on this story.
                </p>
              </div>
              <Link
                href="/stories"
                className="rounded-full border border-emerald-300 bg-white px-4 py-2 text-sm font-medium text-emerald-800 transition hover:bg-emerald-100"
              >
                Read another
              </Link>
            </div>
          ) : (
            <Link
              href={`/stories/${story.id}/quiz`}
              className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-6 py-4 shadow-sm transition hover:border-emerald-300 hover:shadow-md"
            >
              <div>
                <p className="font-semibold text-slate-900">
                  Ready to test your comprehension?
                </p>
                <p className="text-sm text-slate-500">
                  5 questions · takes about 2 minutes
                </p>
              </div>
              <ChevronRight className="h-5 w-5 text-emerald-600" aria-hidden="true" />
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
