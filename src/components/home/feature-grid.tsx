import {
  BookText,
  Brain,
  MessageCircle,
  Puzzle,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

type Feature = {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
};

const features: Feature[] = [
  {
    id: "stories",
    title: "Adaptive Stories",
    description:
      "Read short Spanish narratives tailored to your level, with interactive quizzes after each passage.",
    icon: BookText,
  },
  {
    id: "daily",
    title: "Daily Engagement",
    description:
      "Build momentum with word-of-the-day prompts, crossword puzzles, and streak-friendly micro-lessons.",
    icon: Puzzle,
  },
  {
    id: "chat",
    title: "Conversation Practice",
    description:
      "Practice real dialogue with a supportive chatbot that remembers your interests and learning goals.",
    icon: MessageCircle,
  },
  {
    id: "assessment",
    title: "CEFR Assessment",
    description:
      "Start with a proficiency baseline so every story, drill, and recommendation matches your B1–B2 journey.",
    icon: Brain,
  },
];

export function FeatureGrid() {
  return (
    <section id="features" className="px-4 py-16 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="max-w-2xl">
          <h2 className="text-3xl font-bold tracking-tight text-slate-900">
            Everything you need for Phase 1
          </h2>
          <p className="mt-3 text-lg text-slate-600">
            The Spanish MVP brings reading, daily practice, and conversational
            support into one cohesive learning experience.
          </p>
        </div>

        <div className="mt-10 grid gap-6 sm:grid-cols-2">
          {features.map((feature) => {
            const Icon = feature.icon;

            return (
              <article
                key={feature.id}
                id={feature.id}
                className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-md"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </div>
                <h3 className="mt-4 text-xl font-semibold text-slate-900">
                  {feature.title}
                </h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  {feature.description}
                </p>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
