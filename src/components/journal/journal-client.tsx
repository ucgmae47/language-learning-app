"use client";

import { useState, useTransition } from "react";
import { Sparkles, Clock, BookOpen } from "lucide-react";
import { AnnotatedText } from "@/components/journal/annotated-text";
import { FeedbackPanel } from "@/components/journal/feedback-panel";
import { saveJournalEntry } from "@/app/actions/journal";
import type { JournalEntry, JournalFeedback, Language } from "@/lib/supabase/types";

const LANG_META: Record<Language, { name: string; flag: string; placeholder: string }> = {
  es: {
    name: "Spanish",
    flag: "🇪🇸",
    placeholder:
      "Escribe aquí en español… (Write anything — describe your day, tell a story, share an opinion.)",
  },
  fr: {
    name: "French",
    flag: "🇫🇷",
    placeholder:
      "Écrivez ici en français… (Write anything — describe your day, tell a story, share an opinion.)",
  },
};

type View = "editor" | "reviewing" | "feedback";

type Props = {
  language: Language;
  cefrLevel: string;
  pastEntries: JournalEntry[];
};

export function JournalClient({ language, cefrLevel, pastEntries }: Props) {
  const [view, setView] = useState<View>("editor");
  const [draft, setDraft] = useState("");
  const [feedback, setFeedback] = useState<JournalFeedback | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [isSaving, startSaving] = useTransition();
  const [showHistory, setShowHistory] = useState(false);

  const meta = LANG_META[language];
  const wordCount = draft.trim() ? draft.trim().split(/\s+/).length : 0;

  // ── Submit for evaluation ──────────────────────────────────────────────────
  async function evaluate() {
    setErrorMsg(null);
    setView("reviewing");
    try {
      const res = await fetch("/api/journal/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: draft, language, cefrLevel }),
      });
      const json = (await res.json()) as { feedback?: JournalFeedback; error?: string };
      if (!res.ok || json.error) throw new Error(json.error ?? "Evaluation failed.");
      setFeedback(json.feedback!);
      setView("feedback");
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Something went wrong.");
      setView("editor");
    }
  }

  // ── Save entry ─────────────────────────────────────────────────────────────
  function handleSave() {
    if (!feedback) return;
    startSaving(async () => {
      await saveJournalEntry(draft, language, feedback);
      setSaved(true);
    });
  }

  // ── Reset ──────────────────────────────────────────────────────────────────
  function reset() {
    setDraft("");
    setFeedback(null);
    setErrorMsg(null);
    setSaved(false);
    setView("editor");
  }

  // ── History panel ──────────────────────────────────────────────────────────
  if (showHistory) {
    return (
      <div className="mx-auto max-w-3xl space-y-4 px-4 py-8">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-white">Past Entries</h2>
          <button
            type="button"
            onClick={() => setShowHistory(false)}
            className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-300 hover:bg-white/10"
          >
            ← Back
          </button>
        </div>

        {pastEntries.length === 0 && (
          <p className="text-center text-slate-400 py-12">No saved entries yet.</p>
        )}

        {pastEntries.map((entry) => (
          <div
            key={entry.id}
            className="rounded-2xl border border-white/10 bg-white/5 p-5 space-y-3"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <Clock className="h-3.5 w-3.5" />
                {new Date(entry.created_at).toLocaleDateString(undefined, {
                  year: "numeric", month: "short", day: "numeric",
                })}
              </div>
              {entry.score !== null && (
                <span
                  className={`rounded-xl px-2.5 py-0.5 text-xs font-bold ${
                    entry.score >= 80
                      ? "bg-emerald-500/20 text-emerald-300"
                      : entry.score >= 60
                        ? "bg-amber-500/20 text-amber-300"
                        : "bg-rose-500/20 text-rose-300"
                  }`}
                >
                  {entry.score}/100
                </span>
              )}
            </div>
            <p className="text-sm leading-7 text-slate-300 whitespace-pre-wrap line-clamp-4">
              {entry.content}
            </p>
            {entry.feedback && (
              <p className="text-xs text-slate-500">
                {entry.feedback.corrections.length} correction
                {entry.feedback.corrections.length !== 1 ? "s" : ""} · {entry.feedback.summary}
              </p>
            )}
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-8">
      {/* ── Page heading ──────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-3xl" aria-hidden="true">{meta.flag}</span>
          <div>
            <h1 className="text-2xl font-extrabold text-white">Language Journal</h1>
            <p className="text-sm text-slate-400">Write in {meta.name} · AI evaluates your entry</p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setShowHistory(true)}
          className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-300 hover:bg-white/10"
        >
          <BookOpen className="h-4 w-4" />
          History
        </button>
      </div>

      {/* ── Error banner ──────────────────────────────────────────────────── */}
      {errorMsg && (
        <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-300">
          {errorMsg}
        </div>
      )}

      {/* ── Editor view ───────────────────────────────────────────────────── */}
      {(view === "editor" || view === "reviewing") && (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder={meta.placeholder}
            rows={12}
            disabled={view === "reviewing"}
            className="w-full resize-none rounded-xl border border-white/10 bg-white/5 p-4 text-sm leading-7 text-white placeholder-slate-600 outline-none transition focus:border-emerald-500/40 focus:ring-2 focus:ring-emerald-500/15 disabled:opacity-60"
          />

          <div className="mt-4 flex items-center justify-between">
            <span className="text-xs text-slate-500">
              {wordCount} word{wordCount !== 1 ? "s" : ""}
            </span>

            <button
              type="button"
              onClick={() => void evaluate()}
              disabled={draft.trim().length < 10 || view === "reviewing"}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-violet-500/20 transition hover:from-violet-500 hover:to-indigo-500 disabled:opacity-40"
            >
              <Sparkles className="h-4 w-4" aria-hidden="true" />
              {view === "reviewing" ? "Evaluating…" : "Evaluate with AI"}
            </button>
          </div>
        </div>
      )}

      {/* ── Feedback view ─────────────────────────────────────────────────── */}
      {view === "feedback" && feedback && (
        <>
          {/* Annotated text */}
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
            <p className="mb-4 text-xs font-bold uppercase tracking-wider text-slate-400">
              Your Entry — click any highlighted word to see the correction
            </p>
            <AnnotatedText text={draft} corrections={feedback.corrections} />
          </div>

          {/* Feedback panel */}
          <FeedbackPanel
            feedback={feedback}
            onSave={handleSave}
            onReset={reset}
            isSaving={isSaving}
            saved={saved}
          />
        </>
      )}
    </div>
  );
}
