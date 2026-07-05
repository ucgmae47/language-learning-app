"use client";

import { useState, useTransition } from "react";
import {
  BookOpen,
  Search,
  Plus,
  X,
  ChevronRight,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import { recordReview, saveWord, getAllCards } from "@/app/actions/vocabulary";
import type { SrsGrade } from "@/lib/srs";

type VocabularyCard = {
  id: string;
  user_id: string;
  language: string;
  word: string;
  translation: string;
  context: string | null;
  source: string;
  ease_factor: number;
  interval_days: number;
  repetitions: number;
  due_date: string;
  created_at: string;
};

type VocabStats = {
  total: number;
  due: number;
  mastered: number;
};

type Props = {
  initialDueCards: VocabularyCard[];
  initialStats: VocabStats;
};

// ── Flip Card ────────────────────────────────────────────────────────────────

function FlipCard({
  card,
  onGrade,
  isPending,
}: {
  card: VocabularyCard;
  onGrade: (grade: SrsGrade) => void;
  isPending: boolean;
}) {
  const [flipped, setFlipped] = useState(false);

  return (
    <div className="flex flex-col gap-4">
      {/* Card */}
      <div
        className="cursor-pointer"
        style={{ perspective: "1000px" }}
        onClick={() => !flipped && setFlipped(true)}
      >
        <div
          className="relative min-h-52 w-full transition-transform duration-500"
          style={{
            transformStyle: "preserve-3d",
            transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)",
          }}
        >
          {/* Front */}
          <div
            className="absolute inset-0 flex flex-col items-center justify-center rounded-3xl border border-white/10 bg-gradient-to-br from-emerald-950/60 to-[#0d1f15] px-6 py-8"
            style={{ backfaceVisibility: "hidden" }}
          >
            <p className="text-4xl font-extrabold text-white">{card.word}</p>
            <p className="mt-3 text-sm text-slate-500">Tap to reveal translation</p>
            <span className="mt-4 rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-semibold text-emerald-400">
              {card.source}
            </span>
          </div>

          {/* Back */}
          <div
            className="absolute inset-0 flex flex-col items-center justify-center rounded-3xl border border-emerald-500/30 bg-gradient-to-br from-emerald-900/40 to-[#0d1f15] px-6 py-8"
            style={{
              backfaceVisibility: "hidden",
              transform: "rotateY(180deg)",
            }}
          >
            <p className="text-3xl font-bold text-emerald-300">{card.translation}</p>
            {card.context && (
              <p className="mt-3 text-center text-sm italic text-slate-400">
                &ldquo;{card.context}&rdquo;
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Grade buttons (only shown when flipped) */}
      {flipped && (
        <div className="grid grid-cols-4 gap-2">
          {(
            [
              { grade: 0 as SrsGrade, label: "Again", color: "rose" },
              { grade: 3 as SrsGrade, label: "Hard", color: "amber" },
              { grade: 4 as SrsGrade, label: "Good", color: "blue" },
              { grade: 5 as SrsGrade, label: "Easy", color: "emerald" },
            ] as const
          ).map(({ grade, label, color }) => (
            <button
              key={grade}
              type="button"
              disabled={isPending}
              onClick={() => onGrade(grade)}
              className={`flex flex-col items-center justify-center rounded-2xl border py-3 text-xs font-bold transition active:scale-95 disabled:opacity-50
                ${color === "rose" ? "border-rose-500/30 bg-rose-500/10 text-rose-400 hover:bg-rose-500/20" : ""}
                ${color === "amber" ? "border-amber-500/30 bg-amber-500/10 text-amber-400 hover:bg-amber-500/20" : ""}
                ${color === "blue" ? "border-blue-500/30 bg-blue-500/10 text-blue-400 hover:bg-blue-500/20" : ""}
                ${color === "emerald" ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20" : ""}
              `}
            >
              {isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                label
              )}
            </button>
          ))}
        </div>
      )}

      {!flipped && (
        <p className="text-center text-xs text-slate-600">
          Click the card to see the translation, then rate your recall
        </p>
      )}
    </div>
  );
}

// ── Add Word Form ─────────────────────────────────────────────────────────────

function AddWordForm({
  onAdded,
  onCancel,
}: {
  onAdded: (card: VocabularyCard) => void;
  onCancel: () => void;
}) {
  const [word, setWord] = useState("");
  const [translation, setTranslation] = useState("");
  const [context, setContext] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!word.trim() || !translation.trim()) return;

    startTransition(async () => {
      const result = await saveWord(word.trim(), translation.trim(), context.trim() || null, "manual");
      if (result.error) {
        setError(result.error);
        return;
      }
      // Optimistically push a placeholder card; parent will reload
      onAdded({
        id: crypto.randomUUID(),
        user_id: "",
        language: "",
        word: word.trim(),
        translation: translation.trim(),
        context: context.trim() || null,
        source: "manual",
        ease_factor: 2.5,
        interval_days: 1,
        repetitions: 0,
        due_date: new Date().toISOString().slice(0, 10),
        created_at: new Date().toISOString(),
      });
    });
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mt-4 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4"
    >
      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm font-bold text-emerald-400">Add New Word</p>
        <button type="button" onClick={onCancel} className="text-slate-500 hover:text-slate-300">
          <X className="h-4 w-4" />
        </button>
      </div>
      <div className="flex flex-col gap-2">
        <input
          type="text"
          placeholder="Word or phrase"
          value={word}
          onChange={(e) => setWord(e.target.value)}
          required
          className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-emerald-500/50 focus:outline-none"
        />
        <input
          type="text"
          placeholder="Translation"
          value={translation}
          onChange={(e) => setTranslation(e.target.value)}
          required
          className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-emerald-500/50 focus:outline-none"
        />
        <input
          type="text"
          placeholder="Context (optional)"
          value={context}
          onChange={(e) => setContext(e.target.value)}
          className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-emerald-500/50 focus:outline-none"
        />
        {error && <p className="text-xs text-rose-400">{error}</p>}
        <button
          type="submit"
          disabled={isPending || !word.trim() || !translation.trim()}
          className="flex items-center justify-center gap-2 rounded-xl bg-emerald-600 py-2 text-sm font-bold text-white transition hover:bg-emerald-500 disabled:opacity-50"
        >
          {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
          Save Word
        </button>
      </div>
    </form>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export function VocabBankClient({ initialDueCards, initialStats }: Props) {
  const [tab, setTab] = useState<"review" | "all">("review");
  const [dueCards, _setDueCards] = useState<VocabularyCard[]>(initialDueCards);
  void _setDueCards;
  const [currentIdx, setCurrentIdx] = useState(0);
  const [reviewed, setReviewed] = useState(0);
  const [allCards, setAllCards] = useState<VocabularyCard[] | null>(null);
  const [search, setSearch] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [isPending, startTransition] = useTransition();

  const totalDue = dueCards.length;
  const currentCard = dueCards[currentIdx];
  const isComplete = currentIdx >= totalDue;

  function handleGrade(grade: SrsGrade) {
    if (!currentCard) return;
    startTransition(async () => {
      await recordReview(currentCard.id, grade);
      setReviewed((r) => r + 1);
      setCurrentIdx((i) => i + 1);
    });
  }

  async function switchToAll() {
    setTab("all");
    if (!allCards) {
      const cards = await getAllCards();
      setAllCards(cards);
    }
  }

  function handleWordAdded(card: VocabularyCard) {
    setShowAddForm(false);
    setAllCards((prev) => (prev ? [card, ...prev] : [card]));
  }

  const filteredCards = (allCards ?? []).filter(
    (c) =>
      c.word.toLowerCase().includes(search.toLowerCase()) ||
      c.translation.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="flex flex-col gap-4">
      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Total", value: initialStats.total, color: "text-white" },
          { label: "Due today", value: initialStats.due, color: "text-amber-400" },
          { label: "Mastered", value: initialStats.mastered, color: "text-emerald-400" },
        ].map(({ label, value, color }) => (
          <div
            key={label}
            className="flex flex-col items-center rounded-2xl border border-white/8 bg-white/4 py-3"
          >
            <p className={`text-2xl font-extrabold ${color}`}>{value}</p>
            <p className="text-xs text-slate-500">{label}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex rounded-2xl border border-white/8 bg-white/4 p-1">
        {(
          [
            { key: "review", label: "Review" },
            { key: "all", label: "All Words" },
          ] as const
        ).map(({ key, label }) => (
          <button
            key={key}
            type="button"
            onClick={() => (key === "all" ? void switchToAll() : setTab(key))}
            className={`flex-1 rounded-xl py-2 text-sm font-semibold transition ${
              tab === key
                ? "bg-emerald-600 text-white shadow"
                : "text-slate-400 hover:text-white"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Review Tab */}
      {tab === "review" && (
        <div className="flex flex-col gap-4">
          {totalDue === 0 ? (
            <div className="flex flex-col items-center justify-center gap-4 rounded-3xl border border-dashed border-white/10 py-20 text-center">
              <CheckCircle2 className="h-12 w-12 text-emerald-500" />
              <div>
                <p className="text-lg font-bold text-white">All caught up!</p>
                <p className="mt-1 text-sm text-slate-400">
                  No cards due today. Keep it up!
                </p>
              </div>
            </div>
          ) : isComplete ? (
            <div className="flex flex-col items-center justify-center gap-4 rounded-3xl border border-emerald-500/20 bg-emerald-500/5 py-20 text-center">
              <p className="text-5xl">🎉</p>
              <div>
                <p className="text-xl font-extrabold text-emerald-300">
                  Session Complete!
                </p>
                <p className="mt-1 text-sm text-slate-400">
                  You reviewed {reviewed} card{reviewed !== 1 ? "s" : ""}. Great work!
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setCurrentIdx(0);
                  setReviewed(0);
                }}
                className="rounded-2xl bg-emerald-600 px-6 py-2 text-sm font-bold text-white transition hover:bg-emerald-500"
              >
                Review Again
              </button>
            </div>
          ) : (
            <>
              {/* Progress bar */}
              <div className="flex items-center gap-3">
                <div className="flex-1 overflow-hidden rounded-full bg-white/8 h-2">
                  <div
                    className="h-full rounded-full bg-emerald-500 transition-all"
                    style={{ width: `${(currentIdx / totalDue) * 100}%` }}
                  />
                </div>
                <span className="shrink-0 text-xs text-slate-500">
                  {currentIdx}/{totalDue}
                </span>
              </div>

              {currentCard && (
                <FlipCard
                  key={currentCard.id}
                  card={currentCard}
                  onGrade={handleGrade}
                  isPending={isPending}
                />
              )}
            </>
          )}
        </div>
      )}

      {/* All Words Tab */}
      {tab === "all" && (
        <div className="flex flex-col gap-3">
          {/* Search + Add */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                placeholder="Search words…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-white/5 py-2 pl-9 pr-3 text-sm text-white placeholder-slate-500 focus:border-emerald-500/50 focus:outline-none"
              />
            </div>
            <button
              type="button"
              onClick={() => setShowAddForm((v) => !v)}
              className="flex items-center gap-1.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm font-semibold text-emerald-400 transition hover:bg-emerald-500/20"
            >
              <Plus className="h-4 w-4" />
              Add
            </button>
          </div>

          {showAddForm && (
            <AddWordForm onAdded={handleWordAdded} onCancel={() => setShowAddForm(false)} />
          )}

          {/* Cards list */}
          {allCards === null ? (
            <div className="flex justify-center py-10">
              <Loader2 className="h-6 w-6 animate-spin text-slate-500" />
            </div>
          ) : filteredCards.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-white/8 py-12 text-center text-sm text-slate-500">
              {search ? "No words match your search." : "No words saved yet."}
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {filteredCards.map((card) => (
                <div
                  key={card.id}
                  className="flex items-center gap-3 rounded-2xl border border-white/8 bg-white/4 px-4 py-3"
                >
                  <div className="flex-1 min-w-0">
                    <p className="truncate font-semibold text-white">{card.word}</p>
                    <p className="truncate text-sm text-slate-400">{card.translation}</p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-xs text-slate-500">
                      {card.interval_days >= 21 ? (
                        <span className="text-emerald-500">Mastered</span>
                      ) : (
                        `Due ${card.due_date}`
                      )}
                    </p>
                    <p className="text-xs text-slate-600">
                      {card.interval_days}d interval
                    </p>
                  </div>
                  <ChevronRight className="h-4 w-4 shrink-0 text-slate-700" />
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Empty state prompt */}
      {tab === "review" && totalDue === 0 && (
        <div className="rounded-2xl border border-white/8 bg-white/4 px-4 py-4 text-center">
          <BookOpen className="mx-auto mb-2 h-6 w-6 text-slate-500" />
          <p className="text-sm text-slate-400">
            Add words while reading stories to build your deck.
          </p>
        </div>
      )}
    </div>
  );
}
