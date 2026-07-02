"use client";

import { useState, useEffect, useRef } from "react";
import { splitSentences, cleanWord } from "@/lib/stories/utils";

// ─── Types ───────────────────────────────────────────────────────────────────

type Translations = {
  sentences: string[];
  words: Record<string, string>;
};

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
    <span
      className="relative inline"
      data-word-span="true"
      onClick={handleClick}
    >
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

      {isActive && meaning && (
        <span
          className="pointer-events-none absolute bottom-full left-1/2 z-30 mb-2 -translate-x-1/2 whitespace-nowrap rounded-lg bg-slate-900 px-2.5 py-1.5 text-xs font-medium text-white shadow-xl"
          role="tooltip"
        >
          {meaning}
          <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 h-0 w-0 border-4 border-transparent border-t-slate-900" />
        </span>
      )}
    </span>
  );
}

// ─── SentenceSpan ────────────────────────────────────────────────────────────
// The tooltip is pointer-events-none so it never intercepts mouse events.
// A short leave-delay (150 ms) prevents the tooltip from blinking when the
// mouse briefly crosses the gap between the sentence text and the tooltip card.

type SentenceSpanProps = {
  sentence: string;
  sentenceTranslation: string | undefined;
  sentenceKey: string;
  wordTranslations: Record<string, string>;
  activeKey: string | null;
  onActivate: (key: string | null) => void;
};

function SentenceSpan({
  sentence,
  sentenceTranslation,
  sentenceKey,
  wordTranslations,
  activeKey,
  onActivate,
}: SentenceSpanProps) {
  const [isHovered, setIsHovered] = useState(false);
  const leaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const tokens = sentence.split(/(\s+)/);

  function handleEnter() {
    if (leaveTimer.current) clearTimeout(leaveTimer.current);
    setIsHovered(true);
  }

  function handleLeave() {
    // Short delay so the cursor can cross the gap between sentence and tooltip
    // without the tooltip blinking away.
    leaveTimer.current = setTimeout(() => setIsHovered(false), 150);
  }

  return (
    // Outermost wrapper carries the hover handlers so that moving the mouse
    // between the sentence text and the (absolutely positioned) tooltip card
    // doesn't fire a premature leave event.
    <span
      className="relative"
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
    >
      {/* Sentence highlight */}
      <span
        className={`rounded transition-colors duration-100 ${
          isHovered ? "bg-yellow-100" : ""
        }`}
      >
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
      </span>

      {/* Translation tooltip — pointer-events-none so it never swallows mouse events */}
      {isHovered && sentenceTranslation && (
        <span
          className="pointer-events-none absolute left-0 top-full z-20 mt-1 block max-w-sm rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm leading-snug text-slate-700 shadow-lg"
          style={{ minWidth: "180px" }}
          role="tooltip"
        >
          {sentenceTranslation}
        </span>
      )}
    </span>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

type Props = {
  body: string;
  translations: Translations | null;
};

export function TranslatedStoryBody({ body, translations }: Props) {
  const [activeWordKey, setActiveWordKey] = useState<string | null>(null);

  useEffect(() => {
    function handleMouseDown(e: MouseEvent) {
      if (!(e.target as Element).closest("[data-word-span]")) {
        setActiveWordKey(null);
      }
    }
    document.addEventListener("mousedown", handleMouseDown);
    return () => document.removeEventListener("mousedown", handleMouseDown);
  }, []);

  const paragraphs = body
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean);

  if (!translations) {
    return (
      <>
        {paragraphs.map((para, pi) => (
          <p key={pi} className="mt-5 text-base leading-8 text-slate-800 first:mt-0">
            {para}
          </p>
        ))}
        <p className="mt-6 text-center text-xs text-slate-400">
          Generate a new story to get interactive hover translations.
        </p>
      </>
    );
  }

  let sentenceIdx = 0;

  return (
    <>
      <p className="mb-5 text-xs text-slate-400">
        Hover a sentence for its translation · click any word for its meaning
      </p>

      {paragraphs.map((para, pi) => {
        const sentences = splitSentences(para);
        return (
          <p key={pi} className="mt-5 text-base leading-8 text-slate-800 first:mt-0">
            {sentences.map((sent, si) => {
              const translation = translations.sentences[sentenceIdx];
              sentenceIdx++;
              return (
                <SentenceSpan
                  key={`${pi}-${si}`}
                  sentence={sent}
                  sentenceTranslation={translation}
                  sentenceKey={`${pi}-${si}`}
                  wordTranslations={translations.words}
                  activeKey={activeWordKey}
                  onActivate={setActiveWordKey}
                />
              );
            })}
          </p>
        );
      })}
    </>
  );
}
