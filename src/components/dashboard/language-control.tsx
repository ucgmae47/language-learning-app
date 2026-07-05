"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2, Plus } from "lucide-react";
import { setActiveLanguage } from "@/app/actions/set-active-language";
import type { CefrLevel, Language } from "@/lib/supabase/types";

const LANG_META: Record<
  Language,
  { flag: string; label: string; assessmentHref: string }
> = {
  es: { flag: "🇪🇸", label: "Spanish", assessmentHref: "/assessment/es" },
  fr: { flag: "🇫🇷", label: "French", assessmentHref: "/assessment/fr" },
};

export type OwnedLanguage = {
  language: Language;
  cefr_level: CefrLevel;
};

type Props = {
  ownedLanguages: OwnedLanguage[];
  activeLanguage: Language;
  addableLanguages: Language[];
};

export function LanguageControl({
  ownedLanguages,
  activeLanguage,
  addableLanguages,
}: Props) {
  const [switchOpen, setSwitchOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const rootRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const active =
    ownedLanguages.find((lp) => lp.language === activeLanguage) ??
    ownedLanguages[0];
  const activeMeta = active ? LANG_META[active.language] : null;

  useEffect(() => {
    if (!switchOpen && !addOpen) return;

    function handleClickOutside(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setSwitchOpen(false);
        setAddOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setSwitchOpen(false);
        setAddOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [switchOpen, addOpen]);

  function handleSwitch(lang: Language) {
    if (lang === activeLanguage || isPending) return;
    setSwitchOpen(false);
    startTransition(async () => {
      await setActiveLanguage(lang);
      router.refresh();
    });
  }

  function toggleSwitch() {
    setAddOpen(false);
    setSwitchOpen((prev) => !prev);
  }

  function toggleAdd() {
    setSwitchOpen(false);
    setAddOpen((prev) => !prev);
  }

  if (!active || !activeMeta) return null;

  return (
    <div ref={rootRef} className="relative">
      <div className="flex items-center rounded-xl border border-white/10 bg-white/5">
        {/* Active language — opens switcher */}
        <button
          type="button"
          onClick={toggleSwitch}
          aria-expanded={switchOpen}
          aria-haspopup="listbox"
          disabled={isPending}
          className="flex items-center gap-1.5 rounded-l-xl px-3 py-1.5 text-xs font-semibold text-slate-300 transition hover:bg-white/8 disabled:opacity-60"
        >
          {isPending ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin text-emerald-400" aria-hidden="true" />
          ) : (
            <span aria-hidden="true">{activeMeta.flag}</span>
          )}
          <span className="hidden sm:inline">{activeMeta.label}</span>
          <span className="rounded-md bg-emerald-500/20 px-1.5 py-0.5 text-emerald-400">
            {active.cefr_level}
          </span>
        </button>

        {/* Add language — separated by divider */}
        {addableLanguages.length > 0 && (
          <>
            <div className="h-5 w-px bg-white/10" aria-hidden="true" />
            <button
              type="button"
              onClick={toggleAdd}
              aria-expanded={addOpen}
              aria-haspopup="menu"
              aria-label="Add language"
              title="Add language"
              className="flex h-8 w-8 items-center justify-center rounded-r-xl text-emerald-400 transition hover:bg-emerald-500/10"
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
            </button>
          </>
        )}
      </div>

      {/* Switcher dropdown */}
      {switchOpen && (
        <div
          role="listbox"
          aria-label="Your languages"
          className="absolute right-0 top-full z-50 mt-2 min-w-[200px] overflow-hidden rounded-xl border border-white/10 bg-[#12121f] py-1 shadow-xl"
        >
          <p className="px-3 py-2 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            Your languages
          </p>
          {ownedLanguages.map((lp) => {
            const meta = LANG_META[lp.language];
            const isActive = lp.language === activeLanguage;
            return (
              <button
                key={lp.language}
                type="button"
                role="option"
                aria-selected={isActive}
                onClick={() => handleSwitch(lp.language)}
                disabled={isPending}
                className={`flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm font-medium transition disabled:opacity-60 ${
                  isActive
                    ? "bg-emerald-500/15 text-emerald-300"
                    : "text-slate-200 hover:bg-white/8"
                }`}
              >
                <span aria-hidden="true">{meta.flag}</span>
                <span className="flex-1">{meta.label}</span>
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
      )}

      {/* Add language dropdown */}
      {addOpen && (
        <div
          role="menu"
          aria-label="Add a language"
          className="absolute right-0 top-full z-50 mt-2 min-w-[200px] overflow-hidden rounded-xl border border-white/10 bg-[#12121f] py-1 shadow-xl"
        >
          <p className="px-3 py-2 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            Add language
          </p>
          {addableLanguages.map((lang) => {
            const meta = LANG_META[lang];
            return (
              <Link
                key={lang}
                href={meta.assessmentHref}
                role="menuitem"
                onClick={() => setAddOpen(false)}
                className="flex items-center gap-2 px-3 py-2.5 text-sm font-medium text-slate-200 transition hover:bg-white/8"
              >
                <span aria-hidden="true">{meta.flag}</span>
                {meta.label}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
