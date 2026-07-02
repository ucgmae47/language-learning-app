"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Check } from "lucide-react";
import { saveLanguage } from "@/app/actions/language";
import type { Language } from "@/lib/supabase/types";

const LANGUAGES: {
  id: Language;
  flag: string;
  label: string;
  description: string;
  tutorName: string;
}[] = [
  {
    id: "es",
    flag: "🇪🇸",
    label: "Spanish",
    description: "Practice with Lucía, your Spanish-speaking tutor. Ideal for travel, work, and culture across Spain and Latin America.",
    tutorName: "Lucía",
  },
  {
    id: "fr",
    flag: "🇫🇷",
    label: "French",
    description: "Practice with Sophie, your French-speaking tutor. Perfect for exploring Francophone culture, literature, and diplomacy.",
    tutorName: "Sophie",
  },
];

export function LanguagePicker({ initialLanguage = "es" }: { initialLanguage?: Language }) {
  const [selected, setSelected] = useState<Language>(initialLanguage);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleContinue() {
    setError(null);
    startTransition(async () => {
      const result = await saveLanguage(selected);
      if (result.error) {
        setError(result.error);
        return;
      }
      router.push("/onboarding/interests");
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-4 sm:grid-cols-2">
        {LANGUAGES.map((lang) => {
          const isSelected = selected === lang.id;
          return (
            <button
              key={lang.id}
              type="button"
              onClick={() => setSelected(lang.id)}
              disabled={isPending}
              className={`relative flex flex-col items-start gap-3 rounded-2xl border-2 p-6 text-left transition focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 ${
                isSelected
                  ? "border-emerald-500 bg-emerald-50 shadow-md"
                  : "border-slate-200 bg-white hover:border-emerald-200 hover:shadow-sm"
              } disabled:opacity-60`}
            >
              {isSelected && (
                <span className="absolute right-4 top-4 flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-white">
                  <Check className="h-3 w-3" aria-hidden="true" />
                </span>
              )}

              <span className="text-4xl" aria-hidden="true">
                {lang.flag}
              </span>

              <div>
                <p className="text-lg font-bold text-slate-900">{lang.label}</p>
                <p className="mt-1 text-xs text-slate-500">
                  Tutor: {lang.tutorName}
                </p>
              </div>

              <p className="text-sm leading-relaxed text-slate-600">
                {lang.description}
              </p>
            </button>
          );
        })}
      </div>

      {error && (
        <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </p>
      )}

      <button
        type="button"
        onClick={handleContinue}
        disabled={isPending}
        className="flex w-full items-center justify-center gap-2 rounded-full bg-emerald-600 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:opacity-60"
      >
        {isPending ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            Saving…
          </>
        ) : (
          "Continue →"
        )}
      </button>
    </div>
  );
}
