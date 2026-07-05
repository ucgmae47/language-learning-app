"use client";

import { useState, useCallback, useTransition, useRef } from "react";
import {
  ArrowLeft, RefreshCw, Lightbulb, CheckCircle2, XCircle,
  ToggleLeft, ToggleRight, Loader2,
} from "lucide-react";
import Link from "next/link";
import { saveSentenceAttempt } from "@/app/actions/sentence-builder";
import type { Language, CefrLevel } from "@/lib/supabase/types";
import type { GeneratedSentence } from "@/app/api/sentence-builder/generate/route";
import type { JudgeResult } from "@/app/api/sentence-builder/judge/route";

const LANG_META: Record<Language, { name: string; flag: string }> = {
  es: { name: "Spanish", flag: "🇪🇸" },
  fr: { name: "French", flag: "🇫🇷" },
};

const TOPICS = ["Daily Life", "Travel", "Food", "Animals", "Work", "Family", "Sports", "Nature"] as const;

type InputMode = "tiles" | "type";
type Status = "idle" | "loading" | "building" | "judging" | "correct" | "wrong";

function normalize(s: string): string {
  return s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[.,!?;:'"¿¡]/g, "").trim();
}

type Props = {
  language: Language;
  cefrLevel: CefrLevel;
  initialStats: { total: number; correct: number; streak: number };
};

export function SentenceBuilderClient({ language, cefrLevel, initialStats }: Props) {
  const meta = LANG_META[language];

  const [mode, setMode] = useState<InputMode>("tiles");
  const [status, setStatus] = useState<Status>("idle");
  const [sentence, setSentence] = useState<GeneratedSentence | null>(null);
  const [placed, setPlaced] = useState<string[]>([]);
  const [bank, setBank] = useState<string[]>([]);
  const [typedAnswer, setTypedAnswer] = useState("");
  const [showHint, setShowHint] = useState(false);
  const [stats, setStats] = useState(initialStats);
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [judgeResult, setJudgeResult] = useState<JudgeResult | null>(null);
  const [isPending, startTransition] = useTransition();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const generate = useCallback(() => {
    setStatus("loading");
    setPlaced([]);
    setBank([]);
    setTypedAnswer("");
    setShowHint(false);
    setError(null);
    setJudgeResult(null);

    fetch("/api/sentence-builder/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ language, cefrLevel, topic: selectedTopic }),
    })
      .then(async (res) => {
        const data = await res.json() as GeneratedSentence & { error?: string };
        if (!res.ok || data.error) throw new Error(data.error ?? `Server error ${res.status}`);
        setSentence(data);
        setBank(data.allWords);
        setStatus("building");
        setTimeout(() => textareaRef.current?.focus(), 50);
      })
      .catch((err: Error) => {
        setError(err.message ?? "Something went wrong. Please try again.");
        setStatus("idle");
      });
  }, [language, cefrLevel, selectedTopic]);

  // ── Tile mode interaction ──────────────────────────────────────────────────
  const placeTile = useCallback((word: string, bankIndex: number) => {
    if (status !== "building") return;
    setBank((b) => b.filter((_, i) => i !== bankIndex));
    setPlaced((p) => [...p, word]);
  }, [status]);

  const removeTile = useCallback((placedIndex: number) => {
    if (status !== "building") return;
    const word = placed[placedIndex]!;
    setPlaced((p) => p.filter((_, i) => i !== placedIndex));
    setBank((b) => [...b, word]);
  }, [status, placed]);

  // ── Tile mode check ───────────────────────────────────────────────────────
  const checkTiles = useCallback(() => {
    if (!sentence || placed.length === 0) return;
    // sentence.words is in CORRECT order (API fixed)
    const placedNorm = placed.map(normalize).join(" ");
    const correctNorm = sentence.words.map(normalize).join(" ");
    const isCorrect = placedNorm === correctNorm;
    setStatus(isCorrect ? "correct" : "wrong");
    startTransition(async () => {
      await saveSentenceAttempt(language, sentence.english, sentence.target, isCorrect);
      setStats((s) => ({
        total: s.total + 1,
        correct: isCorrect ? s.correct + 1 : s.correct,
        streak: isCorrect ? s.streak + 1 : 0,
      }));
    });
  }, [sentence, placed, language]);

  // ── Type mode judge ───────────────────────────────────────────────────────
  const checkTyped = useCallback(() => {
    if (!sentence || !typedAnswer.trim()) return;
    setStatus("judging");
    setJudgeResult(null);

    fetch("/api/sentence-builder/judge", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        english: sentence.english,
        target: sentence.target,
        attempt: typedAnswer.trim(),
        language,
        cefrLevel,
      }),
    })
      .then(async (res) => {
        const data = await res.json() as JudgeResult & { error?: string };
        if (!res.ok || data.error) throw new Error(data.error ?? "Evaluation failed");
        setJudgeResult(data);
        setStatus(data.correct ? "correct" : "wrong");
        startTransition(async () => {
          await saveSentenceAttempt(language, sentence.english, sentence.target, data.correct);
          setStats((s) => ({
            total: s.total + 1,
            correct: data.correct ? s.correct + 1 : s.correct,
            streak: data.correct ? s.streak + 1 : 0,
          }));
        });
      })
      .catch((err: Error) => {
        setError(err.message ?? "Could not evaluate your answer.");
        setStatus("building");
      });
  }, [sentence, typedAnswer, language, cefrLevel]);

  // ── Helpers ───────────────────────────────────────────────────────────────
  const tileState = (word: string, idx: number): "neutral" | "correct" | "wrong" => {
    if (status !== "wrong" || mode !== "tiles") return "neutral";
    return normalize(word) === normalize(sentence?.words[idx] ?? "") ? "correct" : "wrong";
  };

  const accuracy = stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0;
  const isResult = status === "correct" || status === "wrong";

  return (
    <div className="flex min-h-screen flex-col bg-[#07070f]">
      {/* Header */}
      <header className="flex items-center justify-between border-b border-white/8 bg-gradient-to-r from-[#0d0d1e] to-[#12122a] px-6 py-4">
        <Link
          href="/dashboard"
          className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-300 hover:bg-white/10 hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" /> Dashboard
        </Link>
        <div className="text-center">
          <p className="font-extrabold text-white">🧩 Sentence Builder</p>
          <p className="text-xs text-slate-400">{meta.flag} {meta.name} · {cefrLevel}</p>
        </div>
        <div className="flex items-center gap-3 text-xs">
          {stats.streak > 0 && <span className="font-bold text-amber-400">🔥 {stats.streak}</span>}
          {stats.total > 0 && <span className="text-slate-400">{accuracy}%</span>}
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-2xl flex-col gap-5 px-4 py-8">

        {/* Stats */}
        {stats.total > 0 && (
          <div className="grid grid-cols-3 gap-3">
            {([["Attempted", stats.total], ["Correct", stats.correct], ["Streak", `${stats.streak} 🔥`]] as [string, string | number][]).map(([label, val]) => (
              <div key={label} className="rounded-2xl border border-white/8 bg-white/4 p-3 text-center">
                <p className="text-lg font-extrabold text-white">{val}</p>
                <p className="text-xs text-slate-500">{label}</p>
              </div>
            ))}
          </div>
        )}

        {/* Error banner */}
        {error && (
          <div className="flex items-start gap-2 rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3">
            <XCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-rose-400" />
            <p className="text-sm text-rose-300">{error}</p>
          </div>
        )}

        {/* ── Idle ─────────────────────────────────────────────────────── */}
        {status === "idle" && (
          <div className="flex flex-col items-center gap-6 rounded-3xl border border-white/10 bg-white/4 p-8 text-center">
            <span className="text-5xl">🧩</span>
            <div>
              <h2 className="text-xl font-extrabold text-white">Sentence Builder</h2>
              <p className="mt-2 text-slate-400">
                Translate the English sentence into {meta.name}. Use word tiles or switch to free-type mode for a harder challenge.
              </p>
            </div>

            {/* Topic picker */}
            <div className="w-full">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">Topic (optional)</p>
              <div className="flex flex-wrap justify-center gap-2">
                {TOPICS.map((t) => (
                  <button
                    key={t} type="button"
                    onClick={() => setSelectedTopic(selectedTopic === t ? null : t)}
                    className={`rounded-xl border px-3 py-1.5 text-sm font-medium transition ${
                      selectedTopic === t
                        ? "border-violet-500/50 bg-violet-500/20 text-violet-300"
                        : "border-white/10 bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white"
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <button type="button" onClick={generate}
              className="rounded-2xl bg-gradient-to-r from-violet-500 to-purple-600 px-8 py-4 text-lg font-bold text-white shadow-lg hover:opacity-90"
            >
              Generate Sentence
            </button>
          </div>
        )}

        {/* ── Loading ───────────────────────────────────────────────────── */}
        {status === "loading" && (
          <div className="flex flex-col items-center gap-4 py-16">
            <Loader2 className="h-10 w-10 animate-spin text-violet-500" />
            <p className="text-slate-400">Generating your sentence…</p>
          </div>
        )}

        {/* ── Active exercise ───────────────────────────────────────────── */}
        {(status === "building" || status === "judging" || isResult) && sentence && (
          <div className="flex flex-col gap-4">

            {/* Mode toggle */}
            <div className="flex items-center justify-end gap-2">
              <span className={`text-sm font-medium ${mode === "tiles" ? "text-white" : "text-slate-500"}`}>Tiles</span>
              <button
                type="button"
                onClick={() => {
                  if (isResult) return; // don't switch after answering
                  setMode((m) => m === "tiles" ? "type" : "tiles");
                  setPlaced([]);
                  setBank(sentence.allWords);
                  setTypedAnswer("");
                }}
                disabled={isResult}
                className="text-violet-400 disabled:opacity-30"
                title="Toggle input mode"
              >
                {mode === "type"
                  ? <ToggleRight className="h-7 w-7" />
                  : <ToggleLeft className="h-7 w-7" />}
              </button>
              <span className={`text-sm font-medium ${mode === "type" ? "text-white" : "text-slate-500"}`}>Free Type</span>
            </div>

            {/* English prompt */}
            <div className="rounded-2xl border border-white/10 bg-white/5 px-5 py-4">
              <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-1">Translate to {meta.name}</p>
              <p className="text-xl font-semibold text-white">{sentence.english}</p>
            </div>

            {/* Hint */}
            {showHint && (
              <div className="flex items-start gap-2 rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3">
                <Lightbulb className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-400" />
                <p className="text-sm text-amber-300">{sentence.hint}</p>
              </div>
            )}

            {/* ── TILE MODE ── */}
            {mode === "tiles" && (
              <>
                {/* Answer zone */}
                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">Your answer</p>
                  <div className={`min-h-[64px] rounded-2xl border-2 p-3 transition-colors ${
                    status === "correct" ? "border-emerald-500/50 bg-emerald-500/8" :
                    status === "wrong"   ? "border-rose-500/50 bg-rose-500/8" :
                                          "border-white/10 bg-white/4"
                  }`}>
                    {placed.length === 0 ? (
                      <p className="p-1 text-sm text-slate-600">Tap word tiles below to build your sentence…</p>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {placed.map((word, i) => {
                          const ts = tileState(word, i);
                          return (
                            <button
                              key={`placed-${i}`} type="button"
                              onClick={() => status === "building" && removeTile(i)}
                              disabled={status !== "building"}
                              className={`rounded-xl border px-3 py-1.5 text-sm font-semibold transition-all ${
                                status === "building"
                                  ? "border-violet-500/40 bg-violet-500/20 text-violet-200 hover:bg-violet-500/30 hover:scale-105"
                                  : ts === "correct"
                                  ? "border-emerald-500/50 bg-emerald-500/20 text-emerald-300"
                                  : ts === "wrong"
                                  ? "border-rose-500/50 bg-rose-500/20 text-rose-300 line-through"
                                  : "border-white/20 bg-white/10 text-white"
                              }`}
                            >
                              {word}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>

                {/* Word bank */}
                {status === "building" && (
                  <div>
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">Word bank</p>
                    <div className="flex flex-wrap gap-2 rounded-2xl border border-white/8 bg-white/3 p-3">
                      {bank.length === 0
                        ? <p className="p-1 text-sm text-slate-600">All words placed!</p>
                        : bank.map((word, i) => (
                          <button key={`bank-${i}`} type="button" onClick={() => placeTile(word, i)}
                            className="rounded-xl border border-white/15 bg-white/8 px-3 py-1.5 text-sm font-semibold text-slate-200 transition-all hover:bg-white/15 hover:scale-105 active:scale-95"
                          >
                            {word}
                          </button>
                        ))
                      }
                    </div>
                  </div>
                )}
              </>
            )}

            {/* ── TYPE MODE ── */}
            {mode === "type" && (
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">Type your translation</p>
                <textarea
                  ref={textareaRef}
                  value={typedAnswer}
                  onChange={(e) => setTypedAnswer(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey && status === "building") {
                      e.preventDefault();
                      checkTyped();
                    }
                  }}
                  disabled={isResult || status === "judging"}
                  placeholder={`Write the ${meta.name} translation here…`}
                  rows={3}
                  autoCorrect="off"
                  spellCheck={false}
                  className={`w-full resize-none rounded-2xl border-2 bg-white/5 px-4 py-3 text-base text-white placeholder-slate-600 outline-none transition-colors focus:border-violet-500/40 focus:ring-2 focus:ring-violet-500/15 disabled:opacity-60 ${
                    status === "correct" ? "border-emerald-500/50" :
                    status === "wrong"   ? "border-rose-500/50" :
                                          "border-white/10"
                  }`}
                />

                {/* AI judge detailed corrections */}
                {judgeResult && judgeResult.corrections.length > 0 && (
                  <div className="mt-3 flex flex-col gap-1.5">
                    {judgeResult.corrections.map((c, i) => (
                      <div key={i} className="flex flex-wrap items-baseline gap-1 rounded-xl border border-rose-500/20 bg-rose-500/8 px-3 py-2 text-sm">
                        <span className="font-semibold text-rose-300 line-through">{c.original}</span>
                        <span className="text-slate-400">→</span>
                        <span className="font-semibold text-emerald-300">{c.corrected}</span>
                        <span className="text-slate-500">({c.explanation})</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Result banners */}
            {status === "correct" && (
              <div className="flex items-start gap-3 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-5 py-4">
                <CheckCircle2 className="mt-0.5 h-6 w-6 flex-shrink-0 text-emerald-400" />
                <div>
                  <p className="font-bold text-emerald-300">
                    {judgeResult ? judgeResult.feedback : "Correct! 🎉"}
                  </p>
                  <p className="mt-0.5 text-sm text-emerald-400/80">{sentence.target}</p>
                </div>
              </div>
            )}
            {status === "wrong" && (
              <div className="flex items-start gap-3 rounded-2xl border border-rose-500/30 bg-rose-500/10 px-5 py-4">
                <XCircle className="mt-0.5 h-6 w-6 flex-shrink-0 text-rose-400" />
                <div>
                  <p className="font-bold text-rose-300">{judgeResult?.feedback ?? "Not quite."}</p>
                  <p className="mt-0.5 text-sm text-slate-300">
                    Correct: <span className="font-semibold text-white">{sentence.target}</span>
                  </p>
                </div>
              </div>
            )}

            {/* Action row */}
            <div className="flex gap-3">
              {/* Hint button — only while building */}
              {status === "building" && !showHint && (
                <button type="button" onClick={() => setShowHint(true)}
                  className="flex items-center gap-1.5 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-2.5 text-sm font-semibold text-amber-400 hover:bg-amber-500/20"
                >
                  <Lightbulb className="h-4 w-4" /> Hint
                </button>
              )}

              {/* Check / judging */}
              {status === "building" && (
                <button type="button"
                  onClick={mode === "tiles" ? checkTiles : checkTyped}
                  disabled={mode === "tiles" ? placed.length === 0 : !typedAnswer.trim()}
                  className="flex-1 rounded-2xl bg-gradient-to-r from-violet-500 to-purple-600 py-3 font-bold text-white disabled:opacity-40 hover:opacity-90"
                >
                  Check Answer
                </button>
              )}
              {status === "judging" && (
                <div className="flex flex-1 items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 py-3 text-sm text-slate-400">
                  <Loader2 className="h-4 w-4 animate-spin" /> Evaluating…
                </div>
              )}

              {/* Next */}
              {isResult && (
                <button type="button" onClick={generate} disabled={isPending}
                  className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-violet-500 to-purple-600 py-3 font-bold text-white disabled:opacity-50 hover:opacity-90"
                >
                  <RefreshCw className="h-4 w-4" /> Next Sentence
                </button>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
