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
import type { CefrLevel, Language, Story } from "@/lib/supabase/types";

type QueuedStory = Pick<Story, "id" | "title" | "topics">;

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

  const { data: profile } = await supabase
    .from("profiles")
    .select("language, cefr_level")
    .eq("id", user.id)
    .single<{ language: Language; cefr_level: CefrLevel }>();

  const language: Language = profile?.language ?? "es";
  const cefrLevel: CefrLevel = profile?.cefr_level ?? "B1";

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
    .returns<LibraryStoryCard[]>();

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

  const stories = libraryStories ?? [];

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

        <StoryLibraryClient stories={stories} userCefrLevel={cefrLevel} />
      </div>
    </div>
  );
}
