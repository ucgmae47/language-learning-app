"use client";

import { useState } from "react";
import { Loader2, Search } from "lucide-react";
import type { Language } from "@/lib/supabase/types";

type AnalyzerResult = {
  cefr_level: string;
  confidence: string;
  reasoning: string;
  complex_words: string;
  simplified_version: string;
  grammar_notes: string;
};

type Props = {
  language: Language;
};

const MAX_CHARS = 2000;

function cefrColor(level: string) {
  if (level.startsWith("A")) return "from-emerald-500 to-green-600 shadow-emerald-500/30";
  if (level.startsWith("B")) return "from-amber-500 to-yellow-600 shadow-amber-500/30";
  return "from-violet-500 to-purple-600 shadow-violet-500/30";
}

function confidenceColor(c: string) {
  if (c === "High") return "text-emerald-400 bg-emerald-500/20 border-emerald-500/30";
  if (c === "Medium") return "text-yellow-400 bg-yellow-500/20 border-yellow-500/30";
  return "text-red-400 bg-red-500/20 border-red-500/30";
}

export function AnalyzerClient({ language }: Props) {
  const [text, setText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<AnalyzerResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const langName = language === "es" ? "Spanish" : "French";

  async function analyze() {
    if (!text.trim()) return;
    setIsLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/analyzer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, language }),
      });
      if (!res.ok) throw new Error("Failed to analyze");
      const data = (await res.json()) as AnalyzerResult;
      setResult(data);
    } catch {
      setError("Analysis failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  const complexWords = result?.complex_words && result.complex_words !== "None found"
    ? result.complex_words.split(",").map((w) => w.trim()).filter(Boolean)
    : [];

  return (
    <div className="flex flex-col gap-6">
      {/* Input area */}
      <div className="rounded-2xl border border-white/8 bg-white/4 p-5 flex flex-col gap-3">
        <textarea
          value={text}
          onChange={(e) => {
            if (e.target.value.length <= MAX_CHARS) {
              setText(e.target.value);
              setResult(null);
            }
          }}
          rows={8}
          placeholder={`Paste any ${langName} text to analyze its difficulty level…`}
          className="w-full resize-none rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-slate-500 outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/30 leading-relaxed"
        />
        <div className="flex items-center justify-between">
          <span className={`text-xs ${text.length >= MAX_CHARS ? "text-red-400" : "text-slate-500"}`}>
            {text.length} / {MAX_CHARS} characters
          </span>
          <button
            type="button"
            onClick={() => void analyze()}
            disabled={!text.trim() || isLoading}
            className="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-violet-500 to-purple-600 px-6 py-2.5 text-sm font-bold text-white shadow-lg shadow-violet-500/30 transition hover:scale-[1.02] active:scale-95 disabled:opacity-40 disabled:hover:scale-100"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                Analyzing…
              </>
            ) : (
              <>
                <Search className="h-4 w-4" aria-hidden="true" />
                Analyze
              </>
            )}
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      {/* Results */}
      {result && (
        <div className="flex flex-col gap-4">
          {/* CEFR level + confidence */}
          <div className="flex items-center gap-4">
            <div
              className={`flex h-24 w-24 shrink-0 flex-col items-center justify-center rounded-2xl bg-gradient-to-br ${cefrColor(result.cefr_level)} shadow-xl`}
            >
              <span className="text-3xl font-extrabold text-white">{result.cefr_level}</span>
              <span className="text-xs text-white/70 font-medium">CEFR</span>
            </div>
            <div className="flex flex-col gap-2">
              <p className="text-lg font-extrabold text-white">Level {result.cefr_level}</p>
              <span
                className={`inline-flex rounded-xl border px-3 py-1 text-xs font-bold ${confidenceColor(result.confidence)}`}
              >
                {result.confidence} Confidence
              </span>
            </div>
          </div>

          {/* Reasoning */}
          <div className="rounded-2xl border border-white/8 bg-white/4 px-4 py-4">
            <p className="text-xs font-bold text-slate-400 mb-2">Analysis</p>
            <p className="text-sm text-slate-200 leading-relaxed">{result.reasoning}</p>
          </div>

          {/* Complex words */}
          {complexWords.length > 0 && (
            <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 px-4 py-4">
              <p className="text-xs font-bold text-amber-400 mb-2">Advanced Vocabulary</p>
              <div className="flex flex-wrap gap-2">
                {complexWords.map((word) => (
                  <span
                    key={word}
                    className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 text-xs font-semibold text-amber-300"
                  >
                    {word}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Simplified version */}
          {result.simplified_version !== "Text is already simple" && (
            <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-4">
              <p className="text-xs font-bold text-emerald-400 mb-2">Simplified Version (A2)</p>
              <p className="text-sm text-emerald-200/90 leading-relaxed">{result.simplified_version}</p>
            </div>
          )}

          {/* Grammar notes */}
          <div className="rounded-2xl border border-blue-500/20 bg-blue-500/10 px-4 py-4">
            <p className="text-xs font-bold text-blue-400 mb-2">Grammar Structures</p>
            <p className="text-sm text-blue-200/90 leading-relaxed">{result.grammar_notes}</p>
          </div>
        </div>
      )}
    </div>
  );
}
