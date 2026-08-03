"use client";

import dynamic from "next/dynamic";
import type { Idiom } from "@/lib/flashcards/types";
import type { IdiomDailyLesson, Language } from "@/lib/supabase/types";

const FlashcardDeckDynamic = dynamic(
  () => import("./flashcard-deck").then((m) => m.FlashcardDeck),
  {
    ssr: false,
    loading: () => (
      <div className="h-64 animate-pulse rounded-2xl bg-white/5" />
    ),
  },
);

type Props = {
  lesson: IdiomDailyLesson;
  cards: Idiom[];
  language: Language;
};

export function FlashcardDeckClient(props: Props) {
  return <FlashcardDeckDynamic {...props} />;
}
