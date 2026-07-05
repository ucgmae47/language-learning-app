"use client";

import { useState, useCallback } from "react";
import { Volume2 } from "lucide-react";
import type { Language } from "@/lib/supabase/types";

const CATEGORIES = [
  "Greetings & Farewells",
  "Daily Conversations",
  "Food & Dining",
  "Travel & Transport",
  "Shopping",
  "Emergency & Health",
  "Numbers & Time",
  "Compliments & Polite Phrases",
  "Making Friends",
  "Business & Formal",
];

type Phrase = {
  native: string;
  english: string;
  pronunciation: string;
  context: string;
};

type PhrasebookData = {
  phrases: Phrase[];
  category_tip: string;
};

type Props = {
  language: Language;
  cefrLevel: string;
};

const LANG_VOICE: Record<Language, string> = {
  es: "es-ES",
  fr: "fr-FR",
};

function speak(text: string, lang: string) {
  if (typeof window === "undefined" || !window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const utt = new SpeechSynthesisUtterance(text);
  utt.lang = lang;
  utt.rate = 0.85;
  window.speechSynthesis.speak(utt);
}

function PhraseSkeleton() {
  return (
    <div className="flex flex-col gap-3 animate-pulse">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="rounded-2xl border border-white/8 bg-white/4 p-4">
          <div className="h-6 w-3/4 rounded-lg bg-white/8 mb-2" />
          <div className="h-4 w-1/2 rounded-lg bg-white/6 mb-2" />
          <div className="h-3 w-1/3 rounded-lg bg-white/4" />
        </div>
      ))}
    </div>
  );
}

export function PhrasebookClient({ language, cefrLevel }: Props) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [cache, setCache] = useState<Record<string, PhrasebookData>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const voiceLang = LANG_VOICE[language];

  const selectCategory = useCallback(
    async (category: string) => {
      setSelectedCategory(category);
      setError(null);

      if (cache[category]) return;

      setIsLoading(true);
      try {
        const params = new URLSearchParams({ category, language, cefrLevel });
        const res = await fetch(`/api/phrasebook?${params.toString()}`);
        if (!res.ok) throw new Error("Failed to load phrases");
        const data = (await res.json()) as PhrasebookData;
        setCache((prev) => ({ ...prev, [category]: data }));
      } catch {
        setError("Couldn't load phrases. Please try again.");
      } finally {
        setIsLoading(false);
      }
    },
    [cache, language, cefrLevel],
  );

  const currentData = selectedCategory ? cache[selectedCategory] : null;

  return (
    <div className="flex flex-col gap-6">
      {/* Category grid */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => void selectCategory(cat)}
            className={`rounded-2xl border px-3 py-2.5 text-sm font-semibold text-left transition ${
              selectedCategory === cat
                ? "border-violet-500/60 bg-violet-500/20 text-violet-200"
                : "border-white/10 bg-white/4 text-slate-300 hover:bg-white/8 hover:text-white"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Content area */}
      {!selectedCategory && (
        <div className="flex flex-col items-center justify-center gap-3 rounded-3xl border border-dashed border-white/10 py-16 text-center">
          <span className="text-4xl" aria-hidden="true">💬</span>
          <p className="text-slate-400 text-sm">Select a category to explore phrases</p>
        </div>
      )}

      {selectedCategory && (
        <div className="flex flex-col gap-4">
          {error && (
            <div className="rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
              {error}
            </div>
          )}

          {isLoading ? (
            <PhraseSkeleton />
          ) : currentData ? (
            <>
              {/* Category tip */}
              <div className="rounded-2xl border border-violet-500/20 bg-violet-500/10 px-4 py-3">
                <p className="text-xs font-bold text-violet-400 mb-1">💡 Tip</p>
                <p className="text-sm text-violet-200/90">{currentData.category_tip}</p>
              </div>

              {/* Phrases */}
              <div className="flex flex-col gap-3">
                {currentData.phrases.map((phrase, i) => (
                  <div
                    key={i}
                    className="rounded-2xl border border-white/8 bg-white/4 p-4 flex items-start justify-between gap-3"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-xl font-bold text-white leading-tight">{phrase.native}</p>
                      <p className="mt-1 text-sm text-slate-300">{phrase.english}</p>
                      <p className="mt-1 text-xs italic text-slate-500">{phrase.pronunciation}</p>
                      <span className="mt-2 inline-block rounded-lg border border-white/10 bg-white/5 px-2 py-0.5 text-xs text-slate-400">
                        {phrase.context}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => speak(phrase.native, voiceLang)}
                      aria-label="Hear pronunciation"
                      className="shrink-0 flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-slate-400 transition hover:bg-white/10 hover:text-white"
                    >
                      <Volume2 className="h-4 w-4" aria-hidden="true" />
                    </button>
                  </div>
                ))}
              </div>
            </>
          ) : null}
        </div>
      )}
    </div>
  );
}
