"use client";

import { useState, useEffect, useRef } from "react";
import { StoryReader } from "@/components/stories/story-reader";
import { extractContentWords } from "@/lib/stories/utils";
import type { Language } from "@/lib/supabase/types";

type Translations = {
  sentences: string[];
  words: Record<string, string>;
};

type Props = {
  storyId: string;
  title: string;
  cefrLevel: string;
  language: Language;
  topics: string[];
  readingMins: number | null;
  body: string;
  initialTranslations: Translations | null;
  attemptScore: number | null;
};

function hasMissingWordTranslations(
  body: string,
  words: Record<string, string> | null | undefined,
): boolean {
  const map = words ?? {};
  return extractContentWords(body).some((w) => !map[w]);
}

export function StoryReaderClient({
  storyId,
  title,
  cefrLevel,
  language,
  topics,
  readingMins,
  body,
  initialTranslations,
  attemptScore,
}: Props) {
  const [translations, setTranslations] = useState<Translations | null>(
    initialTranslations,
  );
  const wordFillTriggered = useRef(false);

  // Older stories may lack short-word meanings (articles, etc.). Fill those in
  // silently — never surface translation backfill UI to the reader.
  useEffect(() => {
    if (!translations?.sentences?.length) return;
    if (!hasMissingWordTranslations(body, translations.words)) return;
    if (wordFillTriggered.current) return;
    wordFillTriggered.current = true;

    let cancelled = false;

    void (async () => {
      try {
        const res = await fetch(`/api/stories/${storyId}/translations`, {
          method: "POST",
        });
        if (!res.ok || cancelled) return;
        const data = (await res.json()) as {
          sentences: string[] | null;
          words: Record<string, string> | null;
        };
        if (cancelled || !data.words) return;
        setTranslations((prev) =>
          prev
            ? { ...prev, words: data.words ?? prev.words }
            : data.sentences?.length
              ? { sentences: data.sentences, words: data.words ?? {} }
              : prev,
        );
      } catch {
        // Non-fatal: longer words still work; short ones stay untappable.
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [storyId, body, translations]);

  return (
    <StoryReader
      title={title}
      cefrLevel={cefrLevel}
      language={language}
      topics={topics}
      readingMins={readingMins}
      body={body}
      translations={translations}
      loadingTranslations={false}
      translationError={null}
      storyId={storyId}
      attemptScore={attemptScore}
    />
  );
}
