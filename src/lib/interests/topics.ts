import type { InterestTopic } from "@/lib/supabase/types";

export const INTEREST_TOPICS: {
  id: InterestTopic;
  label: string;
  emoji: string;
}[] = [
  { id: "food", label: "Food", emoji: "🍽️" },
  { id: "travel", label: "Travel", emoji: "✈️" },
  { id: "sports", label: "Sports", emoji: "⚽" },
  { id: "technology", label: "Technology", emoji: "💻" },
  { id: "culture", label: "Culture", emoji: "🎭" },
  { id: "music", label: "Music", emoji: "🎵" },
  { id: "film", label: "Film", emoji: "🎬" },
  { id: "science", label: "Science", emoji: "🔬" },
  { id: "business", label: "Business", emoji: "💼" },
  { id: "history", label: "History", emoji: "📜" },
];

export const INTEREST_TOPIC_IDS: InterestTopic[] = INTEREST_TOPICS.map((t) => t.id);

export function isInterestTopic(value: string): value is InterestTopic {
  return (INTEREST_TOPIC_IDS as string[]).includes(value);
}
