export type Achievement = {
  id: string;
  label: string;
  emoji: string;
  description: string;
  category: "reading" | "vocabulary" | "social" | "streak" | "mastery";
};

export const ACHIEVEMENTS: Record<string, Achievement> = {
  first_story: {
    id: "first_story",
    label: "First Chapter",
    emoji: "📖",
    description: "Read your first AI story",
    category: "reading",
  },
  stories_5: {
    id: "stories_5",
    label: "Bookworm",
    emoji: "🐛",
    description: "Read 5 stories",
    category: "reading",
  },
  stories_25: {
    id: "stories_25",
    label: "Avid Reader",
    emoji: "🎓",
    description: "Read 25 stories",
    category: "reading",
  },
  quiz_perfect: {
    id: "quiz_perfect",
    label: "Perfectionist",
    emoji: "💯",
    description: "Score 100% on a story quiz",
    category: "reading",
  },
  streak_7: {
    id: "streak_7",
    label: "Week Warrior",
    emoji: "🔥",
    description: "7-day learning streak",
    category: "streak",
  },
  streak_30: {
    id: "streak_30",
    label: "Monthly Master",
    emoji: "🏆",
    description: "30-day learning streak",
    category: "streak",
  },
  vocab_10: {
    id: "vocab_10",
    label: "Word Collector",
    emoji: "📚",
    description: "Save 10 vocabulary words",
    category: "vocabulary",
  },
  vocab_50: {
    id: "vocab_50",
    label: "Lexicon Builder",
    emoji: "📦",
    description: "Save 50 vocabulary words",
    category: "vocabulary",
  },
  vocab_mastered_10: {
    id: "vocab_mastered_10",
    label: "Word Master",
    emoji: "🧠",
    description: "Master 10 vocabulary words (21+ day interval)",
    category: "vocabulary",
  },
  sentences_10: {
    id: "sentences_10",
    label: "Sentence Crafter",
    emoji: "✏️",
    description: "Complete 10 sentence builder challenges",
    category: "mastery",
  },
  sentences_perfect: {
    id: "sentences_perfect",
    label: "Grammar Guru",
    emoji: "✅",
    description: "Get 10 perfect sentences in a row",
    category: "mastery",
  },
  journal_first: {
    id: "journal_first",
    label: "First Entry",
    emoji: "📝",
    description: "Write your first journal entry",
    category: "reading",
  },
  chat_room_joined: {
    id: "chat_room_joined",
    label: "Social Butterfly",
    emoji: "💬",
    description: "Join a live chat room",
    category: "social",
  },
  music_first_like: {
    id: "music_first_like",
    label: "Music Lover",
    emoji: "🎵",
    description: "Like your first song",
    category: "social",
  },
  level_b2: {
    id: "level_b2",
    label: "Upper Intermediate",
    emoji: "⭐",
    description: "Reach B2 level",
    category: "mastery",
  },
  level_c1: {
    id: "level_c1",
    label: "Advanced",
    emoji: "🌟",
    description: "Reach C1 level",
    category: "mastery",
  },
  level_c2: {
    id: "level_c2",
    label: "Near Native",
    emoji: "👑",
    description: "Reach C2 level",
    category: "mastery",
  },
};

export function checkAchievements(stats: {
  storiesRead: number;
  streak: number;
  vocabTotal: number;
  vocabMastered: number;
  sentencesCompleted: number;
  quizScores: number[];
  cefrLevel: string;
  journalEntries: number;
  musicLikes: number;
  chatRoomsJoined: number;
}): string[] {
  const unlocked: string[] = [];

  if (stats.storiesRead >= 1) unlocked.push("first_story");
  if (stats.storiesRead >= 5) unlocked.push("stories_5");
  if (stats.storiesRead >= 25) unlocked.push("stories_25");
  if (stats.quizScores.some((s) => s === 100)) unlocked.push("quiz_perfect");

  if (stats.streak >= 7) unlocked.push("streak_7");
  if (stats.streak >= 30) unlocked.push("streak_30");

  if (stats.vocabTotal >= 10) unlocked.push("vocab_10");
  if (stats.vocabTotal >= 50) unlocked.push("vocab_50");
  if (stats.vocabMastered >= 10) unlocked.push("vocab_mastered_10");

  if (stats.sentencesCompleted >= 10) unlocked.push("sentences_10");

  if (stats.journalEntries >= 1) unlocked.push("journal_first");
  if (stats.chatRoomsJoined >= 1) unlocked.push("chat_room_joined");
  if (stats.musicLikes >= 1) unlocked.push("music_first_like");

  const levelOrder = ["A1", "A2", "B1", "B2", "C1", "C2"];
  const levelIdx = levelOrder.indexOf(stats.cefrLevel);
  if (levelIdx >= 3) unlocked.push("level_b2");
  if (levelIdx >= 4) unlocked.push("level_c1");
  if (levelIdx >= 5) unlocked.push("level_c2");

  return unlocked;
}
