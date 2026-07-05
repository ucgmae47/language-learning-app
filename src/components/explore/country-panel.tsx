"use client";

import { X, Globe, Users, MapPin, Loader2 } from "lucide-react";
import type { CountryInfoResponse } from "@/app/api/explore/country/route";
import type { CountryEntry } from "@/lib/explore/country-data";

type Props = {
  entry: CountryEntry;
  info: CountryInfoResponse | null;
  isLoading: boolean;
  error: string | null;
  onClose: () => void;
};

function formatPop(n: number): string {
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1)}B`;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
  return String(n);
}

export function CountryPanel({ entry, info, isLoading, error, onClose }: Props) {
  const country = info?.country;
  const facts = info?.facts;

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 border-b border-white/8 bg-white/3 px-5 py-4">
        <div className="flex items-center gap-3">
          <span className="text-4xl leading-none" aria-hidden="true">
            {entry.flag}
          </span>
          <div>
            <h2 className="text-xl font-extrabold text-white">{entry.name}</h2>
            {country && (
              <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-slate-400">
                {country.capital !== "—" && (
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" aria-hidden="true" />
                    {country.capital}
                  </span>
                )}
                {country.population > 0 && (
                  <span className="flex items-center gap-1">
                    <Users className="h-3 w-3" aria-hidden="true" />
                    {formatPop(country.population)}
                  </span>
                )}
                {country.subregion !== "—" && (
                  <span className="flex items-center gap-1">
                    <Globe className="h-3 w-3" aria-hidden="true" />
                    {country.subregion}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/5 text-slate-400 transition hover:bg-white/10 hover:text-white"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto px-5 py-5">
        {isLoading ? (
          <div className="flex h-full flex-col items-center justify-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-amber-400" aria-hidden="true" />
            <p className="text-sm text-slate-400">Loading country info…</p>
          </div>
        ) : error ? (
          <p className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
            {error}
          </p>
        ) : facts ? (
          <div className="flex flex-col gap-5">
            {/* Cultural snapshot */}
            <section>
              <h3 className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-500">
                <span aria-hidden="true">🌍</span> Cultural Snapshot
              </h3>
              <p className="text-sm leading-relaxed text-slate-300">{facts.cultural_note}</p>
            </section>

            {/* Famous for */}
            <section>
              <h3 className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-500">
                <span aria-hidden="true">🌟</span> Famous For
              </h3>
              <p className="text-sm text-slate-200">{facts.famous_for}</p>
            </section>

            {/* Fun facts */}
            <section>
              <h3 className="mb-3 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-500">
                <span aria-hidden="true">✨</span> Fun Facts
              </h3>
              <ul className="flex flex-col gap-3">
                {facts.fun_facts.map((fact, i) => (
                  <li
                    key={i}
                    className="flex gap-2.5 rounded-xl border border-white/6 bg-white/3 px-3 py-2.5 text-sm leading-relaxed text-slate-300"
                  >
                    <span className="mt-0.5 shrink-0 text-base" aria-hidden="true">
                      {["🏛️", "🎶", "🍽️", "⚽", "🗺️"][i % 5]}
                    </span>
                    {fact}
                  </li>
                ))}
              </ul>
            </section>

            {/* Language note */}
            <section>
              <h3 className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-500">
                <span aria-hidden="true">🗣️</span> Language Note
              </h3>
              <p className="text-sm leading-relaxed text-slate-300">{facts.language_note}</p>
            </section>

            {/* Must-know phrase */}
            <section>
              <h3 className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-500">
                <span aria-hidden="true">💬</span> Local Expression
              </h3>
              <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3">
                <p className="font-mono text-sm text-emerald-200">{facts.must_know_phrase}</p>
              </div>
            </section>
          </div>
        ) : null}
      </div>
    </div>
  );
}
