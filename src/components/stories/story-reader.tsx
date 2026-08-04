"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Clock,
  Eye,
  EyeOff,
  RotateCcw,
  ClipboardList,
  Languages,
  Loader2,
  Volume2,
  VolumeX,
} from "lucide-react";
import { useScrollLock } from "@/hooks/use-scroll-lock";
import { useTts } from "@/hooks/use-tts";
import { saveStoryProgress } from "@/app/actions/stories";
import { allSentences, cleanWord } from "@/lib/stories/utils";
import type { Language } from "@/lib/supabase/types";

// ─── Types ───────────────────────────────────────────────────────────────────

type Translations = {
  sentences: string[];
  words: Record<string, string>;
};

type Props = {
  title: string;
  cefrLevel: string;
  language: Language;
  topics: string[];
  readingMins: number | null;
  body: string;
  translations: Translations | null;
  loadingTranslations: boolean;
  translationError?: string | null;
  storyId: string;
  attemptScore: number | null;
  /** Resume position from story_progress (0-based sentence index). */
  initialSentenceIndex?: number;
  /** Whether the reader previously reached the end screen. */
  initialFinished?: boolean;
};

const VOICE_LANG: Record<Language, string> = {
  es: "es-ES",
  fr: "fr-FR",
};

const NAV_COOLDOWN_MS = 400;

// ─── Word chip ───────────────────────────────────────────────────────────────

function StoryWord({
  token,
  wordKey,
  meaning,
  activeKey,
  onActivate,
}: {
  token: string;
  wordKey: string;
  meaning: string | undefined;
  activeKey: string | null;
  onActivate: (key: string | null) => void;
}) {
  if (/^\s+$/.test(token)) return <>{token}</>;

  const isActive = activeKey === wordKey;
  const tappable = !!meaning;

  return (
    <span className="relative inline" data-word-span="true">
      {isActive && meaning && (
        <span
          className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-2 -translate-x-1/2 whitespace-nowrap rounded-lg bg-amber-400 px-3 py-1.5 text-sm font-medium text-slate-900 shadow-lg"
          role="tooltip"
        >
          {meaning}
        </span>
      )}
      <span
        onClick={
          tappable
            ? (e) => {
                e.stopPropagation();
                onActivate(isActive ? null : wordKey);
              }
            : undefined
        }
        className={
          tappable
            ? `cursor-pointer border-b border-dotted transition-colors ${
                isActive
                  ? "border-amber-400 text-amber-200"
                  : "border-amber-500/40 hover:border-amber-400/70 hover:text-amber-100"
              }`
            : undefined
        }
      >
        {token}
      </span>
    </span>
  );
}

// ─── Main reader ─────────────────────────────────────────────────────────────

export function StoryReader({
  title,
  cefrLevel,
  language,
  topics,
  readingMins,
  body,
  translations,
  loadingTranslations,
  translationError,
  storyId,
  attemptScore,
  initialSentenceIndex = 0,
  initialFinished = false,
}: Props) {
  useScrollLock();

  const sentences = allSentences(body);
  const total = sentences.length;

  const clampedInitial = Math.max(
    0,
    Math.min(initialSentenceIndex, Math.max(total - 1, 0)),
  );

  const [index, setIndex] = useState(clampedInitial);
  const [finished, setFinished] = useState(Boolean(initialFinished) && total > 0);
  const [showEnglish, setShowEnglish] = useState(true);
  const [activeWord, setActiveWord] = useState<string | null>(null);
  const [slideKey, setSlideKey] = useState(0);

  const lockRef = useRef(false);
  const touchStartY = useRef<number | null>(null);
  const progressSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSavedKey = useRef<string>("");
  const progressSnapshot = useRef({ percent: 0, index: 0, finished: false });

  const {
    speak,
    stopSpeaking,
    isSpeaking,
    isLoading: ttsLoading,
    ttsError,
    clearTtsError,
  } = useTts({
    lang: VOICE_LANG[language] ?? "es-ES",
  });

  const sentence = sentences[index] ?? "";
  const english = translations?.sentences[index];
  const hasWords = !!translations?.words && Object.keys(translations.words).length > 0;
  const progress = total > 0 ? ((finished ? total : index + 1) / total) * 100 : 0;

  // Keep a snapshot for unmount flush without writing refs during render.
  useEffect(() => {
    progressSnapshot.current = {
      percent: Math.round(progress),
      index,
      finished,
    };
  }, [progress, index, finished]);

  // Persist reading progress (debounced) for library badges + next-story nudge.
  useEffect(() => {
    if (total === 0) return;

    const percent = Math.round(progress);
    const key = `${storyId}:${percent}:${index}:${finished}`;
    if (key === lastSavedKey.current) return;

    if (progressSaveTimer.current) clearTimeout(progressSaveTimer.current);
    progressSaveTimer.current = setTimeout(() => {
      lastSavedKey.current = key;
      void saveStoryProgress(storyId, percent, index, finished);
    }, 400);

    return () => {
      if (progressSaveTimer.current) clearTimeout(progressSaveTimer.current);
    };
  }, [storyId, progress, index, finished, total]);

  // Flush latest progress when leaving the reader so badges stay accurate.
  useEffect(() => {
    return () => {
      if (total === 0) return;
      const snap = progressSnapshot.current;
      const key = `${storyId}:${snap.percent}:${snap.index}:${snap.finished}`;
      if (key === lastSavedKey.current) return;
      lastSavedKey.current = key;
      void saveStoryProgress(storyId, snap.percent, snap.index, snap.finished);
    };
  }, [storyId, total]);

  const navigate = useCallback(
    (delta: number) => {
      if (lockRef.current || total === 0) return;
      lockRef.current = true;
      setActiveWord(null);
      stopSpeaking();

      setTimeout(() => {
        lockRef.current = false;
      }, NAV_COOLDOWN_MS);

      if (delta > 0) {
        if (finished) return;
        if (index >= total - 1) {
          setFinished(true);
          return;
        }
        setIndex((i) => i + 1);
        setSlideKey((k) => k + 1);
      } else {
        if (finished) {
          setFinished(false);
          setSlideKey((k) => k + 1);
          return;
        }
        if (index <= 0) return;
        setIndex((i) => i - 1);
        setSlideKey((k) => k + 1);
      }
    },
    [index, finished, total, stopSpeaking],
  );

  const goToBeginning = useCallback(() => {
    if (lockRef.current) return;
    stopSpeaking();
    setFinished(false);
    setIndex(0);
    setActiveWord(null);
    setSlideKey((k) => k + 1);
  }, [stopSpeaking]);

  function handleSpeakToggle() {
    if (isSpeaking || ttsLoading) {
      stopSpeaking();
      return;
    }
    void speak(sentence);
  }

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "ArrowRight" || e.key === "ArrowDown") {
        e.preventDefault();
        navigate(1);
      } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
        e.preventDefault();
        navigate(-1);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [navigate]);

  useEffect(() => {
    function onWheel(e: WheelEvent) {
      if (Math.abs(e.deltaY) < 30) return;
      e.preventDefault();
      navigate(e.deltaY > 0 ? 1 : -1);
    }
    window.addEventListener("wheel", onWheel, { passive: false });
    return () => window.removeEventListener("wheel", onWheel);
  }, [navigate]);

  useEffect(() => {
    function onMouseDown(e: MouseEvent) {
      if (!(e.target as Element).closest("[data-word-span]")) {
        setActiveWord(null);
      }
    }
    document.addEventListener("mousedown", onMouseDown);
    return () => document.removeEventListener("mousedown", onMouseDown);
  }, []);

  function onTouchStart(e: React.TouchEvent) {
    touchStartY.current = e.touches[0]?.clientY ?? null;
  }

  function onTouchEnd(e: React.TouchEvent) {
    const start = touchStartY.current;
    if (start == null) return;
    const end = e.changedTouches[0]?.clientY ?? start;
    const diff = start - end;
    if (Math.abs(diff) < 40) return;
    navigate(diff > 0 ? 1 : -1);
    touchStartY.current = null;
  }

  if (total === 0) {
    return (
      <div className="flex h-full items-center justify-center text-slate-500">
        This story has no readable content.
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[60] flex flex-col bg-[#08080e] text-slate-100">
      {/* Top bar */}
      <header className="shrink-0 border-b border-white/6 px-4 py-3 sm:px-6">
        <div className="mx-auto flex max-w-2xl items-center gap-3">
          <Link
            href="/stories"
            className="flex shrink-0 items-center gap-1.5 rounded-lg px-2 py-2 text-sm text-slate-400 transition hover:bg-white/6 hover:text-slate-100"
            aria-label="Leave story and go back to stories"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="font-medium">Stories</span>
          </Link>

          <div className="min-w-0 flex-1 text-center sm:text-left">
            <p className="truncate text-sm font-medium text-slate-200">{title}</p>
            <div className="mt-0.5 flex flex-wrap items-center justify-center gap-x-2 gap-y-0.5 text-[11px] text-slate-500 sm:justify-start">
              <span className="font-medium text-emerald-400/90">{cefrLevel}</span>
              {topics.slice(0, 2).map((t) => (
                <span key={t} className="capitalize">
                  · {t}
                </span>
              ))}
              {readingMins && (
                <span className="flex items-center gap-0.5">
                  · <Clock className="h-3 w-3" /> {readingMins} min
                </span>
              )}
            </div>
          </div>

          {translations?.sentences?.length ? (
            <button
              type="button"
              onClick={() => setShowEnglish((v) => !v)}
              className="flex h-9 shrink-0 items-center gap-1.5 rounded-lg border border-white/10 px-2.5 text-xs text-slate-400 transition hover:border-white/20 hover:text-slate-200"
              aria-pressed={showEnglish}
              title={showEnglish ? "Hide English" : "Show English"}
            >
              {showEnglish ? (
                <Eye className="h-3.5 w-3.5" />
              ) : (
                <EyeOff className="h-3.5 w-3.5" />
              )}
              <span className="hidden sm:inline">EN</span>
            </button>
          ) : loadingTranslations ? (
            <span className="flex shrink-0 items-center gap-1 text-[11px] text-slate-600">
              <Languages className="h-3.5 w-3.5 animate-pulse" />
              <span className="hidden sm:inline">Loading…</span>
            </span>
          ) : translationError ? (
            <span
              className="max-w-[10rem] truncate text-[11px] text-amber-500/90 sm:max-w-xs"
              title={translationError}
            >
              {translationError}
            </span>
          ) : null}
        </div>
      </header>

      {/* Reading area */}
      <main
        className="relative flex min-h-0 flex-1 flex-col"
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        {finished ? (
          <div className="story-end-fade flex flex-1 flex-col items-center justify-center gap-6 px-6 text-center">
            <div className="rounded-full bg-emerald-500/10 p-4">
              <Languages className="h-8 w-8 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-white">Story complete</h2>
              <p className="mt-2 text-sm text-slate-500">
                You read all {total} sentences. Ready to test your comprehension?
              </p>
            </div>
            {attemptScore !== null ? (
              <div className="flex flex-col items-center gap-3">
                <p className="text-sm text-slate-400">
                  Quiz score:{" "}
                  <span className="font-semibold text-emerald-400">{attemptScore}/5</span>
                </p>
                <Link
                  href="/stories"
                  className="rounded-full bg-white/8 px-5 py-2.5 text-sm font-medium text-slate-200 transition hover:bg-white/12"
                >
                  Read another story
                </Link>
              </div>
            ) : (
              <Link
                href={`/stories/${storyId}/quiz`}
                className="rounded-full bg-emerald-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-900/40 transition hover:bg-emerald-500"
              >
                Take comprehension quiz
              </Link>
            )}
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="text-xs text-slate-600 transition hover:text-slate-400"
            >
              ← Back to last sentence
            </button>
          </div>
        ) : (
          <div className="flex min-h-0 flex-1 items-center justify-center overflow-hidden px-6 py-8">
            <div key={slideKey} className="story-slide-in mx-auto w-full max-w-xl">
              <p className="text-center text-xl font-light leading-relaxed tracking-wide text-slate-50 sm:text-3xl sm:leading-snug">
                {translations
                  ? sentence.split(/(\s+)/).map((token, ti) => {
                      const clean = cleanWord(token);
                      return (
                        <StoryWord
                          key={ti}
                          token={token}
                          wordKey={`${index}-${ti}`}
                          meaning={
                            clean.length >= 1 ? translations.words[clean] : undefined
                          }
                          activeKey={activeWord}
                          onActivate={setActiveWord}
                        />
                      );
                    })
                  : sentence}
              </p>

              <div className="mt-8 flex flex-col items-center gap-2">
                <button
                  type="button"
                  onClick={handleSpeakToggle}
                  disabled={!sentence.trim()}
                  className={`flex h-12 w-12 items-center justify-center rounded-full border transition ${
                    isSpeaking || ttsLoading
                      ? "border-emerald-400/40 bg-emerald-500/15 text-emerald-300"
                      : "border-white/10 bg-white/5 text-slate-300 hover:border-emerald-400/30 hover:bg-emerald-500/10 hover:text-emerald-300"
                  } disabled:cursor-not-allowed disabled:opacity-40`}
                  aria-label={
                    isSpeaking || ttsLoading
                      ? "Stop reading aloud"
                      : "Read this sentence aloud"
                  }
                  title={
                    isSpeaking || ttsLoading
                      ? "Stop"
                      : "Listen to this sentence"
                  }
                >
                  {ttsLoading ? (
                    <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
                  ) : isSpeaking ? (
                    <VolumeX className="h-5 w-5" aria-hidden="true" />
                  ) : (
                    <Volume2 className="h-5 w-5" aria-hidden="true" />
                  )}
                </button>
                {ttsError && (
                  <div className="flex max-w-sm items-start gap-2 rounded-xl border border-amber-500/25 bg-amber-500/10 px-3 py-2 text-left text-xs text-amber-200">
                    <p className="flex-1">{ttsError}</p>
                    <button
                      type="button"
                      onClick={clearTtsError}
                      className="shrink-0 text-amber-400/80 hover:text-amber-200"
                      aria-label="Dismiss"
                    >
                      ×
                    </button>
                  </div>
                )}
              </div>

              {showEnglish && english && (
                <p className="story-translation-in mt-6 text-center text-base leading-relaxed text-slate-400 sm:text-lg">
                  {english}
                </p>
              )}

              {hasWords && (
                <p className="mt-6 text-center text-[11px] text-slate-600">
                  Tap underlined words for quick definitions
                </p>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Bottom nav */}
      <footer className="shrink-0 border-t border-white/6 px-4 pb-6 pt-4 sm:px-6">
        <div className="mx-auto max-w-2xl">
          {/* Progress bar */}
          <div className="mb-4 h-1 overflow-hidden rounded-full bg-white/8">
            <div
              className="h-full rounded-full bg-emerald-500/80 transition-[width] duration-300 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>

          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={goToBeginning}
              disabled={!finished && index === 0}
              className="flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-xs text-slate-500 transition hover:bg-white/6 hover:text-slate-200 disabled:cursor-not-allowed disabled:opacity-30 sm:text-sm"
              aria-label="Go to beginning of story"
            >
              <RotateCcw className="h-4 w-4 shrink-0" />
              <span className="hidden sm:inline">Beginning</span>
            </button>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => navigate(-1)}
                disabled={!finished && index === 0}
                aria-label="Previous sentence"
                className="flex h-11 w-11 items-center justify-center rounded-full border border-white/10 text-slate-400 transition hover:border-white/20 hover:bg-white/6 hover:text-white disabled:opacity-25"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>

              <span className="min-w-[4rem] text-center text-sm tabular-nums text-slate-500">
                {finished ? total : index + 1}{" "}
                <span className="text-slate-700">/</span> {total}
              </span>

              <button
                type="button"
                onClick={() => navigate(1)}
                disabled={finished}
                aria-label={index >= total - 1 && !finished ? "Finish story" : "Next sentence"}
                className="flex h-11 w-11 items-center justify-center rounded-full border border-white/10 text-slate-400 transition hover:border-white/20 hover:bg-white/6 hover:text-white disabled:opacity-25"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>

            <Link
              href={`/stories/${storyId}/quiz`}
              className="flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-xs text-emerald-400 transition hover:bg-emerald-500/10 hover:text-emerald-300 sm:text-sm"
              aria-label="Go to comprehension quiz"
            >
              <span className="hidden sm:inline">Quiz</span>
              <ClipboardList className="h-4 w-4 shrink-0" />
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
