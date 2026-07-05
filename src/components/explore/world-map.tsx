"use client";

import { ComposableMap, Geographies, Geography, ZoomableGroup } from "react-simple-maps";
import type { CountryEntry } from "@/lib/explore/country-data";
import type { Language } from "@/lib/supabase/types";

const GEO_URL =
  "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

type Props = {
  language: Language;
  highlightedCountries: Record<string, CountryEntry>;
  selectedId: string | null;
  onCountryClick: (id: string, entry: CountryEntry) => void;
};

const LANG_COLORS = {
  es: {
    highlight: "#f59e0b",    // amber-400
    highlightHover: "#fbbf24", // amber-300
    selected: "#f97316",     // orange-500
    selectedHover: "#fb923c", // orange-400
  },
  fr: {
    highlight: "#6366f1",    // indigo-500
    highlightHover: "#818cf8", // indigo-400
    selected: "#3b82f6",     // blue-500
    selectedHover: "#60a5fa", // blue-400
  },
};

export function WorldMap({ language, highlightedCountries, selectedId, onCountryClick }: Props) {
  const colors = LANG_COLORS[language];

  return (
    <ComposableMap
      projection="geoMercator"
      projectionConfig={{ scale: 120, center: [10, 20] }}
      style={{ width: "100%", height: "100%" }}
    >
      <ZoomableGroup zoom={1} minZoom={0.8} maxZoom={5}>
        <Geographies geography={GEO_URL}>
          {({ geographies }) =>
            geographies.map((geo) => {
              const id = String(geo.id);
              const entry = highlightedCountries[id];
              const isHighlighted = Boolean(entry);
              const isSelected = id === selectedId;

              return (
                <Geography
                  key={geo.rsmKey}
                  geography={geo}
                  onClick={() => {
                    if (entry) onCountryClick(id, entry);
                  }}
                  tabIndex={isHighlighted ? 0 : -1}
                  onKeyDown={(e) => {
                    if ((e.key === "Enter" || e.key === " ") && entry) {
                      onCountryClick(id, entry);
                    }
                  }}
                  aria-label={entry ? `${entry.flag} ${entry.name}` : undefined}
                  style={{
                    default: {
                      fill: isSelected
                        ? colors.selected
                        : isHighlighted
                          ? colors.highlight
                          : "#1e293b",
                      stroke: isSelected
                        ? "#fff"
                        : isHighlighted
                          ? "#0f172a"
                          : "#0f172a",
                      strokeWidth: isSelected ? 0.8 : 0.3,
                      outline: "none",
                      cursor: isHighlighted ? "pointer" : "default",
                      transition: "fill 120ms ease",
                    },
                    hover: {
                      fill: isSelected
                        ? colors.selectedHover
                        : isHighlighted
                          ? colors.highlightHover
                          : "#334155",
                      stroke: isHighlighted ? "#0f172a" : "#0f172a",
                      strokeWidth: 0.3,
                      outline: "none",
                      cursor: isHighlighted ? "pointer" : "default",
                    },
                    pressed: {
                      fill: isHighlighted ? colors.selected : "#1e293b",
                      outline: "none",
                    },
                  }}
                />
              );
            })
          }
        </Geographies>
      </ZoomableGroup>
    </ComposableMap>
  );
}
