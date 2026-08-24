import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { StoryPageShell } from "@/components/stories/story-page-shell";
import { applyFunctionWordGlosses } from "@/lib/stories/complete-word-translations";
import type { Story, StoryAttempt, StoryProgress } from "@/lib/supabase/types";

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

  // RLS allows own stories or shared library rows (is_library = true).
  const { data: story } = await supabase
    .from("stories")
    .select("*")
    .eq("id", id)
    .single<Story>();

  if (!story) notFound();
  if (!story.is_library && story.user_id !== user.id) notFound();

  // Incomplete stories are never user-facing — hide until translations exist.
  if (!story.sentence_translations?.length) {
    redirect("/stories");
  }

  const [{ data: attempt }, { data: progress }] = await Promise.all([
    supabase
      .from("story_attempts")
      .select("score")
      .eq("story_id", id)
      .eq("user_id", user.id)
      .maybeSingle<Pick<StoryAttempt, "score">>(),
    supabase
      .from("story_progress")
      .select("sentence_index, finished, percent_read")
      .eq("story_id", id)
      .eq("user_id", user.id)
      .maybeSingle<
        Pick<StoryProgress, "sentence_index" | "finished" | "percent_read">
      >(),
  ]);

  const readingMins = story.word_count
    ? Math.max(1, Math.round(story.word_count / 180))
    : null;

  const language = story.language ?? "es";
  const words = applyFunctionWordGlosses(
    story.body,
    story.word_translations ?? {},
    language,
  );

  return (
    <StoryPageShell
      title={story.title}
      cefrLevel={story.cefr_level}
      language={language}
      topics={story.topics}
      readingMins={readingMins}
      body={story.body}
      translations={
        story.sentence_translations?.length
          ? {
              sentences: story.sentence_translations,
              words,
            }
          : null
      }
      storyId={story.id}
      attemptScore={attempt?.score ?? null}
      initialSentenceIndex={progress?.sentence_index ?? 0}
      initialFinished={progress?.finished ?? false}
    />
  );
}
