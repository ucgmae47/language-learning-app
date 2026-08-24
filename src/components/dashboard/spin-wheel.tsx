"use client";

import { useState, useCallback, useRef, useLayoutEffect, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, Shuffle, Play, Lock } from "lucide-react";
import { PREVIEW_UNLOCKED_FEATURE_IDS } from "@/lib/features/unlocked";

const WHEEL_INDEX_KEY = "dashboard-wheel-index";

type Feature = {
  id: string;
  label: string;
  emoji: string;
  description: string;
  href: string;
  gradient: string;
  glowColor: string;
  textAccent: string;
};

// Ordered as a learning path around the wheel (Story stays default at index 0):
// Reading → Word study → Games → Production → Speaking → Culture → back to Reading
const FEATURES: Feature[] = [
  {
    id: "story",
    label: "Story",
    emoji: "📖",
    description: "Graded reading passages from the free story library",
    href: "/stories",
    gradient: "from-violet-600 via-purple-600 to-indigo-700",
    glowColor: "rgba(139,92,246,0.55)",
    textAccent: "text-violet-300",
  },
  {
    id: "news",
    label: "News",
    emoji: "🌍",
    description: "Browse real headlines rewritten at your CEFR level",
    href: "/news",
    gradient: "from-slate-500 via-zinc-500 to-gray-600",
    glowColor: "rgba(100,116,139,0.55)",
    textAccent: "text-slate-300",
  },
  {
    id: "dictionary",
    label: "Dictionary",
    emoji: "📚",
    description: "Look up words with definitions and full conjugation tables",
    href: "/dictionary",
    gradient: "from-sky-500 via-blue-500 to-indigo-600",
    glowColor: "rgba(14,165,233,0.55)",
    textAccent: "text-sky-300",
  },
  {
    id: "vocabulary",
    label: "Vocabulary",
    emoji: "📚",
    description: "Save words and review them with spaced repetition flashcards",
    href: "/vocabulary",
    gradient: "from-teal-500 via-emerald-500 to-green-600",
    glowColor: "rgba(20,184,166,0.55)",
    textAccent: "text-teal-300",
  },
  {
    id: "flashcards",
    label: "Flashcards",
    emoji: "✨",
    description: "Flip through native-language idiom flashcards",
    href: "/flashcards",
    gradient: "from-fuchsia-500 via-pink-500 to-rose-600",
    glowColor: "rgba(217,70,239,0.55)",
    textAccent: "text-fuchsia-300",
  },
  {
    id: "phrasebook",
    label: "Phrasebook",
    emoji: "💬",
    description: "Browse practical phrases by situation with audio pronunciation",
    href: "/phrasebook",
    gradient: "from-lime-500 via-green-500 to-emerald-600",
    glowColor: "rgba(132,204,22,0.55)",
    textAccent: "text-lime-300",
  },
  {
    id: "crossword",
    label: "Crossword",
    emoji: "🎯",
    description: "Today's vocabulary crossword puzzle",
    href: "/crossword",
    gradient: "from-amber-500 via-orange-500 to-red-600",
    glowColor: "rgba(245,158,11,0.55)",
    textAccent: "text-amber-300",
  },
  {
    id: "gameroom",
    label: "Game Room",
    emoji: "🕹️",
    description: "Wordle, Cannon, Hangman, Pictionary and more",
    href: "/gameroom",
    gradient: "from-rose-500 via-pink-500 to-fuchsia-600",
    glowColor: "rgba(244,63,94,0.55)",
    textAccent: "text-rose-300",
  },
  {
    id: "sentence-builder",
    label: "Sentence Builder",
    emoji: "🧩",
    description: "Tap word tiles to construct the correct translation of an English sentence",
    href: "/sentence-builder",
    gradient: "from-violet-500 via-purple-500 to-indigo-600",
    glowColor: "rgba(139,92,246,0.55)",
    textAccent: "text-violet-300",
  },
  {
    id: "drills",
    label: "Drills",
    emoji: "⚡",
    description: "Grammar drills focused on your weakest areas",
    href: "/drills",
    gradient: "from-rose-500 via-red-500 to-orange-600",
    glowColor: "rgba(239,68,68,0.55)",
    textAccent: "text-rose-300",
  },
  {
    id: "journal",
    label: "Journal",
    emoji: "📓",
    description: "Write in your target language — AI marks every error inline",
    href: "/journal",
    gradient: "from-indigo-500 via-blue-500 to-sky-600",
    glowColor: "rgba(99,102,241,0.55)",
    textAccent: "text-indigo-300",
  },
  {
    id: "pronunciation",
    label: "Pronunciation",
    emoji: "🎙️",
    description: "Record yourself speaking and get instant AI pronunciation feedback",
    href: "/pronunciation",
    gradient: "from-red-500 via-rose-500 to-pink-600",
    glowColor: "rgba(239,68,68,0.55)",
    textAccent: "text-red-300",
  },
  {
    id: "chat",
    label: "Chat",
    emoji: "💬",
    description: "Voice or text conversation with your AI tutor",
    href: "/chat",
    gradient: "from-cyan-500 via-sky-500 to-blue-600",
    glowColor: "rgba(6,182,212,0.55)",
    textAccent: "text-cyan-300",
  },
  {
    id: "chat-room",
    label: "Chat Room",
    emoji: "👥",
    description: "Live chat with other learners in your active language",
    href: "/chat-room",
    gradient: "from-green-500 via-emerald-500 to-teal-600",
    glowColor: "rgba(16,185,129,0.55)",
    textAccent: "text-emerald-300",
  },
  {
    id: "music",
    label: "Music",
    emoji: "🎵",
    description: "AI-recommended songs in your target language with lyrics and fun facts",
    href: "/music",
    gradient: "from-pink-500 via-rose-500 to-red-600",
    glowColor: "rgba(236,72,153,0.55)",
    textAccent: "text-pink-300",
  },
  {
    id: "explore",
    label: "Explore",
    emoji: "🌍",
    description: "Interactive world map — click any country to discover culture and facts",
    href: "/explore",
    gradient: "from-amber-500 via-orange-500 to-yellow-600",
    glowColor: "rgba(245,158,11,0.55)",
    textAccent: "text-amber-300",
  },
  {
    id: "calendar",
    label: "Calendar",
    emoji: "📅",
    description: "Cultural holidays and festivals across the Spanish/French-speaking world",
    href: "/calendar",
    gradient: "from-purple-500 via-violet-500 to-indigo-600",
    glowColor: "rgba(168,85,247,0.55)",
    textAccent: "text-purple-300",
  },
  {
    id: "recipes",
    label: "Recipes",
    emoji: "🍳",
    description: "Cook authentic dishes — recipes written in your target language",
    href: "/recipes",
    gradient: "from-orange-500 via-amber-500 to-yellow-600",
    glowColor: "rgba(249,115,22,0.55)",
    textAccent: "text-orange-300",
  },
];

const N = FEATURES.length;

type CompactMode = "mobile" | "tablet" | "desktop";

function readStoredWheelIndex(): number {
  try {
    const raw = sessionStorage.getItem(WHEEL_INDEX_KEY);
    if (raw === null) return 0;
    const n = Number.parseInt(raw, 10);
    if (Number.isInteger(n) && n >= 0 && n < N) return n;
  } catch {
    // ignore — private browsing / unavailable storage
  }
  return 0;
}

function saveWheelIndex(index: number) {
  try {
    sessionStorage.setItem(WHEEL_INDEX_KEY, String(index));
  } catch {
    // ignore
  }
}

function getCardTransform(
  offset: number,
  mode: CompactMode,
): React.CSSProperties {
  const abs = Math.abs(offset);
  const sign = Math.sign(offset) || 1;

  if (abs > 2) return { opacity: 0, pointerEvents: "none", zIndex: 0 };

  const x1 = mode === "mobile" ? 150 : mode === "tablet" ? 230 : 310;
  const x2 = mode === "mobile" ? 260 : mode === "tablet" ? 420 : 560;
  const rot1 = mode === "mobile" ? -18 : -28;
  const rot2 = mode === "mobile" ? -32 : -48;

  const translateX = abs === 0 ? 0 : sign * (abs === 1 ? x1 : x2);
  const rotateY = abs === 0 ? 0 : sign * (abs === 1 ? rot1 : rot2);
  const scale = abs === 0 ? 1 : abs === 1 ? (mode === "mobile" ? 0.72 : 0.78) : 0.58;
  const opacity = abs === 0 ? 1 : abs === 1 ? 0.65 : 0.3;
  const zIndex = abs === 0 ? 10 : abs === 1 ? 6 : 3;

  return {
    transform: `translateX(${translateX}px) rotateY(${rotateY}deg) scale(${scale})`,
    opacity,
    zIndex,
  };
}

type Props = {
  /** When true, only Story is playable; other cards show a lock. */
  storiesOnlyPreview?: boolean;
};

export function SpinWheel({ storiesOnlyPreview = true }: Props) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isSpinning, setIsSpinning] = useState(false);
  const [hasLanded, setHasLanded] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [compactMode, setCompactMode] = useState<CompactMode>("desktop");
  const router = useRouter();
  const wheelRef = useRef<HTMLDivElement>(null);

  const isUnlocked = useCallback(
    (featureId: string) => {
      if (!storiesOnlyPreview) return true;
      return PREVIEW_UNLOCKED_FEATURE_IDS.has(featureId);
    },
    [storiesOnlyPreview],
  );

  const unlockedIndexes = FEATURES.map((f, i) => (isUnlocked(f.id) ? i : -1)).filter(
    (i) => i >= 0,
  );

  useLayoutEffect(() => {
    const frame = requestAnimationFrame(() => {
      setActiveIndex(readStoredWheelIndex());
      setHydrated(true);
    });
    return () => cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    saveWheelIndex(activeIndex);
  }, [activeIndex, hydrated]);

  useEffect(() => {
    function updateMode() {
      const w = window.innerWidth;
      if (w < 640) setCompactMode("mobile");
      else if (w < 1024) setCompactMode("tablet");
      else setCompactMode("desktop");
    }
    updateMode();
    window.addEventListener("resize", updateMode);
    return () => window.removeEventListener("resize", updateMode);
  }, []);

  const advance = useCallback(
    (dir: 1 | -1) => {
      if (isSpinning) return;
      setHasLanded(false);
      setActiveIndex((prev) => (prev + dir + N) % N);
    },
    [isSpinning],
  );

  function spin() {
    if (isSpinning) return;
    setIsSpinning(true);
    setHasLanded(false);

    const pool = unlockedIndexes.length > 0 ? unlockedIndexes : [0];
    const targetIndex = pool[Math.floor(Math.random() * pool.length)] ?? 0;
    const remainder = ((targetIndex - activeIndex) % N + N) % N;
    const totalSteps = N * 3 + (remainder === 0 ? N : remainder);

    const DECEL = [120, 190, 280, 390, 520] as const;
    const delays: number[] = Array.from({ length: totalSteps }, (_, i) => {
      const remaining = totalSteps - i;
      if (remaining <= 5) return DECEL[5 - remaining] ?? 80;
      return 75;
    });

    let step = 0;
    function tick() {
      setActiveIndex((prev) => (prev + 1) % N);
      step++;
      if (step < totalSteps) {
        setTimeout(tick, delays[step] ?? 75);
      } else {
        setIsSpinning(false);
        setHasLanded(true);
      }
    }
    setTimeout(tick, delays[0] ?? 75);
  }

  const activeFeature = FEATURES[activeIndex];
  const activeUnlocked = activeFeature ? isUnlocked(activeFeature.id) : false;

  const cardH = compactMode === "mobile" ? "h-[320px]" : "h-[380px]";
  const cardW = compactMode === "mobile" ? "w-[min(260px,82vw)]" : "w-[280px]";
  const stageH = compactMode === "mobile" ? "h-[360px]" : "h-[420px]";

  return (
    <div className="flex w-full flex-col items-center gap-8 sm:gap-10">
      {storiesOnlyPreview && (
        <p className="max-w-md px-2 text-center text-xs text-slate-500 sm:text-sm">
          Free practice is open.{" "}
          <span className="font-semibold text-cyan-300">Chat</span> and{" "}
          <span className="font-semibold text-indigo-300">Journal</span> stay Premium for now.
        </p>
      )}

      <div
        ref={wheelRef}
        className={`relative flex ${stageH} w-full max-w-full items-center justify-center overflow-hidden sm:overflow-visible`}
        style={{ perspective: compactMode === "mobile" ? "900px" : "1200px" }}
        aria-label="Feature spin wheel — use arrows to browse"
      >
        {FEATURES.map((feature, i) => {
          const offset = ((i - activeIndex + N) % N + N) % N;
          const normOffset = offset > N / 2 ? offset - N : offset;
          const style = getCardTransform(normOffset, compactMode);
          const isActive = normOffset === 0;
          const unlocked = isUnlocked(feature.id);

          return (
            <div
              key={feature.id}
              style={{
                ...style,
                position: "absolute",
                transition: isSpinning
                  ? "transform 0.08s linear, opacity 0.08s linear"
                  : "transform 0.45s cubic-bezier(0.25,0.46,0.45,0.94), opacity 0.45s ease",
                transformStyle: "preserve-3d",
              }}
              aria-hidden={!isActive}
            >
              <div
                className={`relative flex ${cardH} ${cardW} flex-col items-center justify-between overflow-hidden rounded-[2rem] bg-gradient-to-br p-6 text-center sm:rounded-[2.5rem] sm:p-8 ${feature.gradient} shadow-2xl ${
                  unlocked ? "" : "grayscale-[0.45]"
                }`}
                style={{
                  boxShadow: isActive
                    ? `0 0 0 2px rgba(255,255,255,0.15), 0 30px 80px -10px ${feature.glowColor}, 0 0 60px ${feature.glowColor}`
                    : "0 20px 40px rgba(0,0,0,0.4)",
                }}
              >
                <div className="absolute inset-0 rounded-[2rem] bg-gradient-to-t from-black/40 via-transparent to-white/10 sm:rounded-[2.5rem]" />
                {!unlocked && (
                  <div className="absolute inset-0 z-20 rounded-[2rem] bg-black/45 sm:rounded-[2.5rem]" />
                )}

                <div className="relative z-10 flex flex-col items-center gap-3 sm:gap-4">
                  {!unlocked && (
                    <span className="absolute -top-1 right-0 flex h-9 w-9 items-center justify-center rounded-full border border-white/20 bg-black/50 text-white shadow-lg sm:-right-1">
                      <Lock className="h-4 w-4" aria-hidden="true" />
                      <span className="sr-only">Locked</span>
                    </span>
                  )}
                  <span
                    className={`drop-shadow-2xl ${compactMode === "mobile" ? "text-5xl" : "text-7xl"}`}
                    role="img"
                    aria-label={feature.label}
                  >
                    {feature.emoji}
                  </span>
                  <h3
                    className={`font-black tracking-tight text-white drop-shadow-lg ${
                      compactMode === "mobile" ? "text-2xl" : "text-3xl"
                    }`}
                  >
                    {feature.label}
                  </h3>
                  <p className="text-sm font-medium leading-snug text-white/70">
                    {unlocked
                      ? feature.description
                      : "Premium for now — AI tutor features coming with a paid plan."}
                  </p>
                </div>

                {isActive && hasLanded && !isSpinning && unlocked && (
                  <button
                    type="button"
                    onClick={() => router.push(feature.href)}
                    className="relative z-30 flex w-full items-center justify-center gap-2 rounded-2xl bg-white py-3.5 text-base font-black tracking-wide shadow-xl transition-all duration-200 hover:scale-105 hover:shadow-2xl active:scale-95"
                  >
                    <span
                      className={`bg-gradient-to-r ${feature.gradient} bg-clip-text text-transparent`}
                    >
                      Play now
                    </span>
                    <Play
                      className="h-4 w-4"
                      style={{ color: "rgba(0,0,0,0.6)" }}
                      aria-hidden="true"
                    />
                  </button>
                )}

                {isActive && hasLanded && !isSpinning && !unlocked && (
                  <div className="relative z-30 flex w-full items-center justify-center gap-2 rounded-2xl bg-white/15 py-3 text-sm font-bold text-white/90 backdrop-blur-sm">
                    <Lock className="h-4 w-4" aria-hidden="true" />
                    Premium
                  </div>
                )}

                {isActive && !hasLanded && !isSpinning && unlocked && (
                  <a
                    href={feature.href}
                    className="relative z-30 flex w-full items-center justify-center gap-2 rounded-2xl bg-white/20 py-3 text-sm font-bold text-white backdrop-blur-sm transition hover:bg-white/30"
                  >
                    Go to {feature.label}
                  </a>
                )}

                {isActive && !hasLanded && !isSpinning && !unlocked && (
                  <div className="relative z-30 flex w-full items-center justify-center gap-2 rounded-2xl border border-white/15 bg-black/30 py-3 text-sm font-bold text-white/70">
                    <Lock className="h-4 w-4" aria-hidden="true" />
                    Premium
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex w-full flex-col items-center gap-4 px-2 sm:gap-5">
        <div className="flex w-full max-w-lg items-center justify-center gap-3 sm:gap-6">
          <button
            type="button"
            onClick={() => advance(-1)}
            disabled={isSpinning}
            aria-label="Previous activity"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-slate-300 backdrop-blur-sm transition hover:border-white/20 hover:bg-white/10 hover:text-white disabled:opacity-40 sm:h-12 sm:w-12"
          >
            <ChevronLeft className="h-5 w-5" aria-hidden="true" />
          </button>

          <div className="flex max-w-[min(100%,16rem)] flex-wrap justify-center gap-1.5 sm:max-w-none sm:gap-2">
            {FEATURES.map((f, i) => (
              <button
                key={f.id}
                type="button"
                onClick={() => {
                  if (!isSpinning) {
                    setHasLanded(false);
                    setActiveIndex(i);
                  }
                }}
                aria-label={`Go to ${f.label}${isUnlocked(f.id) ? "" : " (locked)"}`}
                aria-current={i === activeIndex}
                className={`h-2 rounded-full transition-all duration-300 ${
                  i === activeIndex
                    ? "w-6 bg-white sm:w-8"
                    : isUnlocked(f.id)
                      ? "w-2 bg-white/30 hover:bg-white/50"
                      : "w-2 bg-white/15"
                }`}
              />
            ))}
          </div>

          <button
            type="button"
            onClick={() => advance(1)}
            disabled={isSpinning}
            aria-label="Next activity"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-slate-300 backdrop-blur-sm transition hover:border-white/20 hover:bg-white/10 hover:text-white disabled:opacity-40 sm:h-12 sm:w-12"
          >
            <ChevronRight className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        <button
          type="button"
          onClick={spin}
          disabled={isSpinning}
          className={`group relative flex w-full max-w-xs items-center justify-center gap-3 overflow-hidden rounded-2xl px-6 py-3.5 text-base font-black tracking-wide text-white shadow-2xl transition-all duration-300 sm:max-w-none sm:px-8 sm:py-4 sm:text-lg ${
            isSpinning
              ? "cursor-not-allowed bg-slate-700 opacity-80"
              : "bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 shadow-emerald-500/40 hover:scale-105 hover:shadow-emerald-400/60 active:scale-95"
          }`}
        >
          {!isSpinning && (
            <span
              className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 group-hover:translate-x-full"
              aria-hidden="true"
            />
          )}
          <Shuffle
            className={`h-5 w-5 ${isSpinning ? "animate-spin" : ""}`}
            aria-hidden="true"
          />
          {isSpinning ? "Spinning…" : "Spin the wheel!"}
        </button>

        {hasLanded && activeFeature && (
          <p
            className={`text-center text-sm font-semibold ${
              activeUnlocked ? "animate-pulse text-emerald-400" : "text-slate-400"
            }`}
          >
            {activeUnlocked
              ? `✦ Landed on ${activeFeature.label}! Tap Play to start.`
              : `Landed on ${activeFeature.label} — locked during soft launch.`}
          </p>
        )}
      </div>
    </div>
  );
}
