"use client";

import { useState, useEffect } from "react";
import { splitSentences, cleanWord } from "@/lib/stories/utils";

// ─── Types ───────────────────────────────────────────────────────────────────

type Translations = {
  sentences: string[];              // ordered; index maps to sentence order in body
  words: Record<string, string>;   // cleaned word → English meaning
};

// ─── WordSpan ────────────────────────────────────────────────────────────────
// Renders one whitespace-delimited token. Translatable words change color on
// hover and show a popover above when clicked.

type WordSpanProps = {
  token: string;
  wordKey: string;
  meaning: string | undefined;
  activeKey: string | null;
  onActivate: (key: string | null) => void;
};

function WordSpan({ token, wordKey, meaning, activeKey, onActivate }: WordSpanProps) {
  // Whitespace tokens are rendered as-is.
  if (/^\s+$/.test(token)) return <>{token}</>;

  const isActive = activeKey === wordKey;
  const hasTranslation = !!meaning;

  function handleClick(e: React.MouseEvent) {
    if (!hasTranslation) return;
    e.stopPropagation(); // prevent document click from immediately closing it
    onActivate(isActive ? null : wordKey);
  }

  return (
    <span
      className="relative inline"
      data-word-span="true"
      onClick={handleClick}
    >
      <span
        className={`rounded-sm transition-colors duration-75 ${
          hasTranslation
            ? isActive
              ? "bg-amber-200 cursor-pointer"
              : "hover:bg-amber-200 cursor-pointer"
            : ""
        }`}
      >
        {token}
      </span>

      {/* Popover above the word */}
      {isActive && meaning && (
        <span
          className="pointer-events-none absolute bottom-full left-1/2 z-30 mb-1.5 -translate-x-1/2 whitespace-nowrap rounded-lg border border-slate-200 bg-slate-900 px-2.5 py-1.5 text-xs font-medium text-white shadow-lg"
          role="tooltip"
        >
          {meaning}
          {/* Caret */}
          <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-900" />
        </span>
      )}
    </span>
  );
}

// ─── SentenceSpan ────────────────────────────────────────────────────────────
// Wraps one sentence. Hover highlights the sentence and reveals the English
// translation in a card below. Word spans inside remain individually clickable.

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

  // Split sentence into display tokens (words + spaces).
  const tokens = sentence.split(/(\s+)/);

  return (
    <span className="relative">
      {/* Sentence highlight container */}
      <span
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={`rounded transition-colors duration-100 ${
          isHovered ? "bg-yellow-100" : ""
        }`}
      >
        {tokens.map((token, ti) => {
          const clean = cleanWord(token);
          const wordKey = `${sentenceKey}-${ti}`;
          return (
            <WordSpan
              key={ti}
              token={token}
              wordKey={wordKey}
              meaning={clean.length >= 2 ? wordTranslations[clean] : undefined}
              activeKey={activeKey}
              onActivate={onActivate}
            />
          );
        })}
      </span>

      {/* Sentence translation card — appears below, stays open while hovering it */}
      {isHovered && sentenceTranslation && (
        <span
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          className="absolute left-0 top-full z-20 mt-1.5 block max-w-sm rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm leading-snug text-slate-700 shadow-lg"
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

  // Close any open word popover when clicking outside a word span.
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

  // No translations available (e.g. story generated before this feature) —
  // fall back to plain readable text.
  if (!translations) {
    return (
      <>
        {paragraphs.map((para, pi) => (
          <p key={pi} className="mt-5 text-base leading-8 text-slate-800 first:mt-0">
            {para}
          </p>
        ))}
      </>
    );
  }

  // Build the interactive story with pre-loaded sentence and word translations.
  // sentenceIdx tracks position in the flat sentence_translations array.
  let sentenceIdx = 0;

  return (
    <>
      {/* Instruction hint */}
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
