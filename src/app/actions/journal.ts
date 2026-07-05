"use server";

import { after } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { insertEvent } from "@/lib/events/log-event";
import { normalizeRawTopic, WEIGHTS, type CanonicalTopic } from "@/lib/events/taxonomy";
import { aggregateTopicScores } from "@/lib/events/aggregate";
import type { JournalEntry, JournalFeedback, Language } from "@/lib/supabase/types";

/**
 * Lightweight keyword scan to detect 1-2 dominant topics in a journal entry.
 * Zero extra API calls.
 */
const TOPIC_KEYWORDS: Array<{ keywords: string[]; topic: CanonicalTopic }> = [
  { keywords: ["comida", "cocina", "restaurante", "receta", "nourriture", "cuisine", "repas", "recette", "food", "cook", "recipe"], topic: "food_cuisine" },
  { keywords: ["viaje", "ciudad", "pais", "país", "vacaciones", "voyage", "ville", "pays", "vacances", "travel", "city", "country"], topic: "travel_geography" },
  { keywords: ["música", "musica", "canción", "artista", "concierto", "musique", "chanson", "concert", "music", "song", "artist"], topic: "music_performance" },
  { keywords: ["deporte", "fútbol", "futbol", "tenis", "sport", "football", "tennis", "basketball", "sports"], topic: "sports_athletics" },
  { keywords: ["amor", "relación", "novio", "novia", "familia", "amour", "relation", "famille", "love", "family", "relationship"], topic: "romance_relationships" },
  { keywords: ["naturaleza", "ambiente", "clima", "nature", "environnement", "climat", "environment", "climate"], topic: "nature_environment" },
  { keywords: ["salud", "médico", "ejercicio", "santé", "médecin", "exercice", "health", "doctor", "exercise"], topic: "health_wellness" },
  { keywords: ["tecnología", "tecnologia", "computadora", "teléfono", "technologie", "ordinateur", "téléphone", "technology", "computer"], topic: "science_technology" },
  { keywords: ["historia", "cultura", "arte", "musée", "histoire", "culture", "art", "museum", "history"], topic: "history_culture" },
  { keywords: ["trabajo", "empresa", "dinero", "travail", "entreprise", "argent", "work", "business", "money"], topic: "business_economics" },
  { keywords: ["política", "politica", "gobierno", "politique", "gouvernement", "politics", "government"], topic: "politics_society" },
  { keywords: ["misterio", "crimen", "detective", "mystère", "crime", "mystery", "detective", "thriller"], topic: "mystery_thriller" },
  { keywords: ["fantasía", "fantasia", "magia", "aventura", "fantaisie", "magie", "aventure", "fantasy", "magic", "adventure"], topic: "fantasy_adventure" },
];

function detectTopicsFromText(text: string): CanonicalTopic[] {
  const lower = text.toLowerCase();
  const found = new Set<CanonicalTopic>();

  for (const { keywords, topic } of TOPIC_KEYWORDS) {
    if (keywords.some((kw) => lower.includes(kw))) {
      found.add(topic);
      if (found.size >= 2) break; // cap at 2 topics per entry
    }
  }

  // Fallback: always log at least language_education (writing in target lang is learning)
  if (found.size === 0) {
    found.add("language_education");
  }

  return Array.from(found);
}

export async function saveJournalEntry(
  content: string,
  language: Language,
  feedback: JournalFeedback,
): Promise<{ id?: string; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  const { data, error } = await supabase
    .from("journal_entries")
    .insert({
      user_id: user.id,
      language,
      content,
      feedback,
      score: feedback.overall_score,
    })
    .select("id")
    .single();

  if (error) return { error: error.message };

  // ── Log behavioral events for this journal save ────────────────────────────
  const topics = detectTopicsFromText(content);
  for (const topic of topics) {
    void insertEvent(supabase, user.id, {
      language,
      source: "journal",
      event_type: "entry_saved",
      topic,
      raw_topic: normalizeRawTopic(topic),
      weight: WEIGHTS.JOURNAL_ENTRY_SAVED,
    });
  }

  const userId = user.id;
  after(async () => {
    await aggregateTopicScores(userId, language);
  });

  return { id: data.id };
}

export async function getJournalEntries(): Promise<JournalEntry[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data } = await supabase
    .from("journal_entries")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(20)
    .returns<JournalEntry[]>();

  return data ?? [];
}
