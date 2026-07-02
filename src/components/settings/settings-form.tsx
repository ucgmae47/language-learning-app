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
    <div className="space-y-6">
      {/* Profile */}
      <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
        <h2 className="mb-5 text-base font-bold text-white">Profile</h2>
        <form action={action} className="space-y-5">
          <div className="space-y-2">
            <label htmlFor="display_name" className="block text-sm font-semibold text-slate-300">
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
            <p className="text-xs text-slate-600">
              Email cannot be changed here.
            </p>
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
              <label htmlFor="email_notifications" className="cursor-pointer text-sm font-semibold text-slate-300">
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

      {/* Languages */}
      <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
        <h2 className="mb-1 text-base font-bold text-white">Languages</h2>
        <p className="mb-5 text-sm text-slate-400">
          Your CEFR level is set by the assessment. Retake it anytime.
        </p>

        <div className="space-y-3">
          {assessedLanguages.map((lang) => {
            const meta = LANG_META[lang];
            const isActive = lang === activeLanguage;
            return (
              <div
                key={lang}
                className={`flex items-center justify-between rounded-2xl border px-4 py-3 ${
                  isActive
                    ? "border-emerald-500/25 bg-emerald-500/10"
                    : "border-white/8 bg-white/3"
                }`}
              >
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
