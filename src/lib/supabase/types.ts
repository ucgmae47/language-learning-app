export type CefrLevel = "A1" | "A2" | "B1" | "B2" | "C1" | "C2";

export type Language = "es" | "fr";

export type SentenceAttempt = {
  id: string;
  user_id: string;
  language: Language;
  english: string;
  target: string;
  correct: boolean;
  created_at: string;
};

export type PictionaryRoomStatus = "lobby" | "playing" | "game_over";

export type PictionaryRoom = {
  code: string;
  host_id: string;
  language: Language;
  status: PictionaryRoomStatus;
  players: { userId: string; displayName: string; cefrLevel: string }[];
  round: number;
  total_rounds: number;
  current_drawer_id: string | null;
  word_hint: string | null;
  word_length: number | null;
  word_blanks: string | null;
  round_ends_at: string | null;
  scores: Record<string, number>;
  drawer_queue: string[];
  created_at: string;
  updated_at: string;
};

export type PictionarySecret = {
  room_code: string;
  word: string;
  updated_at: string;
};

export type InterestTopic =
  | "food"
  | "travel"
  | "sports"
  | "technology"
  | "culture"
  | "music"
  | "film"
  | "science"
  | "business"
  | "history";

export type LanguageProfile = {
  id: string;
  user_id: string;
  language: Language;
  cefr_level: CefrLevel;
  created_at: string;
  updated_at: string;
};

export type Profile = {
  id: string;
  display_name: string | null;
  cefr_level: CefrLevel;
  language: Language;
  streak_count: number;
  stories_read: number;
  created_at: string;
  updated_at: string;
};

export type UserInterest = {
  id: string;
  user_id: string;
  topic: InterestTopic;
  weight: number;
  created_at: string;
  updated_at: string;
};

export type WordOfDayLog = {
  id: string;
  user_id: string;
  date: string;
  word: string;
  seen_at: string;
};

export type StoryQuizQuestion = {
  question: string;
  options: { label: string; value: string }[];
  correct: string;
};

export type Story = {
  id: string;
  user_id: string;
  title: string;
  body: string;
  cefr_level: CefrLevel;
  topics: string[];
  word_count: number | null;
  quiz: StoryQuizQuestion[];
  /** Ordered array of English sentence translations — one per sentence,
   *  in the same order produced by splitSentences() over the body. */
  sentence_translations: string[] | null;
  /** Map of content word (lowercase, no punctuation) → concise English meaning. */
  word_translations: Record<string, string> | null;
  created_at: string;
};

export type StoryAttempt = {
  id: string;
  user_id: string;
  story_id: string;
  score: number;
  answers: Record<number, string>;
  completed_at: string;
};

export type CorrectionType = "spelling" | "conjugation" | "word_choice" | "grammar" | "accent";

export type JournalCorrection = {
  original: string;
  corrected: string;
  type: CorrectionType;
  explanation: string;
};

export type JournalFeedback = {
  corrections: JournalCorrection[];
  overall_score: number;
  summary: string;
  strength: string;
  focus_area: string;
};

export type JournalEntry = {
  id: string;
  user_id: string;
  language: Language;
  content: string;
  feedback: JournalFeedback | null;
  score: number | null;
  created_at: string;
};

export type ChatRoomStatus = "active" | "closed";

export type ChatRoom = {
  id: string;
  host_id: string;
  language: Language;
  name: string;
  topic: string;
  cefr_level: string;
  max_members: number;
  expires_at: string;
  status: ChatRoomStatus;
  host_display_name: string;
  created_at: string;
};

export type ChatRoomMessage = {
  id: string;
  room_id: string;
  user_id: string;
  display_name: string;
  cefr_level: string;
  content: string;
  created_at: string;
};

export type GenreInterest = {
  id: string;
  user_id: string;
  language: Language;
  genre: string;
  weight: number;
  last_updated: string;
  created_at: string;
};

export type GrammarWeakness = {
  id: string;
  user_id: string;
  language: Language;
  concept: string;
  error_count: number;
  attempt_count: number;
  last_seen: string;
  created_at: string;
};

export type SessionMetric = {
  id: string;
  user_id: string;
  date: string;
  stories_read: number;
  quiz_score_avg: number | null;
  drills_completed: number;
  chat_turns: number;
  minutes_active: number;
  created_at: string;
};

type Rel = [];

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: Partial<Profile> & { id: string };
        Update: Partial<Omit<Profile, "id" | "created_at">>;
        Relationships: Rel;
      };
      language_profiles: {
        Row: LanguageProfile;
        Insert: Omit<LanguageProfile, "id" | "created_at" | "updated_at"> &
          Partial<Pick<LanguageProfile, "id">>;
        Update: Partial<Omit<LanguageProfile, "id" | "user_id" | "created_at">>;
        Relationships: Rel;
      };
      user_interests: {
        Row: UserInterest;
        Insert: Omit<UserInterest, "id" | "created_at" | "updated_at"> &
          Partial<Pick<UserInterest, "id">>;
        Update: Partial<Omit<UserInterest, "id" | "user_id" | "created_at">>;
        Relationships: Rel;
      };
      journal_entries: {
        Row: JournalEntry;
        Insert: Omit<JournalEntry, "id" | "created_at"> & Partial<Pick<JournalEntry, "id">>;
        Update: Partial<Omit<JournalEntry, "id" | "user_id" | "created_at">>;
        Relationships: Rel;
      };
      chat_rooms: {
        Row: ChatRoom;
        Insert: Omit<ChatRoom, "id" | "created_at"> & Partial<Pick<ChatRoom, "id">>;
        Update: Partial<Omit<ChatRoom, "id" | "host_id" | "created_at">>;
        Relationships: Rel;
      };
      chat_room_messages: {
        Row: ChatRoomMessage;
        Insert: Omit<ChatRoomMessage, "id" | "created_at"> &
          Partial<Pick<ChatRoomMessage, "id">>;
        Update: never;
        Relationships: Rel;
      };
      genre_interests: {
        Row: GenreInterest;
        Insert: Omit<GenreInterest, "id" | "created_at" | "last_updated"> &
          Partial<Pick<GenreInterest, "id" | "last_updated">>;
        Update: Partial<Omit<GenreInterest, "id" | "user_id" | "created_at">>;
        Relationships: Rel;
      };
      grammar_weaknesses: {
        Row: GrammarWeakness;
        Insert: Omit<GrammarWeakness, "id" | "created_at"> &
          Partial<Pick<GrammarWeakness, "id">>;
        Update: Partial<Omit<GrammarWeakness, "id" | "user_id" | "created_at">>;
        Relationships: Rel;
      };
      session_metrics: {
        Row: SessionMetric;
        Insert: Omit<SessionMetric, "id" | "created_at"> &
          Partial<Pick<SessionMetric, "id">>;
        Update: Partial<
          Omit<SessionMetric, "id" | "user_id" | "date" | "created_at">
        >;
        Relationships: Rel;
      };
      word_of_day_logs: {
        Row: WordOfDayLog;
        Insert: Omit<WordOfDayLog, "id" | "seen_at"> &
          Partial<Pick<WordOfDayLog, "id">>;
        Update: never;
        Relationships: Rel;
      };
      stories: {
        Row: Story;
        Insert: Omit<Story, "id" | "created_at"> & Partial<Pick<Story, "id">>;
        Update: Partial<Omit<Story, "id" | "user_id" | "created_at">>;
        Relationships: Rel;
      };
      story_attempts: {
        Row: StoryAttempt;
        Insert: Omit<StoryAttempt, "id" | "completed_at"> &
          Partial<Pick<StoryAttempt, "id">>;
        Update: never;
        Relationships: Rel;
      };
      sentence_attempts: {
        Row: SentenceAttempt;
        Insert: Omit<SentenceAttempt, "id" | "created_at"> & Partial<Pick<SentenceAttempt, "id">>;
        Update: never;
        Relationships: Rel;
      };
      pictionary_rooms: {
        Row: PictionaryRoom;
        Insert: Pick<PictionaryRoom, "code" | "host_id" | "language"> &
          Partial<Omit<PictionaryRoom, "code" | "host_id" | "language" | "created_at" | "updated_at">>;
        Update: Partial<Omit<PictionaryRoom, "code" | "host_id" | "created_at">>;
        Relationships: Rel;
      };
      pictionary_secrets: {
        Row: PictionarySecret;
        Insert: PictionarySecret;
        Update: Partial<PictionarySecret>;
        Relationships: Rel;
      };
    };
    Views: Record<string, { Row: Record<string, unknown>; Relationships: Rel }>;
    Functions: Record<string, { Args: Record<string, unknown>; Returns: unknown }>;
    Enums: {
      cefr_level: CefrLevel;
      interest_topic: InterestTopic;
    };
    CompositeTypes: Record<string, Record<string, unknown>>;
  };
};
