"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { BookOpen, Clock, Library, SkipForward, Sparkles } from "lucide-react";
import {
  StoryLibraryClient,
  type LibraryStoryCard,
} from "@/components/stories/story-library-client";
import type { CefrLevel } from "@/lib/supabase/types";
import type { RecommendedStory } from "@/lib/stories/next-recommendation";

type QueueItem = {
  id: string;
  title: string;
  cefr_level: CefrLevel;
  topics: string[];
  word_count: number | null;
  reason: "continue" | "quiz" | "next";
  percent_read: number;
};

type RankedCandidate = {
  id: string;
  title: string;
  cefr_level: CefrLevel;
  topics: string[];
  word_count: number | null;
};

type Props = {
  stories: LibraryStoryCard[];
  userCefrLevel: CefrLevel;
  recommended: RecommendedStory | null;
  rankedNext: RankedCandidate[];
};

const REASON_COPY: Record<
  QueueItem["reason"],
  { badge: string; cta: string; href: (id: string) => string }
> = {
  continue: {
    badge: "Continue reading",
    cta: "Continue reading",
    href: (id) => `/stories/${id}`,
  },
  quiz: {
    badge: "Ready for the quiz",
    cta: "Take the quiz",
    href: (id) => `/stories/${id}/quiz`,
  },
  next: {
    badge: "Recommended for you",
    cta: "Start reading",
    href: (id) => `/stories/${id}`,
  },
};

export function StoryFocusView({
  stories,
  userCefrLevel,
  recommended,
  rankedNext,
}: Props) {
  const router = useRouter();
  const [mode, setMode] = useState<"focus" | "browse">("focus");
  const [skipCount, setSkipCount] = useState(0);

  // One queue: the primary recommendation first (whatever its reason), then
  // fresh unstarted candidates ranked by closest level + interest. Skipping
  // just walks forward through it instead of dumping the reader into a list.
  const queue = useMemo<QueueItem[]>(() => {
    const items: QueueItem[] = [];
    if (recommended) {
      items.push({
        id: recommended.id,
        title: recommended.title,
        cefr_level: recommended.cefr_level,
        topics: recommended.topics,
        word_count: recommended.word_count,
        reason: recommended.reason,
        percent_read: recommended.percent_read,
      });
    }
    for (const s of rankedNext) {
      if (s.id === recommended?.id) continue;
      items.push({
        id: s.id,
        title: s.title,
        cefr_level: s.cefr_level,
        topics: s.topics,
        word_count: s.word_count,
        reason: "next",
        percent_read: 0,
      });
    }
    return items;
  }, [recommended, rankedNext]);

  const current = queue[skipCount] ?? null;
  const hasMoreToSkip = skipCount + 1 < queue.length;

  if (mode === "browse") {
    return (
      <div className="flex flex-col gap-4">
        <button
          type="button"
          onClick={() => setMode("focus")}
          className="flex w-fit items-center gap-1.5 text-sm text-slate-500 transition hover:text-slate-300"
        >
          ← Back to recommended story
        </button>
        <StoryLibraryClient
          stories={stories}
          userCefrLevel={userCefrLevel}
          recommended={null}
        />
      </div>
    );
  }

  if (!current) {
    return (
      <div className="rounded-3xl border border-dashed border-white/15 bg-white/5 p-10 text-center">
        <BookOpen className="mx-auto h-8 w-8 text-slate-600" />
        <p className="mt-3 font-bold text-slate-300">
          You&apos;re all caught up at your level!
        </p>
        <p className="mt-1 text-sm text-slate-500">
          Browse the full library to revisit a story or try another level.
        </p>
        <button
          type="button"
          onClick={() => setMode("browse")}
          className="mt-5 inline-flex items-center gap-1.5 rounded-full bg-violet-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-violet-500"
        >
          <Library className="h-4 w-4" aria-hidden="true" />
          Browse full library
        </button>
      </div>
    );
  }

  const copy = REASON_COPY[current.reason];
  const readingMins = current.word_count
    ? Math.max(1, Math.round(current.word_count / 180))
    : null;

  return (
    <div className="flex flex-col items-center gap-6 py-6 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-amber-400/25 bg-amber-400/15">
        <Sparkles className="h-6 w-6 text-amber-300" aria-hidden="true" />
      </div>

      <div>
        <p className="text-xs font-bold uppercase tracking-wider text-amber-300">
          {copy.badge}
        </p>
        <h2 className="mt-2 max-w-md text-2xl font-black text-white sm:text-3xl">
          {current.title}
        </h2>
        <div className="mt-3 flex flex-wrap items-center justify-center gap-2 text-xs text-slate-400">
          <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 font-semibold text-slate-300">
            {current.cefr_level}
          </span>
          {current.topics.slice(0, 2).map((t) => (
            <span
              key={t}
              className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1"
            >
              {t}
            </span>
          ))}
          {readingMins && (
            <span className="flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-2.5 py-1">
              <Clock className="h-3 w-3" aria-hidden="true" />
              {readingMins} min
            </span>
          )}
        </div>
        {current.reason === "continue" && current.percent_read > 0 && (
          <p className="mt-2 text-xs text-slate-500">
            {current.percent_read}% read · pick up where you left off
          </p>
        )}
      </div>

      <div className="flex flex-col items-center gap-3 sm:flex-row">
        <button
          type="button"
          onClick={() => router.push(copy.href(current.id))}
          className="rounded-full bg-emerald-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-emerald-900/30 transition hover:bg-emerald-500"
        >
          {copy.cta} →
        </button>
        {hasMoreToSkip && (
          <button
            type="button"
            onClick={() => setSkipCount((n) => n + 1)}
            className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold text-slate-300 transition hover:border-white/20 hover:bg-white/8"
          >
            <SkipForward className="h-4 w-4" aria-hidden="true" />
            Skip — try another
          </button>
        )}
      </div>

      <button
        type="button"
        onClick={() => setMode("browse")}
        className="text-xs text-slate-600 underline-offset-2 transition hover:text-slate-400 hover:underline"
      >
        Browse full library instead
      </button>
    </div>
  );
}
