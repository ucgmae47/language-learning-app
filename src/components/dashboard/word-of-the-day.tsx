import { Volume2, Star } from "lucide-react";
import type { WordEntry } from "@/lib/word-of-the-day/bank";

type Props = {
  entry: WordEntry;
  date: string;
};

export function WordOfTheDay({ entry, date }: Props) {
  const formattedDate = new Date(date + "T12:00:00").toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  const genderLabel =
    entry.gender === "masculine" ? "m." : entry.gender === "feminine" ? "f." : null;

  return (
    <section
      aria-labelledby="wotd-heading"
      className="relative overflow-hidden rounded-3xl border border-emerald-500/20 bg-gradient-to-br from-emerald-500/15 via-teal-500/8 to-transparent p-6 shadow-xl shadow-emerald-500/10"
    >
      {/* Decorative background glow */}
      <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-emerald-500/15 blur-2xl" />
      <div className="pointer-events-none absolute -bottom-5 right-20 h-24 w-24 rounded-full bg-teal-400/10 blur-xl" />

      <div className="relative flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <Star className="h-3.5 w-3.5 fill-emerald-400 text-emerald-400" aria-hidden="true" />
            <p className="text-xs font-bold uppercase tracking-widest text-emerald-400">
              Word of the Day · {formattedDate}
            </p>
          </div>

          <div className="mt-3 flex items-baseline gap-2">
            <h2
              id="wotd-heading"
              className="text-4xl font-black tracking-tight text-white"
            >
              {entry.word}
            </h2>
            {genderLabel && (
              <span className="text-sm font-medium text-slate-500">{genderLabel}</span>
            )}
          </div>

          <div className="mt-2 flex items-center gap-2">
            <span className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-0.5 text-xs font-semibold text-slate-400">
              {entry.partOfSpeech}
            </span>
            {entry.ipa && (
              <span className="flex items-center gap-1 text-xs text-slate-500">
                <Volume2 className="h-3 w-3" aria-hidden="true" />
                {entry.ipa}
              </span>
            )}
          </div>
        </div>

        {/* Large decorative emoji/letter */}
        <div className="hidden shrink-0 sm:flex">
          <span className="flex h-16 w-16 items-center justify-center rounded-2xl border border-emerald-500/20 bg-emerald-500/10 text-3xl shadow-lg">
            🌟
          </span>
        </div>
      </div>

      <p className="relative mt-4 text-sm leading-relaxed text-slate-300">{entry.definition}</p>

      <blockquote className="relative mt-4 rounded-2xl border border-white/8 bg-white/5 p-4 text-sm leading-6">
        <p className="font-semibold text-white">&ldquo;{entry.example}&rdquo;</p>
        <p className="mt-1 text-slate-400 italic">{entry.exampleEn}</p>
      </blockquote>
    </section>
  );
}
