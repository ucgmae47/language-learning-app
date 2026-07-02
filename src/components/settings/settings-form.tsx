"use client";

import { useActionState } from "react";
import { CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { updateSettings, type SettingsFormState } from "@/app/actions/settings";
import { logout } from "@/app/actions/auth";
import type { Language } from "@/lib/supabase/types";

const LANG_META: Record<Language, { flag: string; label: string; href: string }> = {
  es: { flag: "🇪🇸", label: "Spanish", href: "/assessment/es" },
  fr: { flag: "🇫🇷", label: "French", href: "/assessment/fr" },
};

const ALL_LANGUAGES: Language[] = ["es", "fr"];

type Props = {
  displayName: string;
  email: string;
  wotdEmails: boolean;
  activeLanguage: Language;
  assessedLanguages: Language[];
};

export function SettingsForm({
  displayName,
  email,
  wotdEmails,
  activeLanguage,
  assessedLanguages,
}: Props) {
  const [state, action, isPending] = useActionState<SettingsFormState, FormData>(
    updateSettings,
    {},
  );

  const unaccessedLanguages = ALL_LANGUAGES.filter(
    (l) => !assessedLanguages.includes(l),
  );

  return (
    <div className="space-y-8">
      {/* Profile */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="mb-5 text-base font-semibold text-slate-800">Profile</h2>
        <form action={action} className="space-y-5">
          {/* Display name */}
          <div className="space-y-1.5">
            <label
              htmlFor="display_name"
              className="block text-sm font-medium text-slate-700"
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
              className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-slate-800 placeholder:text-slate-400 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100 transition"
            />
          </div>

          {/* Email (read-only) */}
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-slate-700">
              Email address
            </label>
            <input
              type="email"
              value={email}
              readOnly
              className="w-full cursor-not-allowed rounded-lg border border-slate-100 bg-slate-50 px-4 py-2.5 text-slate-400"
            />
            <p className="text-xs text-slate-400">
              Email cannot be changed here. Contact support if needed.
            </p>
          </div>

          {/* WOTD email toggle */}
          <div className="flex items-start gap-3 rounded-xl border border-slate-100 bg-slate-50 p-4">
            <div className="relative mt-0.5 flex-shrink-0">
              <input
                id="email_notifications"
                name="email_notifications"
                type="checkbox"
                defaultChecked={wotdEmails}
                className="h-4 w-4 cursor-pointer rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label
                htmlFor="email_notifications"
                className="text-sm font-medium text-slate-700 cursor-pointer"
              >
                Word of the Day emails
              </label>
              <p className="text-xs text-slate-500 mt-0.5">
                Receive a daily vocabulary word in your inbox each morning.
              </p>
            </div>
          </div>

          {/* Feedback */}
          {state.error && (
            <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {state.error}
            </div>
          )}
          {state.success && (
            <div className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
              <CheckCircle className="h-4 w-4 shrink-0" />
              Settings saved!
            </div>
          )}

          <button
            type="submit"
            disabled={isPending}
            className="flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50 transition-colors"
          >
            {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            {isPending ? "Saving…" : "Save changes"}
          </button>
        </form>
      </section>

      {/* Languages */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="mb-1 text-base font-semibold text-slate-800">Languages</h2>
        <p className="mb-5 text-sm text-slate-500">
          Your CEFR level is determined by the assessment. Retake it anytime to update your score.
        </p>

        <div className="space-y-3">
          {assessedLanguages.map((lang) => {
            const meta = LANG_META[lang];
            const isActive = lang === activeLanguage;
            return (
              <div
                key={lang}
                className={`flex items-center justify-between rounded-xl border px-4 py-3 ${
                  isActive
                    ? "border-indigo-200 bg-indigo-50"
                    : "border-slate-200 bg-white"
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl">{meta.flag}</span>
                  <div>
                    <p className="text-sm font-medium text-slate-800">{meta.label}</p>
                    {isActive && (
                      <p className="text-xs text-indigo-600">Active language</p>
                    )}
                  </div>
                </div>
                <a
                  href={meta.href}
                  className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 hover:border-indigo-300 hover:text-indigo-700 transition-colors"
                >
                  Retake assessment
                </a>
              </div>
            );
          })}

          {/* Unaccessed languages */}
          {unaccessedLanguages.map((lang) => {
            const meta = LANG_META[lang];
            return (
              <div
                key={lang}
                className="flex items-center justify-between rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-3"
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl opacity-40">{meta.flag}</span>
                  <p className="text-sm text-slate-400">{meta.label} — not started</p>
                </div>
                <a
                  href={meta.href}
                  className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-700 transition-colors"
                >
                  Take assessment
                </a>
              </div>
            );
          })}
        </div>
      </section>

      {/* Danger zone */}
      <section className="rounded-2xl border border-red-100 bg-white p-6 shadow-sm">
        <h2 className="mb-1 text-base font-semibold text-slate-800">Account</h2>
        <p className="mb-4 text-sm text-slate-500">
          Signing out will end your current session on this device.
        </p>
        <form action={logout}>
          <button
            type="submit"
            className="rounded-lg border border-red-200 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
          >
            Sign out
          </button>
        </form>
      </section>
    </div>
  );
}
