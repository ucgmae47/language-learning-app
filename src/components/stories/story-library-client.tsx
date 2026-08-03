"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { BookOpen, Clock } from "lucide-react";
import type { CefrLevel } from "@/lib/supabase/types";

const CEFR_LEVELS: CefrLevel[] = ["A1", "A2", "B1", "B2", "C1", "C2"];

export type LibraryStoryCard = {
  id: string;
  title: string;
  cefr_level: CefrLevel;
  topics: string[];
  word_count: number | null;
  created_at: string;
};

type Props = {
  stories: LibraryStoryCard[];
  userCefrLevel: CefrLevel;
};

type FilterMode = "all" | "levels";

export function StoryLibraryClient({ stories, userCefrLevel }: Props) {
  const [mode, setMode] = useState<FilterMode>("levels");
  const [selectedLevels, setSelectedLevels] = useState<Set<CefrLevel>>(
    () => new Set([userCefrLevel]),
  );

  const availableLevels = useMemo(() => {
    const present = new Set(stories.map((s) => s.cefr_level));
    return CEFR_LEVELS.filter((l) => present.has(l));
  }, [stories]);

  const filtered = useMemo(() => {
    if (mode === "all") return stories;
    return stories.filter((s) => selectedLevels.has(s.cefr_level));
  }, [mode, selectedLevels, stories]);

  function selectAll() {
    setMode("all");
    setSelectedLevels(new Set());
  }

  function toggleLevel(level: CefrLevel) {
    const next = new Set(mode === "all" ? [] : selectedLevels);
    if (next.has(level)) next.delete(level);
    else next.add(level);

    if (next.size === 0) {
      setMode("all");
      setSelectedLevels(new Set());
      return;
    }

    setMode("levels");
    setSelectedLevels(next);
  }

  if (stories.length === 0) {
    return (
      <div className="rounded-3xl border border-dashed border-white/15 bg-white/5 p-12 text-center">
        <BookOpen className="mx-auto h-10 w-10 text-slate-600" />
        <p className="mt-4 font-bold text-slate-300">Library is empty</p>
        <p className="mt-1 text-sm text-slate-500">
          Seed library stories to populate free reading content.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div
        className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        role="group"
        aria-label="Filter stories by CEFR level"
      >
        <FilterChip
          label="All"
          active={mode === "all"}
          onClick={selectAll}
        />
        {CEFR_LEVELS.map((level) => {
          const hasStories = availableLevels.includes(level);
          const active = mode === "levels" && selectedLevels.has(level);
          return (
            <FilterChip
              key={level}
              label={level}
              active={active}
              disabled={!hasStories}
              hint={level === userCefrLevel ? "Your level" : undefined}
              onClick={() => toggleLevel(level)}
            />
          );
        })}
      </div>

      <p className="text-xs text-slate-500">
        {mode === "all"
          ? `Showing all ${filtered.length} stories`
          : filtered.length === 0
            ? `No stories at ${[...selectedLevels].join(", ")} yet — try All or another level`
            : `Showing ${filtered.length} stor${filtered.length === 1 ? "y" : "ies"} · ${[...selectedLevels].sort().join(", ")}`}
      </p>

      {filtered.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-white/15 bg-white/5 p-10 text-center">
          <BookOpen className="mx-auto h-8 w-8 text-slate-600" />
          <p className="mt-3 font-bold text-slate-300">No stories for this filter</p>
          <p className="mt-1 text-sm text-slate-500">
            Select <span className="text-slate-400">All</span> or another CEFR level.
          </p>
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {filtered.map((story) => {
            const readingMins = story.word_count
              ? Math.max(1, Math.round(story.word_count / 180))
              : null;

            return (
              <li key={story.id}>
                <Link
                  href={`/stories/${story.id}`}
                  className="flex flex-col gap-3 rounded-2xl border border-white/8 bg-white/5 p-4 transition hover:-translate-y-0.5 hover:border-violet-500/30 hover:bg-white/8 hover:shadow-lg hover:shadow-violet-500/10 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:p-5"
                >
                  <div className="min-w-0">
                    <p className="font-bold text-white sm:truncate">{story.title}</p>
                    <div className="mt-1.5 flex flex-wrap items-center gap-2">
                      <span className="rounded-lg bg-violet-500/20 px-2 py-0.5 text-xs font-bold text-violet-300">
                        {story.cefr_level}
                      </span>
                      {story.topics.slice(0, 2).map((t) => (
                        <span
                          key={t}
                          className="rounded-lg border border-white/8 bg-white/5 px-2 py-0.5 text-xs capitalize text-slate-400"
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
                  {story.cefr_level === userCefrLevel && (
                    <span className="w-fit shrink-0 rounded-lg bg-emerald-500/15 px-2 py-1 text-xs font-semibold text-emerald-300">
                      Your level
                    </span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function FilterChip({
  label,
  active,
  disabled,
  hint,
  onClick,
}: {
  label: string;
  active: boolean;
  disabled?: boolean;
  hint?: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={disabled ? "No stories at this level yet" : hint}
      aria-pressed={active}
      className={`shrink-0 rounded-full px-3.5 py-1.5 text-xs font-bold transition ${
        active
          ? "bg-violet-500 text-white shadow-lg shadow-violet-500/25"
          : disabled
            ? "cursor-not-allowed border border-white/5 bg-white/[0.03] text-slate-600"
            : "border border-white/10 bg-white/5 text-slate-300 hover:border-white/20 hover:bg-white/10 hover:text-white"
      }`}
    >
      {label}
      {hint && active ? (
        <span className="ml-1 font-medium opacity-80">· you</span>
      ) : null}
    </button>
  );
}
