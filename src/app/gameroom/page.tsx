import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Lock } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import type { Language, Profile } from "@/lib/supabase/types";

type Game = {
  id: string;
  label: string;
  emoji: string;
  description: string;
  tags: string[];
  difficulty: "Easy" | "Medium" | "Hard";
  href: string;
  gradient: string;
  available: boolean;
};

const GAMES: Game[] = [
  {
    id: "wordle",
    label: "Wordle",
    emoji: "🟩",
    description: "Guess the hidden 5-letter word in 6 tries. One new word every day.",
    tags: ["Solo", "Daily"],
    difficulty: "Easy",
    href: "/gameroom/wordle",
    gradient: "from-emerald-500 to-teal-600",
    available: true,
  },
  {
    id: "hangman",
    label: "Hangman",
    emoji: "🪢",
    description: "Guess the mystery vocabulary word letter by letter before you run out.",
    tags: ["Solo"],
    difficulty: "Easy",
    href: "/gameroom/hangman",
    gradient: "from-amber-500 to-orange-600",
    available: true,
  },
  {
    id: "cannon",
    label: "Vocab Cannon",
    emoji: "🎯",
    description: "An English word appears on your cannon. Shoot the correct translation before it lands!",
    tags: ["Solo", "Timed"],
    difficulty: "Medium",
    href: "/gameroom/cannon",
    gradient: "from-rose-500 to-red-600",
    available: true,
  },
  {
    id: "word-soup",
    label: "Word Soup",
    emoji: "🔤",
    description: "Connect adjacent letters on a grid to form as many words as possible. Boggle-style.",
    tags: ["Solo", "Timed"],
    difficulty: "Medium",
    href: "/gameroom/word-soup",
    gradient: "from-violet-500 to-purple-600",
    available: true,
  },
  {
    id: "twenty-questions",
    label: "20 Questions",
    emoji: "❓",
    description: "The AI thinks of a word. Ask yes/no questions in your target language to guess it.",
    tags: ["Solo", "AI"],
    difficulty: "Medium",
    href: "/gameroom/twenty-questions",
    gradient: "from-cyan-500 to-blue-600",
    available: true,
  },
  {
    id: "verb-race",
    label: "Verb Race",
    emoji: "⚡",
    description: "A verb and pronoun flash on screen — conjugate it correctly as fast as possible.",
    tags: ["Solo", "Timed"],
    difficulty: "Hard",
    href: "/gameroom/verb-race",
    gradient: "from-yellow-500 to-amber-600",
    available: true,
  },
  {
    id: "pictionary",
    label: "Pictionary",
    emoji: "🎨",
    description: "One player draws a word while everyone else races to guess it. Real-time multiplayer.",
    tags: ["Multiplayer", "Live"],
    difficulty: "Easy",
    href: "/gameroom/pictionary",
    gradient: "from-fuchsia-500 to-pink-600",
    available: true,
  },
];

const DIFFICULTY_STYLES = {
  Easy:   "bg-emerald-500/20 text-emerald-300",
  Medium: "bg-amber-500/20 text-amber-300",
  Hard:   "bg-rose-500/20 text-rose-300",
};

const TAG_STYLES: Record<string, string> = {
  Solo:        "bg-slate-500/20 text-slate-300",
  Multiplayer: "bg-blue-500/20 text-blue-300",
  Daily:       "bg-violet-500/20 text-violet-300",
  Timed:       "bg-orange-500/20 text-orange-300",
  AI:          "bg-cyan-500/20 text-cyan-300",
  Live:        "bg-rose-500/20 text-rose-300",
};

const LANG_META: Record<Language, { name: string; flag: string }> = {
  es: { name: "Spanish", flag: "🇪🇸" },
  fr: { name: "French", flag: "🇫🇷" },
};

export default async function GameRoomPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single<Profile>();

  const language: Language = profile?.language ?? "es";
  const meta = LANG_META[language];

  const available = GAMES.filter((g) => g.available);
  const coming = GAMES.filter((g) => !g.available);

  return (
    <div className="min-h-screen bg-[#07070f]">
      {/* Header */}
      <header className="sticky top-0 z-20 border-b border-white/8 bg-gradient-to-r from-[#0d0d1e] to-[#12122a] px-6 py-4">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/dashboard"
              className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-300 transition hover:bg-white/10 hover:text-white"
            >
              <ArrowLeft className="h-4 w-4" />
              Dashboard
            </Link>
            <div className="flex items-center gap-2">
              <span className="text-2xl" aria-hidden="true">🕹️</span>
              <div>
                <h1 className="text-lg font-extrabold leading-none text-white">Game Room</h1>
                <p className="text-xs text-slate-400">
                  Play in {meta.flag} {meta.name}
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-10 space-y-12">
        {/* Available games */}
        <section>
          <h2 className="mb-5 text-xs font-bold uppercase tracking-widest text-emerald-400">
            Available now
          </h2>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {available.map((game) => (
              <GameCard key={game.id} game={game} />
            ))}
          </div>
        </section>

        {/* Coming soon */}
        <section>
          <h2 className="mb-5 text-xs font-bold uppercase tracking-widest text-slate-500">
            Coming soon
          </h2>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {coming.map((game) => (
              <GameCard key={game.id} game={game} />
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}

function GameCard({ game }: { game: Game }) {
  return (
    <div
      className={`group relative flex flex-col overflow-hidden rounded-2xl border transition
        ${game.available
          ? "border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/8"
          : "border-white/5 bg-white/3 opacity-60"
        }`}
    >
      {/* Gradient top bar */}
      <div className={`h-1.5 w-full bg-gradient-to-r ${game.gradient}`} />

      <div className="flex flex-1 flex-col gap-4 p-5">
        {/* Emoji + title */}
        <div className="flex items-center gap-3">
          <span className="text-3xl" aria-hidden="true">{game.emoji}</span>
          <div>
            <h3 className="font-extrabold text-white">{game.label}</h3>
            <div className="mt-1 flex flex-wrap gap-1">
              <span className={`rounded-md px-1.5 py-0.5 text-[10px] font-bold uppercase ${DIFFICULTY_STYLES[game.difficulty]}`}>
                {game.difficulty}
              </span>
              {game.tags.map((tag) => (
                <span
                  key={tag}
                  className={`rounded-md px-1.5 py-0.5 text-[10px] font-semibold uppercase ${TAG_STYLES[tag] ?? "bg-slate-500/20 text-slate-300"}`}
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Description */}
        <p className="flex-1 text-sm leading-6 text-slate-400">{game.description}</p>

        {/* CTA */}
        {game.available ? (
          <Link
            href={game.href}
            className={`block w-full rounded-xl bg-gradient-to-r ${game.gradient} py-3 text-center text-sm font-bold text-white shadow-lg transition hover:opacity-90`}
          >
            Play now
          </Link>
        ) : (
          <div className="flex items-center justify-center gap-2 rounded-xl border border-white/10 py-3 text-sm font-semibold text-slate-500">
            <Lock className="h-3.5 w-3.5" aria-hidden="true" />
            Coming soon
          </div>
        )}
      </div>
    </div>
  );
}
