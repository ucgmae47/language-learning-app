"use client";

import { useActionState, useState } from "react";
import { CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import {
  updateSettings,
  updateLanguageLevel,
  type SettingsFormState,
} from "@/app/actions/settings";
import {
  updateUserInterests,
  type InterestsFormState,
} from "@/app/actions/interests";
import { logout } from "@/app/actions/auth";
import { INTEREST_TOPICS } from "@/lib/interests/topics";
import type { CefrLevel, InterestTopic, Language } from "@/lib/supabase/types";

const LANG_META: Record<Language, { flag: string; label: string; href: string }> = {
  es: { flag: "🇪🇸", label: "Spanish", href: "/assessment/es" },
  fr: { flag: "🇫🇷", label: "French", href: "/assessment/fr" },
};

const CEFR_LEVELS: CefrLevel[] = ["A1", "A2", "B1", "B2", "C1", "C2"];

const LEVEL_LABELS: Record<CefrLevel, string> = {
  A1: "Beginner",
  A2: "Elementary",
  B1: "Intermediate",
  B2: "Upper-Intermediate",
  C1: "Advanced",
  C2: "Mastery",
};

const ALL_LANGUAGES: Language[] = ["es", "fr"];

export type AssessedLanguage = {
  language: Language;
  cefr_level: CefrLevel;
};

type Props = {
  displayName: string;
  email: string;
  wotdEmails: boolean;
  activeLanguage: Language;
  assessedLanguages: AssessedLanguage[];
  selectedInterests: InterestTopic[];
};

export function SettingsForm({
  displayName,
  email,
  wotdEmails,
  activeLanguage,
  assessedLanguages,
  selectedInterests,
}: Props) {
  const [state, action, isPending] = useActionState<SettingsFormState, FormData>(
    updateSettings,
    {},
  );
  const [levelState, levelAction, levelPending] = useActionState<
    SettingsFormState,
    FormData
  >(updateLanguageLevel, {});
  const [interestsState, interestsAction, interestsPending] = useActionState<
    InterestsFormState,
    FormData
  >(updateUserInterests, {});
  const [interestSelection, setInterestSelection] = useState<Set<InterestTopic>>(
    () => new Set(selectedInterests),
  );

  const assessedCodes = assessedLanguages.map((l) => l.language);
  const unaccessedLanguages = ALL_LANGUAGES.filter(
    (l) => !assessedCodes.includes(l),
  );

  function toggleInterest(id: InterestTopic) {
    setInterestSelection((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <div className="space-y-6">
      {/* Profile */}
      <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
        <h2 className="mb-5 text-base font-bold text-white">Profile</h2>
        <form action={action} className="space-y-5">
          <div className="space-y-2">
            <label
              htmlFor="display_name"
              className="block text-sm font-semibold text-slate-300"
            >
              Display name
            </label>
            <input
              id="display_name"
              name="display_name"
              type="text"
              defaultValue={displayName}
              maxLength={60}
              required
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-white placeholder-slate-500 outline-none transition focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/20"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-semibold text-slate-300">
              Email address
            </label>
            <input
              type="email"
              value={email}
              readOnly
              className="w-full cursor-not-allowed rounded-xl border border-white/5 bg-white/3 px-4 py-2.5 text-slate-500"
            />
            <p className="text-xs text-slate-600">Email cannot be changed here.</p>
          </div>

          <div className="flex items-start gap-3 rounded-2xl border border-white/8 bg-white/3 p-4">
            <input
              id="email_notifications"
              name="email_notifications"
              type="checkbox"
              defaultChecked={wotdEmails}
              className="mt-0.5 h-4 w-4 cursor-pointer rounded border-white/20 bg-white/10 text-emerald-500 focus:ring-emerald-500"
            />
            <div>
              <label
                htmlFor="email_notifications"
                className="cursor-pointer text-sm font-semibold text-slate-300"
              >
                Word of the Day emails
              </label>
              <p className="mt-0.5 text-xs text-slate-500">
                Receive a daily vocabulary word in your inbox each morning.
              </p>
            </div>
          </div>

          {state.error && (
            <div className="flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {state.error}
            </div>
          )}
          {state.success && (
            <div className="flex items-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-400">
              <CheckCircle className="h-4 w-4 shrink-0" />
              Settings saved!
            </div>
          )}

          <button
            type="submit"
            disabled={isPending}
            className="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-emerald-500/20 transition hover:from-emerald-400 hover:to-teal-400 disabled:opacity-50"
          >
            {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            {isPending ? "Saving…" : "Save changes"}
          </button>
        </form>
      </section>

      {/* Interests */}
      <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
        <h2 className="mb-1 text-base font-bold text-white">Interests</h2>
        <p className="mb-5 text-sm text-slate-400">
          These topics shape your personalised stories and chat starters.
        </p>

        <form action={interestsAction} className="space-y-4">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {INTEREST_TOPICS.map((topic) => {
              const checked = interestSelection.has(topic.id);
              return (
                <label
                  key={topic.id}
                  className={`flex cursor-pointer items-center gap-2 rounded-2xl border px-3 py-3 text-sm font-medium transition ${
                    checked
                      ? "border-emerald-500/40 bg-emerald-500/15 text-emerald-200"
                      : "border-white/10 bg-white/3 text-slate-300 hover:border-white/20"
                  }`}
                >
                  <input
                    type="checkbox"
                    name="topics"
                    value={topic.id}
                    checked={checked}
                    onChange={() => toggleInterest(topic.id)}
                    className="sr-only"
                  />
                  <span aria-hidden="true">{topic.emoji}</span>
                  {topic.label}
                </label>
              );
            })}
          </div>

          <p className="text-xs text-slate-500">
            {interestSelection.size === 0
              ? "Select at least one topic."
              : `${interestSelection.size} topic${interestSelection.size === 1 ? "" : "s"} selected`}
          </p>

          {interestsState.error && (
            <div className="flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {interestsState.error}
            </div>
          )}
          {interestsState.success && (
            <div className="flex items-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-400">
              <CheckCircle className="h-4 w-4 shrink-0" />
              Interests updated — refreshing your personalised content…
            </div>
          )}

          <button
            type="submit"
            disabled={interestsPending || interestSelection.size === 0}
            className="flex items-center gap-2 rounded-2xl bg-white/10 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-white/15 disabled:opacity-50"
          >
            {interestsPending && <Loader2 className="h-4 w-4 animate-spin" />}
            {interestsPending ? "Saving…" : "Save interests"}
          </button>
        </form>
      </section>

      {/* Languages */}
      <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
        <h2 className="mb-1 text-base font-bold text-white">Languages</h2>
        <p className="mb-5 text-sm text-slate-400">
          Override your CEFR level manually, or retake the assessment anytime.
          Changing level refreshes your personalised story and chat starters.
        </p>

        {levelState.error && (
          <div className="mb-4 flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {levelState.error}
          </div>
        )}
        {levelState.success && (
          <div className="mb-4 flex items-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-400">
            <CheckCircle className="h-4 w-4 shrink-0" />
            Level updated — refreshing your personalised content…
          </div>
        )}

        <div className="space-y-3">
          {assessedLanguages.map((lp) => {
            const meta = LANG_META[lp.language];
            const isActive = lp.language === activeLanguage;
            return (
              <div
                key={lp.language}
                className={`rounded-2xl border px-4 py-4 ${
                  isActive
                    ? "border-emerald-500/25 bg-emerald-500/10"
                    : "border-white/8 bg-white/3"
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{meta.flag}</span>
                    <div>
                      <p className="text-sm font-semibold text-white">{meta.label}</p>
                      {isActive && (
                        <p className="text-xs text-emerald-400">Active language</p>
                      )}
                    </div>
                  </div>
                  <a
                    href={meta.href}
                    className="rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-slate-400 transition hover:border-white/20 hover:text-white"
                  >
                    Retake assessment
                  </a>
                </div>

                <form
                  action={levelAction}
                  className="mt-4 flex flex-wrap items-end gap-3"
                >
                  <input type="hidden" name="language" value={lp.language} />
                  <div className="min-w-[10rem] flex-1 space-y-1.5">
                    <label
                      htmlFor={`cefr-${lp.language}`}
                      className="block text-xs font-semibold text-slate-400"
                    >
                      CEFR level
                    </label>
                    <select
                      id={`cefr-${lp.language}`}
                      name="cefr_level"
                      defaultValue={lp.cefr_level}
                      className="w-full rounded-xl border border-white/10 bg-[#0d0d18] px-3 py-2 text-sm text-white outline-none transition focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/20"
                    >
                      {CEFR_LEVELS.map((level) => (
                        <option key={level} value={level}>
                          {level} — {LEVEL_LABELS[level]}
                        </option>
                      ))}
                    </select>
                  </div>
                  <button
                    type="submit"
                    disabled={levelPending}
                    className="rounded-xl bg-white/10 px-4 py-2 text-xs font-bold text-white transition hover:bg-white/15 disabled:opacity-50"
                  >
                    {levelPending ? "Saving…" : "Update level"}
                  </button>
                </form>
              </div>
            );
          })}

          {unaccessedLanguages.map((lang) => {
            const meta = LANG_META[lang];
            return (
              <div
                key={lang}
                className="flex items-center justify-between rounded-2xl border border-dashed border-white/8 bg-white/3 px-4 py-3"
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl opacity-40">{meta.flag}</span>
                  <p className="text-sm text-slate-500">{meta.label} — not started</p>
                </div>
                <a
                  href={meta.href}
                  className="rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 px-3 py-1.5 text-xs font-bold text-white transition hover:from-emerald-400 hover:to-teal-400"
                >
                  Take assessment
                </a>
              </div>
            );
          })}
        </div>
      </section>

      {/* Account */}
      <section className="rounded-3xl border border-red-500/15 bg-red-500/5 p-6">
        <h2 className="mb-1 text-base font-bold text-white">Account</h2>
        <p className="mb-4 text-sm text-slate-400">
          Signing out will end your current session on this device.
        </p>
        <form action={logout}>
          <button
            type="submit"
            className="rounded-2xl border border-red-500/30 px-4 py-2 text-sm font-semibold text-red-400 transition hover:border-red-400/50 hover:bg-red-500/10 hover:text-red-300"
          >
            Sign out
          </button>
        </form>
      </section>
    </div>
  );
}
