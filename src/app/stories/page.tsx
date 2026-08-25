import { redirect } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { after } from "next/server";
import { ArrowLeft, Sparkles } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { StoryGenerator } from "@/components/stories/story-generator";
import {
  StoryLibraryClient,
  type LibraryStoryCard,
} from "@/components/stories/story-library-client";
import { generateQueuedStory } from "@/lib/stories/queue";
import { isPersonalStoryQueueEnabled } from "@/lib/stories/personal-queue-enabled";
import { pickNextRecommendedStory } from "@/lib/stories/next-recommendation";
import type {
  CefrLevel,
  Language,
  Story,
  StoryAttempt,
  StoryProgress,
} from "@/lib/supabase/types";

type QueuedStory = Pick<Story, "id" | "title" | "topics">;

type LibraryRow = Pick<
  Story,
  "id" | "title" | "cefr_level" | "topics" | "word_count" | "created_at"
>;

export const metadata: Metadata = {
  title: "Stories | LinguaPath",
};

export default async function StoriesPage() {
  const supabase = await createClient();
  const personalQueue = isPersonalStoryQueueEnabled();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const [{ data: profile }, { data: langProfiles }] = await Promise.all([
    supabase
      .from("profiles")
      .select("language, cefr_level")
      .eq("id", user.id)
      .single<{ language: Language; cefr_level: CefrLevel }>(),
    supabase
      .from("language_profiles")
      .select("cefr_level")
      .eq("user_id", user.id)
      .limit(1)
      .returns<{ cefr_level: CefrLevel }[]>(),
  ]);

  const language: Language = profile?.language ?? "es";
  const cefrLevel: CefrLevel =
    langProfiles?.[0]?.cefr_level ?? profile?.cefr_level ?? "B1";

  const { data: libraryStories } = await supabase
    .from("stories")
    .select("id, title, cefr_level, topics, word_count, created_at")
    .eq("is_library", true)
    .eq("language", language)
    .eq("is_queued", false)
    .not("sentence_translations", "is", null)
    .order("cefr_level", { ascending: true })
    .order("created_at", { ascending: false })
    .limit(100)
    .returns<LibraryRow[]>();

  const libraryRows = libraryStories ?? [];
  const storyIds = libraryRows.map((s) => s.id);

  const [progressRes, attemptsRes, genreRes] = storyIds.length
    ? await Promise.all([
        supabase
          .from("story_progress")
          .select("story_id, percent_read, finished, updated_at")
          .eq("user_id", user.id)
          .in("story_id", storyIds)
          .returns<
            Pick<
              StoryProgress,
              "story_id" | "percent_read" | "finished" | "updated_at"
            >[]
          >(),
        supabase
          .from("story_attempts")
          .select("story_id, score")
          .eq("user_id", user.id)
          .in("story_id", storyIds)
          .returns<Pick<StoryAttempt, "story_id" | "score">[]>(),
        supabase
          .from("genre_interests")
          .select("genre, weight")
          .eq("user_id", user.id)
          .eq("language", language)
          .returns<{ genre: string; weight: number }[]>(),
      ])
    : [{ data: [] }, { data: [] }, { data: [] }];

  const genreWeights = new Map(
    (genreRes.data ?? []).map((g) => [g.genre, g.weight]),
  );

  const progressByStory = new Map(
    (progressRes.data ?? []).map((p) => [p.story_id, p]),
  );
  const attemptByStory = new Map(
    (attemptsRes.data ?? []).map((a) => [a.story_id, a]),
  );

  const stories: LibraryStoryCard[] = libraryRows.map((story) => {
    const progress = progressByStory.get(story.id);
    const attempt = attemptByStory.get(story.id);
    return {
      ...story,
      percent_read:
        progress && progress.percent_read > 0 ? progress.percent_read : null,
      quiz_percent:
        attempt != null ? Math.round((attempt.score / 5) * 100) : null,
    };
  });

  // Free plan (and anytime the personal queue isn't the primary CTA): nudge
  // toward one clear next library story so learners don't stall on choice.
  const recommended = pickNextRecommendedStory(
    libraryRows,
    progressByStory,
    attemptByStory,
    cefrLevel,
    genreWeights,
  );

  let queuedReady: QueuedStory | null = null;
  let isPreparingNext = false;

  if (personalQueue) {
    const [{ data: ready }, { data: preparing }] = await Promise.all([
      supabase
        .from("stories")
        .select("id, title, topics")
        .eq("user_id", user.id)
        .eq("language", language)
        .eq("is_queued", true)
        .not("sentence_translations", "is", null)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle<QueuedStory>(),
      supabase
        .from("stories")
        .select("id")
        .eq("user_id", user.id)
        .eq("language", language)
        .eq("is_queued", true)
        .is("sentence_translations", null)
        .limit(1)
        .maybeSingle<{ id: string }>(),
    ]);

    queuedReady = ready ?? null;
    isPreparingNext = !queuedReady && !!preparing;

    if (!queuedReady) {
      after(async () => {
        await generateQueuedStory(user.id, language, cefrLevel);
      });
    }

    after(async () => {
      const service = createServiceClient();
      await service
        .from("stories")
        .delete()
        .eq("user_id", user.id)
        .eq("is_queued", false)
        .eq("is_library", false)
        .is("sentence_translations", null);
    });
  }

  // When a personal queued story is ready, that is the primary CTA — still
  // keep library progress badges, but skip the flashing library recommend.
  const showLibraryRecommend = !queuedReady;

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#07070f] px-3 py-6 sm:px-6 sm:py-10">
      <div className="mx-auto max-w-3xl">
        <Link
          href="/dashboard"
          className="mb-6 inline-flex items-center gap-1.5 text-sm text-slate-400 transition hover:text-white sm:mb-8"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Back to dashboard
        </Link>

        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl font-black text-white sm:text-3xl">📖 Story Library</h1>
          <p className="mb-4 mt-1 text-sm text-slate-400 sm:mb-6">
            Graded reading passages — filter by CEFR level. Defaults to your level (
            {cefrLevel}).
          </p>
          {personalQueue ? (
            <StoryGenerator
              queuedStory={queuedReady}
              isPreparingNext={isPreparingNext}
            />
          ) : (
            <div className="flex items-start gap-3 rounded-2xl border border-violet-500/20 bg-violet-500/10 px-4 py-3 text-sm text-violet-200">
              <Sparkles className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              <p>
                Personalized AI stories are coming with Premium. Browse the shared library
                for now — tap <span className="font-semibold">All</span> to see every level.
              </p>
            </div>
          )}
        </div>

        <StoryLibraryClient
          stories={stories}
          userCefrLevel={cefrLevel}
          recommended={showLibraryRecommend ? recommended : null}
        />
      </div>
    </div>
  );
}
