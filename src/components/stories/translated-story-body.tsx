"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { allSentences, cleanWord } from "@/lib/stories/utils";

// ─── Types ───────────────────────────────────────────────────────────────────

type Translations = {
  sentences: string[];
  words: Record<string, string>;
};

type SlideDirection = "next" | "prev";

// ─── WordSpan ────────────────────────────────────────────────────────────────

type WordSpanProps = {
  token: string;
  wordKey: string;
  meaning: string | undefined;
  activeKey: string | null;
  onActivate: (key: string | null) => void;
};

function WordSpan({ token, wordKey, meaning, activeKey, onActivate }: WordSpanProps) {
  if (/^\s+$/.test(token)) return <>{token}</>;

  const isActive = activeKey === wordKey;
  const hasTranslation = !!meaning;

  function handleClick(e: React.MouseEvent) {
    if (!hasTranslation) return;
    e.stopPropagation();
    onActivate(isActive ? null : wordKey);
  }

  return (
    <span className="relative inline" data-word-span="true" onClick={handleClick}>
      {/* Word tooltip — shown above the word */}
      {isActive && meaning && (
        <span
          className="pointer-events-none absolute bottom-full left-1/2 z-30 mb-2 -translate-x-1/2 whitespace-nowrap rounded-lg bg-slate-900 px-2.5 py-1.5 text-xs font-medium text-white shadow-xl"
          role="tooltip"
        >
          {meaning}
          <span className="absolute -bottom-1 left-1/2 h-0 w-0 -translate-x-1/2 border-4 border-transparent border-t-slate-900" />
        </span>
      )}

      <span
        className={
          hasTranslation
            ? isActive
              ? "cursor-pointer rounded-sm bg-amber-200"
              : "cursor-pointer rounded-sm hover:bg-amber-200"
            : undefined
        }
      >
        {token}
      </span>
    </span>
  );
}

// ─── SentenceBlock ───────────────────────────────────────────────────────────

type SentenceBlockProps = {
  sentence: string;
  sentenceKey: string;
  wordTranslations: Record<string, string>;
  activeKey: string | null;
  onActivate: (key: string | null) => void;
};

function SentenceBlock({
  sentence,
  sentenceKey,
  wordTranslations,
  activeKey,
  onActivate,
}: SentenceBlockProps) {
  const tokens = sentence.split(/(\s+)/);

  return (
    <p className="text-xl font-medium leading-relaxed text-slate-900 sm:text-2xl sm:leading-relaxed">
      {tokens.map((token, ti) => {
        const clean = cleanWord(token);
        return (
          <WordSpan
            key={ti}
            token={token}
            wordKey={`${sentenceKey}-${ti}`}
            meaning={clean.length >= 2 ? wordTranslations[clean] : undefined}
            activeKey={activeKey}
            onActivate={onActivate}
          />
        );
      })}
    </p>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

type Props = {
  body: string;
  translations: Translations | null;
};

export function TranslatedStoryBody({ body, translations }: Props) {
  const sentences = allSentences(body);
  const total = sentences.length;

  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState<SlideDirection>("next");
  const [activeWordKey, setActiveWordKey] = useState<string | null>(null);

  const wheelLock = useRef(false);
  const readerRef = useRef<HTMLDivElement>(null);

  const goNext = useCallback(() => {
    setIndex((i) => {
      if (i >= total - 1) return i;
      return i + 1;
    });
    setDirection("next");
    setActiveWordKey(null);
  }, [total]);

  const goPrev = useCallback(() => {
    setIndex((i) => {
      if (i <= 0) return i;
      return i - 1;
    });
    setDirection("prev");
    setActiveWordKey(null);
  }, []);

  useEffect(() => {
    function handleMouseDown(e: MouseEvent) {
      if (!(e.target as Element).closest("[data-word-span]")) {
        setActiveWordKey(null);
      }
    }
    document.addEventListener("mousedown", handleMouseDown);
    return () => document.removeEventListener("mousedown", handleMouseDown);
  }, []);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "ArrowRight" || e.key === "ArrowDown") {
        e.preventDefault();
        goNext();
      } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
        e.preventDefault();
        goPrev();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [goNext, goPrev]);

  function handleWheel(e: React.WheelEvent) {
    if (Math.abs(e.deltaY) < 25) return;
    e.preventDefault();

    if (wheelLock.current) return;
    wheelLock.current = true;
    setTimeout(() => {
      wheelLock.current = false;
    }, 450);

    if (e.deltaY > 0) goNext();
    else goPrev();
  }

  if (total === 0) return null;

  const currentSentence = sentences[index] ?? "";
  const currentTranslation = translations?.sentences[index];
  const isFirst = index === 0;
  const isLast = index === total - 1;

  // No translations — plain paginated reader
  if (!translations) {
    return (
      <div className="flex flex-col gap-6">
        <p className="text-center text-xs text-slate-400">
          Scroll or use arrows to move through the story · Generate a new story for word
          tooltips
        </p>
        <div
          ref={readerRef}
          onWheel={handleWheel}
          className="relative min-h-[200px] overflow-hidden"
        >
          <div key={index} className={direction === "next" ? "story-slide-up" : "story-slide-down"}>
            <p className="text-xl font-medium leading-relaxed text-slate-900 sm:text-2xl">
              {currentSentence}
            </p>
          </div>
        </div>
        <StoryNav
          index={index}
          total={total}
          isFirst={isFirst}
          isLast={isLast}
          onPrev={goPrev}
          onNext={goNext}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <p className="text-center text-xs text-slate-400">
        Scroll or use arrows for the next sentence · click any word for its meaning
      </p>

      {/* Sentence viewport */}
      <div
        ref={readerRef}
        onWheel={handleWheel}
        className="relative flex min-h-[220px] flex-col justify-center overflow-hidden py-4"
      >
        <div
          key={index}
          className={`flex flex-col gap-5 ${direction === "next" ? "story-slide-up" : "story-slide-down"}`}
        >
          <SentenceBlock
            sentence={currentSentence}
            sentenceKey={`s-${index}`}
            wordTranslations={translations.words}
            activeKey={activeWordKey}
            onActivate={setActiveWordKey}
          />

          {currentTranslation && (
            <p className="border-t border-slate-100 pt-4 text-base leading-relaxed text-slate-500 sm:text-lg">
              {currentTranslation}
            </p>
          )}
        </div>
      </div>

      <StoryNav
        index={index}
        total={total}
        isFirst={isFirst}
        isLast={isLast}
        onPrev={goPrev}
        onNext={goNext}
      />
    </div>
  );
}

// ─── Navigation bar ──────────────────────────────────────────────────────────

type NavProps = {
  index: number;
  total: number;
  isFirst: boolean;
  isLast: boolean;
  onPrev: () => void;
  onNext: () => void;
};

function StoryNav({ index, total, isFirst, isLast, onPrev, onNext }: NavProps) {
  return (
    <div className="flex items-center justify-between gap-4">
      <button
        type="button"
        onClick={onPrev}
        disabled={isFirst}
        aria-label="Previous sentence"
        className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-30"
      >
        <ChevronLeft className="h-5 w-5" aria-hidden="true" />
      </button>

      <div className="flex flex-col items-center gap-1.5">
        <span className="text-xs font-semibold text-slate-500">
          {index + 1} / {total}
        </span>
        <div className="flex gap-1">
          {Array.from({ length: total }, (_, i) => (
            <span
              key={i}
              className={`h-1.5 rounded-full transition-all ${
                i === index ? "w-4 bg-emerald-500" : "w-1.5 bg-slate-200"
              }`}
              aria-hidden="true"
            />
          ))}
        </div>
      </div>

      <button
        type="button"
        onClick={onNext}
        disabled={isLast}
        aria-label="Next sentence"
        className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700 disabled:cursor-not-allowed disabled:opacity-30"
      >
        <ChevronRight className="h-5 w-5" aria-hidden="true" />
      </button>
    </div>
  );
}
