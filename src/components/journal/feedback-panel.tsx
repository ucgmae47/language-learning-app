"use client";

import type { JournalFeedback, CorrectionType } from "@/lib/supabase/types";

const TYPE_COLORS: Record<CorrectionType, string> = {
  spelling:    "bg-rose-500/20 text-rose-300",
  conjugation: "bg-amber-500/20 text-amber-300",
  word_choice: "bg-sky-500/20 text-sky-300",
  grammar:     "bg-orange-500/20 text-orange-300",
  accent:      "bg-violet-500/20 text-violet-300",
};

const TYPE_LABELS: Record<CorrectionType, string> = {
  spelling:    "Spelling",
  conjugation: "Conjugation",
  word_choice: "Word Choice",
  grammar:     "Grammar",
  accent:      "Accent",
};

function ScoreRing({ score }: { score: number }) {
  const color =
    score >= 80 ? "text-emerald-400" : score >= 60 ? "text-amber-400" : "text-rose-400";
  const ring =
    score >= 80
      ? "border-emerald-500/60 shadow-emerald-500/20"
      : score >= 60
        ? "border-amber-500/60 shadow-amber-500/20"
        : "border-rose-500/60 shadow-rose-500/20";

  return (
    <div
      className={`flex h-20 w-20 shrink-0 items-center justify-center rounded-full border-4 shadow-lg ${ring}`}
    >
      <span className={`text-3xl font-extrabold ${color}`}>{score}</span>
    </div>
  );
}

type Props = {
  feedback: JournalFeedback;
  onSave: () => void;
  onReset: () => void;
  isSaving: boolean;
  saved: boolean;
};

export function FeedbackPanel({ feedback, onSave, onReset, isSaving, saved }: Props) {
  const { corrections, overall_score, summary, strength, focus_area } = feedback;

  return (
    <div className="flex flex-col gap-6">
      {/* ── Score + summary ─────────────────────────────────────────────── */}
      <div className="flex items-center gap-5 rounded-2xl border border-white/10 bg-white/5 p-5">
        <ScoreRing score={overall_score} />
        <div className="flex-1">
          <p className="mb-1 text-xs font-bold uppercase tracking-wider text-slate-400">
            Overall Score
          </p>
          <p className="text-sm leading-6 text-slate-200">{summary}</p>
        </div>
      </div>

      {/* ── Strength / focus ────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4">
          <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-emerald-400">
            ✓ Strength
          </p>
          <p className="text-sm text-slate-200">{strength}</p>
        </div>
        <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 p-4">
          <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-amber-400">
            → Focus next
          </p>
          <p className="text-sm text-slate-200">{focus_area}</p>
        </div>
      </div>

      {/* ── Corrections list ─────────────────────────────────────────────── */}
      {corrections.length > 0 && (
        <div>
          <p className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-400">
            {corrections.length} correction{corrections.length !== 1 ? "s" : ""}
          </p>
          <div className="flex flex-col gap-2">
            {corrections.map((c, i) => (
              <div
                key={i}
                className="flex items-start gap-3 rounded-xl border border-white/8 bg-white/4 p-3"
              >
                <span
                  className={`mt-0.5 shrink-0 rounded-md px-2 py-0.5 text-[10px] font-bold uppercase ${TYPE_COLORS[c.type]}`}
                >
                  {TYPE_LABELS[c.type]}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm">
                    <span className="line-through text-slate-500">{c.original}</span>
                    <span className="mx-1.5 text-slate-600">→</span>
                    <span className="font-semibold text-emerald-400">{c.corrected}</span>
                  </p>
                  <p className="mt-0.5 text-xs text-slate-400">{c.explanation}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {corrections.length === 0 && (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-center">
          <p className="text-2xl">🎉</p>
          <p className="mt-1 text-sm font-semibold text-emerald-300">No errors found — flawless writing!</p>
        </div>
      )}

      {/* ── Actions ──────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onSave}
          disabled={isSaving || saved}
          className="flex-1 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 py-3 text-sm font-bold text-white shadow-lg shadow-emerald-500/20 transition hover:from-emerald-400 hover:to-teal-500 disabled:opacity-50"
        >
          {saved ? "✓ Saved to Journal" : isSaving ? "Saving…" : "Save Entry"}
        </button>
        <button
          type="button"
          onClick={onReset}
          className="rounded-xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold text-slate-300 transition hover:bg-white/10 hover:text-white"
        >
          Write Again
        </button>
      </div>
    </div>
  );
}
