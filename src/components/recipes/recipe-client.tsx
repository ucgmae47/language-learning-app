"use client";

import { useState } from "react";
import { ChefHat } from "lucide-react";
import { logEvent } from "@/app/actions/events";
import { cuisineToCanonical, WEIGHTS } from "@/lib/events/taxonomy";
import type { Language } from "@/lib/supabase/types";

type Recipe = {
  name: string;
  name_english: string;
  country: string;
  difficulty: string;
  prep_time: string;
  servings: string;
  description: string;
  cultural_note: string;
  ingredients: string;
  instructions: string;
  vocabulary_notes: string;
};

type Props = {
  language: Language;
  cefrLevel: string;
};

const CUISINES: Record<Language, { label: string; flag: string }[]> = {
  es: [
    { label: "Mexican", flag: "🇲🇽" },
    { label: "Colombian", flag: "🇨🇴" },
    { label: "Argentine", flag: "🇦🇷" },
    { label: "Peruvian", flag: "🇵🇪" },
    { label: "Spanish", flag: "🇪🇸" },
    { label: "Cuban", flag: "🇨🇺" },
    { label: "Dominican", flag: "🇩🇴" },
  ],
  fr: [
    { label: "French", flag: "🇫🇷" },
    { label: "Québécois", flag: "🇨🇦" },
    { label: "Moroccan", flag: "🇲🇦" },
    { label: "Senegalese", flag: "🇸🇳" },
    { label: "Haitian", flag: "🇭🇹" },
  ],
};

const DIFFICULTY_COLORS: Record<string, string> = {
  Easy: "text-emerald-400 bg-emerald-500/20 border-emerald-500/30",
  Medium: "text-amber-400 bg-amber-500/20 border-amber-500/30",
  Challenging: "text-red-400 bg-red-500/20 border-red-500/30",
};

function RecipeSkeleton() {
  return (
    <div className="animate-pulse flex flex-col gap-4">
      <div className="h-8 w-2/3 rounded-xl bg-white/6" />
      <div className="h-4 w-1/3 rounded-lg bg-white/4" />
      <div className="h-24 w-full rounded-2xl bg-white/4" />
      <div className="h-48 w-full rounded-2xl bg-white/4" />
      <div className="h-64 w-full rounded-2xl bg-white/4" />
    </div>
  );
}

function Section({ title, emoji, children }: { title: string; emoji: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-white/8 bg-white/4 p-4">
      <p className="text-sm font-bold text-white mb-3">
        <span className="mr-2" aria-hidden="true">{emoji}</span>
        {title}
      </p>
      {children}
    </div>
  );
}

export function RecipeClient({ language, cefrLevel }: Props) {
  const cuisines = CUISINES[language];
  const [selectedCuisine, setSelectedCuisine] = useState<string | null>(null);
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function generate(cuisine: string) {
    setSelectedCuisine(cuisine);
    setIsLoading(true);
    setError(null);
    setRecipe(null);
    try {
      const res = await fetch("/api/recipes/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ language, cefrLevel, cuisine }),
      });
      if (!res.ok) throw new Error("Failed to generate recipe");
      const data = (await res.json()) as Recipe;
      setRecipe(data);

      // Log behavioral event — cuisine selection is a strong food signal
      void logEvent({
        language,
        source: "recipe",
        event_type: "recipe_generated",
        topic: cuisineToCanonical(),
        raw_topic: cuisine,
        weight: WEIGHTS.RECIPE_GENERATED,
      });
    } catch {
      setError("Couldn't generate recipe. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Cuisine selector */}
      <div className="flex flex-wrap gap-2">
        {cuisines.map(({ label, flag }) => (
          <button
            key={label}
            type="button"
            onClick={() => void generate(label)}
            disabled={isLoading}
            className={`flex items-center gap-2 rounded-2xl border px-4 py-2.5 text-sm font-semibold transition disabled:opacity-50 ${
              selectedCuisine === label
                ? "border-orange-500/60 bg-orange-500/20 text-orange-200"
                : "border-white/10 bg-white/4 text-slate-300 hover:bg-white/8 hover:text-white"
            }`}
          >
            <span aria-hidden="true">{flag}</span>
            {label}
          </button>
        ))}
      </div>

      {/* Empty state */}
      {!selectedCuisine && (
        <div className="flex flex-col items-center gap-3 rounded-3xl border border-dashed border-white/10 py-16 text-center">
          <span className="text-5xl" aria-hidden="true">🍳</span>
          <p className="text-slate-400 text-sm">Select a cuisine to generate a recipe</p>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      {/* Loading */}
      {isLoading && <RecipeSkeleton />}

      {/* Recipe */}
      {recipe && !isLoading && (
        <div className="flex flex-col gap-4">
          {/* Header */}
          <div className="rounded-2xl border border-white/8 bg-white/4 p-5">
            <h2 className="text-2xl font-extrabold text-white leading-tight">{recipe.name}</h2>
            <p className="text-slate-400 text-sm mt-1">{recipe.name_english}</p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className="text-sm text-slate-300">{recipe.country}</span>
              <span className="text-slate-600">·</span>
              <span
                className={`rounded-xl border px-2.5 py-0.5 text-xs font-bold ${DIFFICULTY_COLORS[recipe.difficulty] ?? DIFFICULTY_COLORS["Medium"]}`}
              >
                {recipe.difficulty}
              </span>
              <span className="text-slate-600">·</span>
              <span className="text-xs text-slate-400">⏱ {recipe.prep_time}</span>
              <span className="text-slate-600">·</span>
              <span className="text-xs text-slate-400">👥 {recipe.servings}</span>
            </div>
          </div>

          {/* Description + cultural note */}
          <Section title="About This Dish" emoji="📖">
            <p className="text-sm text-slate-200 leading-relaxed">{recipe.description}</p>
            <div className="mt-3 rounded-xl border border-violet-500/20 bg-violet-500/10 px-3 py-2.5">
              <p className="text-xs font-bold text-violet-400 mb-1">Cultural Note</p>
              <p className="text-xs text-violet-200/90 leading-relaxed">{recipe.cultural_note}</p>
            </div>
          </Section>

          {/* Ingredients */}
          <Section title="Ingredientes / Ingrédients" emoji="🛒">
            <pre className="whitespace-pre-wrap font-sans text-sm text-slate-200 leading-7">
              {recipe.ingredients}
            </pre>
          </Section>

          {/* Instructions */}
          <Section title="Preparación / Préparation" emoji="👨‍🍳">
            <pre className="whitespace-pre-wrap font-sans text-sm text-slate-200 leading-7">
              {recipe.instructions}
            </pre>
          </Section>

          {/* Vocabulary */}
          <Section title="Vocabulary Notes" emoji="📚">
            <pre className="whitespace-pre-wrap font-sans text-sm text-slate-300 leading-7">
              {recipe.vocabulary_notes}
            </pre>
          </Section>

          {/* Generate another */}
          <button
            type="button"
            onClick={() => selectedCuisine && void generate(selectedCuisine)}
            className="flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 py-3 text-sm font-bold text-slate-300 transition hover:bg-white/10"
          >
            <ChefHat className="h-4 w-4" aria-hidden="true" />
            Generate Another Recipe
          </button>
        </div>
      )}
    </div>
  );
}
