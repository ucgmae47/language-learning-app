"use client";

import { useState, useTransition } from "react";
import {
  BookOpen,
  Loader2,
  Plus,
  Search,
  Table2,
  Check,
} from "lucide-react";
import { saveWord } from "@/app/actions/vocabulary";
import type {
  ConjugationMood,
  ConjugationResult,
  DictionaryLookup,
} from "@/lib/dictionary/types";
import type { Language } from "@/lib/supabase/types";

type Props = {
  language: Language;
  cefrLevel: string;
};

export function DictionaryClient({ language, cefrLevel }: Props) {
  const [query, setQuery] = useState("");
  const [lookup, setLookup] = useState<DictionaryLookup | null>(null);
  const [conjugation, setConjugation] = useState<ConjugationResult | null>(null);
  const [activeMood, setActiveMood] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isSaving, startSave] = useTransition();

  const langName = language === "es" ? "Spanish" : "French";

  async function search(term?: string) {
    const q = (term ?? query).trim();
    if (!q) return;

    setIsLoading(true);
    setError(null);
    setLookup(null);
    setConjugation(null);
    setActiveMood(null);
    setSaved(false);
    setSaveError(null);

    try {
      const lookupRes = await fetch(
        `/api/dictionary/lookup?q=${encodeURIComponent(q)}&language=${language}&cefrLevel=${encodeURIComponent(cefrLevel)}`,
      );
      const lookupJson = (await lookupRes.json()) as DictionaryLookup & {
        error?: string;
      };

      if (!lookupRes.ok) {
        // Soft guidance — never surface raw API / quota failures
        setError(
          lookupJson.error ??
            "We couldn't find a definition right now. Try another spelling, or try again in a moment.",
        );
        return;
      }

      setLookup(lookupJson);
      setQuery(lookupJson.lemma || q);

      if (lookupJson.isVerb) {
        const conjRes = await fetch(
          `/api/dictionary/conjugate?verb=${encodeURIComponent(lookupJson.lemma)}&language=${language}`,
        );
        if (conjRes.ok) {
          const conjJson = (await conjRes.json()) as ConjugationResult;
          setConjugation(conjJson);
          setActiveMood(conjJson.moods[0]?.id ?? null);
        }
      }
    } catch {
      setError(
        "We couldn't look that up right now. Check your connection and try again.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  function handleSave() {
    if (!lookup) return;
    setSaveError(null);
    startSave(async () => {
      const context =
        lookup.senses[0]?.exampleNative ??
        lookup.senses[0]?.definition ??
        null;
      const { error: err } = await saveWord(
        lookup.lemma,
        lookup.primaryTranslation,
        context,
        "dictionary",
      );
      if (err) {
        setSaveError(err);
        return;
      }
      setSaved(true);
    });
  }

  const currentMood: ConjugationMood | undefined = conjugation?.moods.find(
    (m) => m.id === activeMood,
  );

  return (
    <div className="flex flex-col gap-6">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void search();
        }}
        className="rounded-2xl border border-white/8 bg-white/4 p-4"
      >
        <label htmlFor="dict-search" className="sr-only">
          Search dictionary
        </label>
        <div className="flex gap-2">
          <input
            id="dict-search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={`Search a ${langName} or English word…`}
            className="min-w-0 flex-1 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-slate-500 outline-none focus:border-sky-500/50 focus:ring-1 focus:ring-sky-500/30"
            autoComplete="off"
            spellCheck={false}
          />
          <button
            type="submit"
            disabled={!query.trim() || isLoading}
            className="flex shrink-0 items-center gap-2 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-sky-500/30 transition hover:scale-[1.02] active:scale-95 disabled:opacity-40 disabled:hover:scale-100"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            ) : (
              <Search className="h-4 w-4" aria-hidden="true" />
            )}
            <span className="hidden sm:inline">
              {isLoading ? "Looking up…" : "Look up"}
            </span>
          </button>
        </div>
        <p className="mt-2 text-xs text-slate-500">
          Definitions via AI · Conjugations via verbecc · Level {cefrLevel}
        </p>
      </form>

      {error && (
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-5 py-8 text-center">
          <BookOpen className="mx-auto h-8 w-8 text-slate-600" aria-hidden="true" />
          <p className="mt-3 text-sm font-medium text-slate-300">{error}</p>
          <button
            type="button"
            onClick={() => void search()}
            disabled={!query.trim() || isLoading}
            className="mt-4 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold text-slate-200 transition hover:bg-white/10 disabled:opacity-40"
          >
            Try again
          </button>
        </div>
      )}

      {isLoading && !lookup && (
        <div className="flex flex-col items-center gap-3 py-16 text-slate-500">
          <Loader2 className="h-8 w-8 animate-spin text-sky-400" />
          <p className="text-sm">Looking up…</p>
        </div>
      )}

      {lookup && (
        <section className="rounded-2xl border border-white/8 bg-white/4 p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-sky-400" aria-hidden="true" />
                <h2 className="text-2xl font-black text-white">{lookup.lemma}</h2>
                {lookup.isVerb && (
                  <span className="rounded-lg bg-sky-500/20 px-2 py-0.5 text-xs font-bold text-sky-300">
                    verb
                  </span>
                )}
              </div>
              <p className="mt-1 text-sm text-slate-300">
                {lookup.primaryTranslation}
                {lookup.pronunciation && (
                  <span className="ml-2 text-slate-500">
                    / {lookup.pronunciation} /
                  </span>
                )}
              </p>
              {lookup.query.toLowerCase() !== lookup.lemma.toLowerCase() && (
                <p className="mt-1 text-xs text-slate-500">
                  Searched for “{lookup.query}”
                </p>
              )}
            </div>

            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving || saved}
              className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-bold text-slate-200 transition hover:bg-white/10 disabled:opacity-60"
            >
              {saved ? (
                <>
                  <Check className="h-3.5 w-3.5 text-emerald-400" />
                  Saved
                </>
              ) : isSaving ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Saving…
                </>
              ) : (
                <>
                  <Plus className="h-3.5 w-3.5" />
                  Save to Vocabulary
                </>
              )}
            </button>
          </div>

          {saveError && (
            <p className="mt-2 text-xs text-red-400">{saveError}</p>
          )}

          <ul className="mt-5 flex flex-col gap-3">
            {lookup.senses.map((sense, i) => (
              <li
                key={`${sense.partOfSpeech}-${i}`}
                className="rounded-xl border border-white/6 bg-white/3 px-4 py-3"
              >
                <p className="text-[11px] font-bold uppercase tracking-wider text-sky-400/90">
                  {sense.partOfSpeech}
                </p>
                <p className="mt-1 text-sm text-slate-200">{sense.definition}</p>
                <p className="mt-2 text-sm text-white/90">
                  {sense.exampleNative}
                </p>
                <p className="text-xs text-slate-500">{sense.exampleEnglish}</p>
              </li>
            ))}
          </ul>

          {lookup.related.length > 0 && (
            <div className="mt-4">
              <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Related
              </p>
              <div className="flex flex-wrap gap-2">
                {lookup.related.map((word) => (
                  <button
                    key={word}
                    type="button"
                    onClick={() => {
                      setQuery(word);
                      void search(word);
                    }}
                    className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-300 transition hover:border-sky-500/40 hover:text-white"
                  >
                    {word}
                  </button>
                ))}
              </div>
            </div>
          )}
        </section>
      )}

      {conjugation && (
        <section className="rounded-2xl border border-white/8 bg-white/4 p-5">
          <div className="mb-4 flex items-center gap-2">
            <Table2 className="h-5 w-5 text-emerald-400" aria-hidden="true" />
            <div>
              <h3 className="text-lg font-bold text-white">
                Conjugation — {conjugation.infinitive}
              </h3>
              {conjugation.predicted && (
                <p className="text-xs text-amber-400/90">
                  Predicted pattern (uncommon or new verb)
                </p>
              )}
            </div>
          </div>

          <div className="mb-4 flex flex-wrap gap-2">
            {conjugation.moods.map((mood) => (
              <button
                key={mood.id}
                type="button"
                onClick={() => setActiveMood(mood.id)}
                className={`rounded-xl px-3 py-1.5 text-xs font-bold transition ${
                  activeMood === mood.id
                    ? "bg-emerald-500/20 text-emerald-300 ring-1 ring-emerald-500/40"
                    : "bg-white/5 text-slate-400 hover:bg-white/8 hover:text-slate-200"
                }`}
              >
                {mood.label}
              </button>
            ))}
          </div>

          {currentMood && (
            <div className="flex flex-col gap-4">
              {currentMood.tenses.map((tense) => (
                <div key={tense.id}>
                  <h4 className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-500">
                    {tense.label}
                  </h4>
                  <div className="overflow-hidden rounded-xl border border-white/8">
                    <table className="w-full text-sm">
                      <tbody>
                        {tense.persons.map((row, idx) => (
                          <tr
                            key={`${tense.id}-${row.pronoun}-${idx}`}
                            className={
                              idx % 2 === 0 ? "bg-white/3" : "bg-transparent"
                            }
                          >
                            <td className="w-28 px-3 py-2 text-slate-500">
                              {row.pronoun}
                            </td>
                            <td className="px-3 py-2 font-medium text-slate-100">
                              {row.form}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {!lookup && !isLoading && !error && (
        <div className="rounded-2xl border border-dashed border-white/10 px-6 py-14 text-center">
          <BookOpen className="mx-auto h-10 w-10 text-slate-600" />
          <p className="mt-4 font-semibold text-slate-300">
            Look up any word or verb
          </p>
          <p className="mt-1 text-sm text-slate-500">
            Get learner-friendly definitions and full conjugation tables for{" "}
            {langName}.
          </p>
        </div>
      )}
    </div>
  );
}
