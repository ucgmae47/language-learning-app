"use client";

import { useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, Shuffle, Play } from "lucide-react";

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

const FEATURES: Feature[] = [
  {
    id: "story",
    label: "Story",
    emoji: "📖",
    description: "Read an AI-generated story at your exact level",
    href: "/stories",
    gradient: "from-violet-600 via-purple-600 to-indigo-700",
    glowColor: "rgba(139,92,246,0.55)",
    textAccent: "text-violet-300",
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
    id: "news",
    label: "News",
    emoji: "🌍",
    description: "Browse real headlines rewritten at your CEFR level",
    href: "/news",
    gradient: "from-slate-500 via-zinc-500 to-gray-600",
    glowColor: "rgba(100,116,139,0.55)",
    textAccent: "text-slate-300",
  },
];

const N = FEATURES.length;

// Card visual style by offset from center (-2 to +2)
function getCardTransform(offset: number): React.CSSProperties {
  const abs = Math.abs(offset);
  const sign = Math.sign(offset) || 1;

  if (abs > 2) return { opacity: 0, pointerEvents: "none", zIndex: 0 };

  const translateX = abs === 0 ? 0 : sign * (abs === 1 ? 310 : 560);
  const rotateY = abs === 0 ? 0 : sign * (abs === 1 ? -28 : -48);
  const scale = abs === 0 ? 1 : abs === 1 ? 0.78 : 0.58;
  const opacity = abs === 0 ? 1 : abs === 1 ? 0.65 : 0.3;
  const zIndex = abs === 0 ? 10 : abs === 1 ? 6 : 3;

  return {
    transform: `translateX(${translateX}px) rotateY(${rotateY}deg) scale(${scale})`,
    opacity,
    zIndex,
  };
}

export function SpinWheel() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isSpinning, setIsSpinning] = useState(false);
  const [hasLanded, setHasLanded] = useState(false);
  const router = useRouter();
  const wheelRef = useRef<HTMLDivElement>(null);
  const lastScrollTime = useRef(0);

  // Advance or retreat by one position
  const advance = useCallback(
    (dir: 1 | -1) => {
      if (isSpinning) return;
      setHasLanded(false);
      setActiveIndex((prev) => (prev + dir + N) % N);
    },
    [isSpinning],
  );

  // Mouse-wheel scrolling (debounced to one step per 300ms)
  function handleWheel(e: React.WheelEvent) {
    e.preventDefault();
    const now = Date.now();
    if (now - lastScrollTime.current < 300) return;
    lastScrollTime.current = now;
    advance(e.deltaY > 0 ? 1 : -1);
  }

  // Spin button: advance rapidly with deceleration, land on a random card
  function spin() {
    if (isSpinning) return;
    setIsSpinning(true);
    setHasLanded(false);

    const targetIndex = Math.floor(Math.random() * N);
    const remainder = ((targetIndex - activeIndex) % N + N) % N;
    // At least 3 full rotations + steps to reach target
    const totalSteps = N * 3 + (remainder === 0 ? N : remainder);

    // Pre-compute delays: fast for most, decelerating for last 5 steps
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

  return (
    <div className="flex flex-col items-center gap-10">
      {/* 3D carousel stage */}
      <div
        ref={wheelRef}
        className="relative flex h-[420px] w-full items-center justify-center overflow-visible"
        style={{ perspective: "1200px" }}
        onWheel={handleWheel}
        aria-label="Feature spin wheel — scroll or use arrows to browse"
      >
        {FEATURES.map((feature, i) => {
          const offset = ((i - activeIndex + N) % N + N) % N;
          // Normalize offset to [-2, 2]
          const normOffset = offset > N / 2 ? offset - N : offset;
          const style = getCardTransform(normOffset);
          const isActive = normOffset === 0;

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
                className={`relative flex h-[380px] w-[280px] flex-col items-center justify-between overflow-hidden rounded-[2.5rem] bg-gradient-to-br p-8 text-center ${feature.gradient} shadow-2xl`}
                style={{
                  boxShadow: isActive
                    ? `0 0 0 2px rgba(255,255,255,0.15), 0 30px 80px -10px ${feature.glowColor}, 0 0 60px ${feature.glowColor}`
                    : "0 20px 40px rgba(0,0,0,0.4)",
                }}
              >
                {/* Inner glow overlay */}
                <div className="absolute inset-0 rounded-[2.5rem] bg-gradient-to-t from-black/40 via-transparent to-white/10" />

                {/* Content */}
                <div className="relative z-10 flex flex-col items-center gap-4">
                  <span className="text-7xl drop-shadow-2xl" role="img" aria-label={feature.label}>
                    {feature.emoji}
                  </span>
                  <h3 className="text-3xl font-black tracking-tight text-white drop-shadow-lg">
                    {feature.label}
                  </h3>
                  <p className="text-sm font-medium leading-snug text-white/70">
                    {feature.description}
                  </p>
                </div>

                {/* Play button — only on active card, only after landing */}
                {isActive && hasLanded && !isSpinning && (
                  <button
                    type="button"
                    onClick={() => router.push(feature.href)}
                    className="relative z-10 flex w-full items-center justify-center gap-2 rounded-2xl bg-white py-3.5 text-base font-black tracking-wide shadow-xl transition-all duration-200 hover:scale-105 hover:shadow-2xl active:scale-95"
                    style={{ color: "transparent", backgroundClip: "text" }}
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

                {/* Direct link for non-spin navigation */}
                {isActive && !hasLanded && !isSpinning && (
                  <a
                    href={feature.href}
                    className="relative z-10 flex w-full items-center justify-center gap-2 rounded-2xl bg-white/20 py-3 text-sm font-bold text-white backdrop-blur-sm transition hover:bg-white/30"
                  >
                    Go to {feature.label}
                  </a>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Controls */}
      <div className="flex flex-col items-center gap-5">
        {/* Arrow nav */}
        <div className="flex items-center gap-6">
          <button
            type="button"
            onClick={() => advance(-1)}
            disabled={isSpinning}
            aria-label="Previous activity"
            className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-slate-300 backdrop-blur-sm transition hover:border-white/20 hover:bg-white/10 hover:text-white disabled:opacity-40"
          >
            <ChevronLeft className="h-5 w-5" aria-hidden="true" />
          </button>

          {/* Dot indicators */}
          <div className="flex gap-2">
            {FEATURES.map((f, i) => (
              <button
                key={f.id}
                type="button"
                onClick={() => { if (!isSpinning) { setHasLanded(false); setActiveIndex(i); } }}
                aria-label={`Go to ${f.label}`}
                aria-current={i === activeIndex}
                className={`h-2 rounded-full transition-all duration-300 ${
                  i === activeIndex
                    ? "w-8 bg-white"
                    : "w-2 bg-white/30 hover:bg-white/50"
                }`}
              />
            ))}
          </div>

          <button
            type="button"
            onClick={() => advance(1)}
            disabled={isSpinning}
            aria-label="Next activity"
            className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-slate-300 backdrop-blur-sm transition hover:border-white/20 hover:bg-white/10 hover:text-white disabled:opacity-40"
          >
            <ChevronRight className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        {/* Spin button */}
        <button
          type="button"
          onClick={spin}
          disabled={isSpinning}
          className={`group relative flex items-center gap-3 overflow-hidden rounded-2xl px-8 py-4 text-lg font-black tracking-wide text-white shadow-2xl transition-all duration-300 ${
            isSpinning
              ? "cursor-not-allowed bg-slate-700 opacity-80"
              : "bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 shadow-emerald-500/40 hover:scale-105 hover:shadow-emerald-400/60 active:scale-95"
          }`}
        >
          {/* Shimmer sweep */}
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
          {isSpinning ? "Spinning…" : "🎲 Spin the wheel!"}
        </button>

        {hasLanded && activeFeature && (
          <p className="animate-pulse text-sm font-semibold text-emerald-400">
            ✦ Landed on {activeFeature.label}! Tap Play to start.
          </p>
        )}
      </div>
    </div>
  );
}
