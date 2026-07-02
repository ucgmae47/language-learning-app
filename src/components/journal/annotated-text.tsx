"use client";

import { useState } from "react";
import type { JournalCorrection, CorrectionType } from "@/lib/supabase/types";

// ── Color map per correction type ────────────────────────────────────────────

const TYPE_STYLES: Record<
  CorrectionType,
  { bg: string; border: string; badge: string; label: string }
> = {
  spelling:    { bg: "bg-rose-500/15",   border: "border-rose-500/40",   badge: "bg-rose-500/20 text-rose-300",    label: "Spelling" },
  conjugation: { bg: "bg-amber-500/15",  border: "border-amber-500/40",  badge: "bg-amber-500/20 text-amber-300",  label: "Conjugation" },
  word_choice: { bg: "bg-sky-500/15",    border: "border-sky-500/40",    badge: "bg-sky-500/20 text-sky-300",      label: "Word choice" },
  grammar:     { bg: "bg-orange-500/15", border: "border-orange-500/40", badge: "bg-orange-500/20 text-orange-300",label: "Grammar" },
  accent:      { bg: "bg-violet-500/15", border: "border-violet-500/40", badge: "bg-violet-500/20 text-violet-300",label: "Accent" },
};

// ── Annotation algorithm ─────────────────────────────────────────────────────

type Segment =
  | { kind: "text"; value: string }
  | { kind: "correction"; value: string; correction: JournalCorrection };

function buildSegments(text: string, corrections: JournalCorrection[]): Segment[] {
  // Find each correction's position; skip any that can't be located.
  const positioned = corrections
    .map((c) => {
      const pos = text.indexOf(c.original);
      if (pos === -1) {
        // case-insensitive fallback
        const lower = text.toLowerCase().indexOf(c.original.toLowerCase());
        return lower === -1 ? null : { c, pos: lower };
      }
      return { c, pos };
    })
    .filter((x): x is { c: JournalCorrection; pos: number } => x !== null)
    .sort((a, b) => a.pos - b.pos);

  const segments: Segment[] = [];
  let cursor = 0;

  for (const { c, pos } of positioned) {
    if (pos < cursor) continue; // overlapping — skip
    if (pos > cursor) {
      segments.push({ kind: "text", value: text.slice(cursor, pos) });
    }
    segments.push({ kind: "correction", value: text.slice(pos, pos + c.original.length), correction: c });
    cursor = pos + c.original.length;
  }

  if (cursor < text.length) {
    segments.push({ kind: "text", value: text.slice(cursor) });
  }

  return segments;
}

// ── Correction token (inline) ────────────────────────────────────────────────

function CorrectionToken({ segment }: { segment: Extract<Segment, { kind: "correction" }> }) {
  const [open, setOpen] = useState(false);
  const { correction } = segment;
  const style = TYPE_STYLES[correction.type];

  return (
    <span className="relative inline">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`
          relative inline-flex cursor-pointer flex-col items-start rounded-sm border
          px-0.5 pb-0.5 align-baseline transition
          ${style.bg} ${style.border}
          hover:brightness-110
        `}
        aria-label={`Correction: ${correction.corrected}`}
      >
        {/* Strikethrough original */}
        <span className="line-through opacity-60 text-slate-400 text-sm leading-snug">
          {segment.value}
        </span>
        {/* Correction shown immediately below */}
        <span className="text-emerald-400 text-xs font-semibold leading-tight">
          {correction.corrected}
        </span>
      </button>

      {/* Tooltip / popover with explanation */}
      {open && (
        <span
          className={`
            absolute bottom-full left-0 z-50 mb-2 w-64 rounded-xl border p-3 shadow-xl
            ${style.bg} ${style.border} bg-[#0d0d1e]
          `}
          role="tooltip"
        >
          <span className={`mb-1.5 inline-block rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${style.badge}`}>
            {style.label}
          </span>
          <span className="block text-xs text-slate-300 leading-5">{correction.explanation}</span>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); setOpen(false); }}
            className="mt-2 block text-[10px] text-slate-500 hover:text-slate-300"
          >
            close ✕
          </button>
        </span>
      )}
    </span>
  );
}

// ── Public component ─────────────────────────────────────────────────────────

type Props = {
  text: string;
  corrections: JournalCorrection[];
};

export function AnnotatedText({ text, corrections }: Props) {
  const segments = buildSegments(text, corrections);

  return (
    <p className="whitespace-pre-wrap text-base leading-8 text-slate-200">
      {segments.map((seg, i) =>
        seg.kind === "text" ? (
          <span key={i}>{seg.value}</span>
        ) : (
          <CorrectionToken key={i} segment={seg} />
        ),
      )}
    </p>
  );
}
