import type { Language } from "@/lib/supabase/types";

export type CountryEntry = {
  name: string;
  alpha2: string;
  flag: string;
};

/**
 * ISO 3166-1 numeric codes → country metadata.
 * These keys match the `id` field in the world-atlas topojson.
 */
export const SPANISH_SPEAKING_COUNTRIES: Record<string, CountryEntry> = {
  "32":  { name: "Argentina",           alpha2: "AR", flag: "🇦🇷" },
  "68":  { name: "Bolivia",             alpha2: "BO", flag: "🇧🇴" },
  "152": { name: "Chile",               alpha2: "CL", flag: "🇨🇱" },
  "170": { name: "Colombia",            alpha2: "CO", flag: "🇨🇴" },
  "188": { name: "Costa Rica",          alpha2: "CR", flag: "🇨🇷" },
  "192": { name: "Cuba",                alpha2: "CU", flag: "🇨🇺" },
  "214": { name: "Dominican Republic",  alpha2: "DO", flag: "🇩🇴" },
  "218": { name: "Ecuador",             alpha2: "EC", flag: "🇪🇨" },
  "222": { name: "El Salvador",         alpha2: "SV", flag: "🇸🇻" },
  "226": { name: "Equatorial Guinea",   alpha2: "GQ", flag: "🇬🇶" },
  "320": { name: "Guatemala",           alpha2: "GT", flag: "🇬🇹" },
  "340": { name: "Honduras",            alpha2: "HN", flag: "🇭🇳" },
  "484": { name: "Mexico",              alpha2: "MX", flag: "🇲🇽" },
  "558": { name: "Nicaragua",           alpha2: "NI", flag: "🇳🇮" },
  "591": { name: "Panama",              alpha2: "PA", flag: "🇵🇦" },
  "600": { name: "Paraguay",            alpha2: "PY", flag: "🇵🇾" },
  "604": { name: "Peru",                alpha2: "PE", flag: "🇵🇪" },
  "630": { name: "Puerto Rico",         alpha2: "PR", flag: "🇵🇷" },
  "724": { name: "Spain",               alpha2: "ES", flag: "🇪🇸" },
  "858": { name: "Uruguay",             alpha2: "UY", flag: "🇺🇾" },
  "862": { name: "Venezuela",           alpha2: "VE", flag: "🇻🇪" },
};

export const FRENCH_SPEAKING_COUNTRIES: Record<string, CountryEntry> = {
  "56":  { name: "Belgium",                         alpha2: "BE", flag: "🇧🇪" },
  "120": { name: "Cameroon",                         alpha2: "CM", flag: "🇨🇲" },
  "124": { name: "Canada",                           alpha2: "CA", flag: "🇨🇦" },
  "178": { name: "Republic of Congo",                alpha2: "CG", flag: "🇨🇬" },
  "180": { name: "DR Congo",                         alpha2: "CD", flag: "🇨🇩" },
  "204": { name: "Benin",                            alpha2: "BJ", flag: "🇧🇯" },
  "226": { name: "Equatorial Guinea",                alpha2: "GQ", flag: "🇬🇶" },
  "250": { name: "France",                           alpha2: "FR", flag: "🇫🇷" },
  "266": { name: "Gabon",                            alpha2: "GA", flag: "🇬🇦" },
  "324": { name: "Guinea",                           alpha2: "GN", flag: "🇬🇳" },
  "332": { name: "Haiti",                            alpha2: "HT", flag: "🇭🇹" },
  "384": { name: "Côte d'Ivoire",                    alpha2: "CI", flag: "🇨🇮" },
  "442": { name: "Luxembourg",                       alpha2: "LU", flag: "🇱🇺" },
  "450": { name: "Madagascar",                       alpha2: "MG", flag: "🇲🇬" },
  "466": { name: "Mali",                             alpha2: "ML", flag: "🇲🇱" },
  "478": { name: "Mauritania",                       alpha2: "MR", flag: "🇲🇷" },
  "492": { name: "Monaco",                           alpha2: "MC", flag: "🇲🇨" },
  "562": { name: "Niger",                            alpha2: "NE", flag: "🇳🇪" },
  "646": { name: "Rwanda",                           alpha2: "RW", flag: "🇷🇼" },
  "686": { name: "Senegal",                          alpha2: "SN", flag: "🇸🇳" },
  "756": { name: "Switzerland",                      alpha2: "CH", flag: "🇨🇭" },
  "768": { name: "Togo",                             alpha2: "TG", flag: "🇹🇬" },
  "854": { name: "Burkina Faso",                     alpha2: "BF", flag: "🇧🇫" },
};

export function getCountriesForLanguage(
  language: Language,
): Record<string, CountryEntry> {
  return language === "fr"
    ? FRENCH_SPEAKING_COUNTRIES
    : SPANISH_SPEAKING_COUNTRIES;
}

export function getCountryByNumericId(
  id: string,
  language: Language,
): CountryEntry | null {
  const map = getCountriesForLanguage(language);
  return map[id] ?? null;
}

export const LANGUAGE_META: Record<
  Language,
  { name: string; flag: string; langName: string; accent: string; count: number }
> = {
  es: {
    name: "Spanish-Speaking World",
    flag: "🇪🇸",
    langName: "Spanish",
    accent: "from-amber-500 to-orange-600",
    count: Object.keys(SPANISH_SPEAKING_COUNTRIES).length,
  },
  fr: {
    name: "French-Speaking World",
    flag: "🇫🇷",
    langName: "French",
    accent: "from-blue-500 to-indigo-600",
    count: Object.keys(FRENCH_SPEAKING_COUNTRIES).length,
  },
};
