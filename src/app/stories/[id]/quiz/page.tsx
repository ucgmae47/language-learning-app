import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { StoryQuiz } from "@/components/stories/story-quiz";
import type { Story, StoryAttempt } from "@/lib/supabase/types";

type Props = { params: Promise<{ id: string }> };

export const metadata: Metadata = { title: "Story Quiz | LinguaPath" };

export default async function StoryQuizPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: story } = await supabase
    .from("stories")
    .select("id, title, quiz")
    .eq("id", id)
    .eq("user_id", user.id)
    .single<Pick<Story, "id" | "title" | "quiz">>();

  if (!story) notFound();

  // If already attempted, redirect back to the story reader.
  const { data: attempt } = await supabase
    .from("story_attempts")
    .select("id")
    .eq("story_id", id)
    .eq("user_id", user.id)
    .single<Pick<StoryAttempt, "id">>();

  if (attempt) redirect(`/stories/${id}`);

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-10 sm:px-6">
      <div className="mx-auto max-w-xl">
        <Link
          href={`/stories/${id}`}
          className="mb-8 inline-flex items-center gap-1.5 text-sm text-slate-500 transition hover:text-slate-800"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Back to story
        </Link>

        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-900">Comprehension Quiz</h1>
          <p className="mt-1 text-sm text-slate-600">
            &ldquo;{story.title}&rdquo; · {story.quiz.length} questions
          </p>
        </div>

        <StoryQuiz storyId={story.id} questions={story.quiz} />
      </div>
    </div>
  );
}
