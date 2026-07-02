const FEATURES = [
  {
    emoji: "📖",
    title: "Adaptive Stories",
    description: "AI-crafted narratives at your exact CEFR level. Hover any sentence for instant translation.",
    gradient: "from-violet-500/20 to-purple-500/5",
    border: "border-violet-500/20",
    glow: "text-violet-400",
  },
  {
    emoji: "⚡",
    title: "Grammar Drills",
    description: "AI-powered drills that prioritize your weakest concepts. Groq gives instant feedback.",
    gradient: "from-rose-500/20 to-red-500/5",
    border: "border-rose-500/20",
    glow: "text-rose-400",
  },
  {
    emoji: "💬",
    title: "Voice Chat Tutor",
    description: "Speak out loud — Lucía or Sophie respond in your target language with real-time TTS.",
    gradient: "from-cyan-500/20 to-blue-500/5",
    border: "border-cyan-500/20",
    glow: "text-cyan-400",
  },
  {
    emoji: "🎯",
    title: "Daily Crossword",
    description: "Vocabulary-focused puzzles that refresh every day to keep your streak alive.",
    gradient: "from-amber-500/20 to-orange-500/5",
    border: "border-amber-500/20",
    glow: "text-amber-400",
  },
  {
    emoji: "✨",
    title: "Idiom Flashcards",
    description: "Flip-card decks of native idioms with spaced-repetition style known/review tracking.",
    gradient: "from-fuchsia-500/20 to-pink-500/5",
    border: "border-fuchsia-500/20",
    glow: "text-fuchsia-400",
  },
  {
    emoji: "🧠",
    title: "Personalization Engine",
    description: "Your interests and genres shape every story. Adaptive CEFR auto-adjusts your level.",
    gradient: "from-emerald-500/20 to-teal-500/5",
    border: "border-emerald-500/20",
    glow: "text-emerald-400",
  },
];

export function FeatureGrid() {
  return (
    <section id="features" className="px-4 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-12 text-center">
          <h2 className="text-4xl font-black tracking-tight text-white sm:text-5xl">
            Everything you need to{" "}
            <span className="bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
              actually improve
            </span>
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-lg text-slate-400">
            Six learning modes, all powered by AI, all synced to your CEFR level.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((feature) => (
            <article
              key={feature.title}
              className={`rounded-3xl border bg-gradient-to-br p-6 ${feature.gradient} ${feature.border} transition-all duration-300 hover:-translate-y-1 hover:border-white/20`}
            >
              <div className="mb-4 text-4xl">{feature.emoji}</div>
              <h3 className={`text-lg font-bold ${feature.glow}`}>
                {feature.title}
              </h3>
              <p className="mt-2 text-sm leading-6 text-slate-400">
                {feature.description}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
