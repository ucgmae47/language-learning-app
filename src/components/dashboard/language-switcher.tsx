"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { setActiveLanguage } from "@/app/actions/set-active-language";
import type { Language, LanguageProfile } from "@/lib/supabase/types";

const LANG_META: Record<Language, { flag: string; label: string }> = {
  es: { flag: "🇪🇸", label: "Spanish" },
  fr: { flag: "🇫🇷", label: "French" },
};

type Props = {
  profiles: LanguageProfile[];
  activeLanguage: Language;
};

export function LanguageSwitcher({ profiles, activeLanguage }: Props) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleSwitch(lang: Language) {
    if (lang === activeLanguage || isPending) return;
    startTransition(async () => {
      await setActiveLanguage(lang);
      router.refresh();
    });
  }

  return (
    <div className="flex items-center gap-1 rounded-xl border border-white/10 bg-white/5 p-1">
      {profiles.map((lp) => {
        const meta = LANG_META[lp.language];
        const isActive = lp.language === activeLanguage;
        return (
          <button
            key={lp.language}
            type="button"
            onClick={() => handleSwitch(lp.language)}
            disabled={isPending}
            aria-pressed={isActive}
            title={`Switch to ${meta.label} (${lp.cefr_level})`}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition disabled:opacity-60 ${
              isActive
                ? "bg-emerald-500/20 text-emerald-400 shadow-sm"
                : "text-slate-400 hover:bg-white/8 hover:text-white"
            }`}
          >
            {isPending && !isActive ? (
              <Loader2 className="h-3 w-3 animate-spin" aria-hidden="true" />
            ) : (
              <span aria-hidden="true">{meta.flag}</span>
            )}
            {meta.label}
            <span
              className={`rounded-md px-1.5 py-0.5 text-[10px] font-black ${
                isActive
                  ? "bg-emerald-500/30 text-emerald-300"
                  : "bg-white/8 text-slate-500"
              }`}
            >
              {lp.cefr_level}
            </span>
          </button>
        );
      })}
    </div>
  );
}
