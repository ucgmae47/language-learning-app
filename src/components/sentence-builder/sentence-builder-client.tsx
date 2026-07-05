"use client";

import { useState, useCallback, useTransition } from "react";
import { ArrowLeft, RefreshCw, Lightbulb, CheckCircle2, XCircle } from "lucide-react";
import Link from "next/link";
import { saveSentenceAttempt } from "@/app/actions/sentence-builder";
import type { Language, CefrLevel } from "@/lib/supabase/types";
import type { GeneratedSentence } from "@/app/api/sentence-builder/generate/route";

const LANG_META: Record<Language, { name: string; flag: string }> = {
  es: { name: "Spanish", flag: "🇪🇸" },
  fr: { name: "French", flag: "🇫🇷" },
};

const TOPICS = ["Daily Life", "Travel", "Food", "Animals", "Work", "Family", "Sports", "Nature"] as const;

type Status = "idle" | "loading" | "building" | "correct" | "wrong";

function normalizeForCheck(s: string): string {
  return s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[.,!?;:'"]/g, "").trim();
}

type Props = { language: Language; cefrLevel: CefrLevel; initialStats: { total: number; correct: number; streak: number } };

export function SentenceBuilderClient({ language, cefrLevel, initialStats }: Props) {
  const meta = LANG_META[language];
  const [status, setStatus] = useState<Status>("idle");
  const [sentence, setSentence] = useState<GeneratedSentence | null>(null);
  const [placed, setPlaced] = useState<string[]>([]);    // words in the answer zone (in order)
  const [bank, setBank] = useState<string[]>([]);        // remaining tiles in bank
  const [showHint, setShowHint] = useState(false);
  const [stats, setStats] = useState(initialStats);
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const generate = useCallback(() => {
    setStatus("loading");
    setPlaced([]);
    setShowHint(false);

    fetch("/api/sentence-builder/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ language, cefrLevel, topic: selectedTopic }),
    })
      .then((r) => r.json())
      .then((data: GeneratedSentence) => {
        setSentence(data);
        setBank(data.allWords);
        setStatus("building");
      })
      .catch(() => setStatus("idle"));
  }, [language, cefrLevel, selectedTopic]);

  // Move a tile from bank to answer zone
  const placeTile = useCallback((word: string, bankIndex: number) => {
    if (status !== "building") return;
    setBank((b) => b.filter((_, i) => i !== bankIndex));
    setPlaced((p) => [...p, word]);
  }, [status]);

  // Remove a tile from answer zone back to bank
  const removeTile = useCallback((word: string, placedIndex: number) => {
    if (status !== "building") return;
    setPlaced((p) => p.filter((_, i) => i !== placedIndex));
    setBank((b) => [...b, word]);
  }, [status]);

  // Check answer
  const check = useCallback(() => {
    if (!sentence || placed.length === 0) return;

    const attempt = placed.join(" ");
    const correctWords = sentence.words; // original (unshuffled) word list

    // Normalize both for comparison
    const attemptNorm = placed.map(normalizeForCheck).join(" ");
    const correctNorm = correctWords.map(normalizeForCheck).join(" ");

    const isCorrect = attemptNorm === correctNorm;
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

  const accuracy = stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0;

  // Highlight which placed tiles are correct/wrong when status=wrong
  const correctWords = sentence?.words ?? [];
  const tileState = (word: string, idx: number): "correct" | "wrong" | "neutral" => {
    if (status !== "wrong") return "neutral";
    return normalizeForCheck(word) === normalizeForCheck(correctWords[idx] ?? "") ? "correct" : "wrong";
  };

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
        <div className="flex items-center gap-3 text-xs text-slate-400">
          {stats.streak > 0 && (
            <span className="font-bold text-amber-400">🔥 {stats.streak}</span>
          )}
          <span>{accuracy}% acc</span>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-4 py-8">

        {/* Stats bar */}
        {stats.total > 0 && (
          <div className="grid grid-cols-3 gap-3">
            {[["Attempted", stats.total], ["Correct", stats.correct], ["Streak", `${stats.streak} 🔥`]].map(
              ([label, val]) => (
                <div key={label as string} className="rounded-2xl border border-white/8 bg-white/4 p-3 text-center">
                  <p className="text-lg font-extrabold text-white">{val}</p>
                  <p className="text-xs text-slate-500">{label}</p>
                </div>
              ),
            )}
          </div>
        )}

        {/* Idle state */}
        {status === "idle" && (
          <div className="flex flex-col items-center gap-6 rounded-3xl border border-white/10 bg-white/4 p-8 text-center">
            <span className="text-5xl">🧩</span>
            <div>
              <h2 className="text-xl font-extrabold text-white">Sentence Builder</h2>
              <p className="mt-2 text-slate-400">
                An English sentence appears. Tap the word tiles below to construct the correct {meta.name} translation.
              </p>
            </div>
            {/* Topic picker */}
            <div>
              <p className="mb-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">Topic (optional)</p>
              <div className="flex flex-wrap justify-center gap-2">
                {TOPICS.map((t) => (
                  <button
                    key={t}
                    type="button"
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
            <button
              type="button"
              onClick={generate}
              className="rounded-2xl bg-gradient-to-r from-violet-500 to-purple-600 px-8 py-4 text-lg font-bold text-white shadow-lg hover:opacity-90"
            >
              Generate Sentence
            </button>
          </div>
        )}

        {/* Loading */}
        {status === "loading" && (
          <div className="flex flex-col items-center gap-4 py-16 text-center">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-violet-500 border-t-transparent" />
            <p className="text-slate-400">Generating your sentence…</p>
          </div>
        )}

        {/* Building / Result */}
        {(status === "building" || status === "correct" || status === "wrong") && sentence && (
          <div className="flex flex-col gap-5">
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

            {/* Answer zone */}
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">Your answer</p>
              <div
                className={`min-h-[64px] rounded-2xl border-2 p-3 transition-colors ${
                  status === "correct" ? "border-emerald-500/50 bg-emerald-500/8" :
                  status === "wrong"   ? "border-rose-500/50 bg-rose-500/8" :
                                        "border-white/10 bg-white/4"
                }`}
              >
                {placed.length === 0 ? (
                  <p className="p-1 text-sm text-slate-600">Tap words below to build your sentence…</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {placed.map((word, i) => {
                      const state = tileState(word, i);
                      return (
                        <button
                          key={`${word}-${i}`}
                          type="button"
                          onClick={() => (status === "building" ? removeTile(word, i) : undefined)}
                          disabled={status !== "building"}
                          className={`rounded-xl border px-3 py-1.5 text-sm font-semibold transition-all ${
                            status === "building"
                              ? "border-violet-500/40 bg-violet-500/20 text-violet-200 hover:bg-violet-500/30 hover:scale-105"
                              : state === "correct"
                              ? "border-emerald-500/50 bg-emerald-500/20 text-emerald-300"
                              : state === "wrong"
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

            {/* Result message */}
            {status === "correct" && (
              <div className="flex items-center gap-3 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-5 py-4">
                <CheckCircle2 className="h-6 w-6 flex-shrink-0 text-emerald-400" />
                <div>
                  <p className="font-bold text-emerald-300">Correct! 🎉</p>
                  <p className="text-sm text-emerald-400/80">{sentence.target}</p>
                </div>
              </div>
            )}
            {status === "wrong" && (
              <div className="flex items-start gap-3 rounded-2xl border border-rose-500/30 bg-rose-500/10 px-5 py-4">
                <XCircle className="mt-0.5 h-6 w-6 flex-shrink-0 text-rose-400" />
                <div>
                  <p className="font-bold text-rose-300">Not quite.</p>
                  <p className="text-sm text-slate-300">
                    Correct answer: <span className="font-semibold text-white">{sentence.target}</span>
                  </p>
                </div>
              </div>
            )}

            {/* Word bank */}
            {status === "building" && (
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">Word bank</p>
                <div className="flex flex-wrap gap-2 rounded-2xl border border-white/8 bg-white/3 p-3">
                  {bank.length === 0 && (
                    <p className="p-1 text-sm text-slate-600">All words placed!</p>
                  )}
                  {bank.map((word, i) => (
                    <button
                      key={`bank-${word}-${i}`}
                      type="button"
                      onClick={() => placeTile(word, i)}
                      className="rounded-xl border border-white/15 bg-white/8 px-3 py-1.5 text-sm font-semibold text-slate-200 transition-all hover:bg-white/15 hover:scale-105 active:scale-95"
                    >
                      {word}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Action buttons */}
            <div className="flex gap-3">
              {status === "building" && (
                <>
                  {!showHint && (
                    <button
                      type="button"
                      onClick={() => setShowHint(true)}
                      className="flex items-center gap-1.5 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-2.5 text-sm font-semibold text-amber-400 hover:bg-amber-500/20"
                    >
                      <Lightbulb className="h-4 w-4" /> Hint
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={check}
                    disabled={placed.length === 0}
                    className="flex-1 rounded-2xl bg-gradient-to-r from-violet-500 to-purple-600 py-3 font-bold text-white disabled:opacity-40 hover:opacity-90"
                  >
                    Check Answer
                  </button>
                </>
              )}
              {(status === "correct" || status === "wrong") && (
                <button
                  type="button"
                  onClick={generate}
                  disabled={isPending}
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
