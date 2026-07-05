"use client";

import { useState, useCallback } from "react";
import dynamic from "next/dynamic";
import { CountryPanel } from "@/components/explore/country-panel";
import { getCountriesForLanguage, LANGUAGE_META } from "@/lib/explore/country-data";
import type { CountryEntry } from "@/lib/explore/country-data";
import type { CountryInfoResponse } from "@/app/api/explore/country/route";
import type { Language } from "@/lib/supabase/types";

// Dynamic import with ssr:false avoids d3-geo SSR issues
const WorldMap = dynamic(
  () => import("@/components/explore/world-map").then((m) => m.WorldMap),
  { ssr: false, loading: () => <MapSkeleton /> },
);

function MapSkeleton() {
  return (
    <div className="flex h-full w-full items-center justify-center">
      <div className="flex flex-col items-center gap-3 text-slate-500">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-slate-600 border-t-amber-400" />
        <span className="text-xs">Loading map…</span>
      </div>
    </div>
  );
}

type Props = {
  language: Language;
};

export function ExploreClient({ language }: Props) {
  const meta = LANGUAGE_META[language];
  const highlightedCountries = getCountriesForLanguage(language);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedEntry, setSelectedEntry] = useState<CountryEntry | null>(null);
  const [countryInfo, setCountryInfo] = useState<CountryInfoResponse | null>(null);
  const [isLoadingInfo, setIsLoadingInfo] = useState(false);
  const [infoError, setInfoError] = useState<string | null>(null);

  const handleCountryClick = useCallback(
    async (id: string, entry: CountryEntry) => {
      // If same country is clicked, deselect
      if (id === selectedId) {
        setSelectedId(null);
        setSelectedEntry(null);
        setCountryInfo(null);
        return;
      }

      setSelectedId(id);
      setSelectedEntry(entry);
      setCountryInfo(null);
      setIsLoadingInfo(true);
      setInfoError(null);

      try {
        const res = await fetch(
          `/api/explore/country?alpha2=${entry.alpha2}&name=${encodeURIComponent(entry.name)}&language=${language}`,
        );
        if (!res.ok) throw new Error("Failed to load");
        const data = await res.json() as CountryInfoResponse;
        setCountryInfo(data);
      } catch {
        setInfoError("Couldn't load info for this country. Please try again.");
      } finally {
        setIsLoadingInfo(false);
      }
    },
    [selectedId, language],
  );

  function handleClose() {
    setSelectedId(null);
    setSelectedEntry(null);
    setCountryInfo(null);
  }

  const isSpanish = language === "es";
  const highlightGrad = isSpanish
    ? "from-amber-500 to-orange-500"
    : "from-blue-500 to-indigo-500";
  const highlightDot = isSpanish ? "bg-amber-400" : "bg-blue-400";

  return (
    <div className="flex h-full flex-col gap-0 lg:flex-row">
      {/* ── Map pane ──────────────────────────────────────────────────────── */}
      <div
        className={`relative flex-1 overflow-hidden transition-all duration-300 ${
          selectedEntry ? "lg:basis-3/5" : "lg:basis-full"
        }`}
      >
        {/* Instructions overlay when nothing selected */}
        {!selectedEntry && (
          <div className="pointer-events-none absolute inset-x-0 bottom-6 z-10 flex justify-center">
            <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-black/60 px-4 py-2.5 backdrop-blur-sm">
              <div className={`h-2.5 w-2.5 rounded-full ${highlightDot} animate-pulse`} />
              <p className="text-xs font-semibold text-white">
                Click any highlighted country to explore
              </p>
            </div>
          </div>
        )}

        {/* Country count badge */}
        <div className="pointer-events-none absolute left-4 top-4 z-10">
          <div
            className={`flex items-center gap-1.5 rounded-xl bg-gradient-to-r px-3 py-1.5 text-xs font-bold text-white shadow-lg ${highlightGrad}`}
          >
            <span aria-hidden="true">{meta.flag}</span>
            {meta.count} countries
          </div>
        </div>

        {/* Map */}
        <div className="h-full w-full">
          <WorldMap
            language={language}
            highlightedCountries={highlightedCountries}
            selectedId={selectedId}
            onCountryClick={(id, entry) => void handleCountryClick(id, entry)}
          />
        </div>
      </div>

      {/* ── Info panel ────────────────────────────────────────────────────── */}
      {selectedEntry && (
        <div
          className={`flex flex-col border-t border-white/8 bg-[#0d0d1e] lg:basis-2/5 lg:border-l lg:border-t-0 ${
            selectedEntry ? "h-[55vh] lg:h-full" : "h-0"
          } transition-all duration-300`}
        >
          <CountryPanel
            entry={selectedEntry}
            info={countryInfo}
            isLoading={isLoadingInfo}
            error={infoError}
            onClose={handleClose}
          />
        </div>
      )}
    </div>
  );
}
