"use client";

import dynamic from "next/dynamic";
import type { Idiom } from "@/lib/flashcards/types";

const FlashcardDeckDynamic = dynamic(
  () => import("./flashcard-deck").then((m) => m.FlashcardDeck),
  {
    ssr: false,
    loading: () => (
      <div className="h-64 animate-pulse rounded-2xl bg-slate-100" />
    ),
  },
);

type Props = {
  idioms: Idiom[];
  language: "es" | "fr";
};

export function FlashcardDeckClient(props: Props) {
  return <FlashcardDeckDynamic {...props} />;
}
