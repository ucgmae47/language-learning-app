import { Volume2 } from "lucide-react";
import type { WordEntry } from "@/lib/word-of-the-day/bank";

type Props = {
  entry: WordEntry;
  date: string;
};

export function WordOfTheDay({ entry, date }: Props) {
  const formattedDate = new Date(date + "T12:00:00").toLocaleDateString(
    "en-US",
    { weekday: "long", month: "long", day: "numeric" },
  );

  const genderLabel =
    entry.gender === "masculine"
      ? "m."
      : entry.gender === "feminine"
        ? "f."
        : null;

  return (
    <section
      aria-labelledby="wotd-heading"
      className="rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-white p-6 shadow-sm"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-emerald-700">
            Word of the Day · {formattedDate}
          </p>

          <div className="mt-3 flex items-baseline gap-2">
            <h2
              id="wotd-heading"
              className="text-3xl font-bold text-slate-900"
            >
              {entry.word}
            </h2>
            {genderLabel && (
              <span className="text-sm font-medium text-slate-400">
                {genderLabel}
              </span>
            )}
          </div>

          <div className="mt-1 flex items-center gap-2">
            <span className="rounded-full border border-slate-200 bg-white px-2.5 py-0.5 text-xs font-medium text-slate-600">
              {entry.partOfSpeech}
            </span>
            {entry.ipa && (
              <span className="flex items-center gap-1 text-xs text-slate-400">
                <Volume2 className="h-3 w-3" aria-hidden="true" />
                {entry.ipa}
              </span>
            )}
          </div>
        </div>
      </div>

      <p className="mt-4 text-sm text-slate-700">{entry.definition}</p>

      <blockquote className="mt-4 rounded-xl bg-white/80 p-4 text-sm leading-6">
        <p className="font-medium text-slate-800">
          &ldquo;{entry.exampleEs}&rdquo;
        </p>
        <p className="mt-1 text-slate-500 italic">{entry.exampleEn}</p>
      </blockquote>
    </section>
  );
}
