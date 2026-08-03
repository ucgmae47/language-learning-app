import type { Language } from "@/lib/supabase/types";

export type DictionarySense = {
  partOfSpeech: string;
  definition: string;
  exampleNative: string;
  exampleEnglish: string;
};

export type DictionaryLookup = {
  query: string;
  lemma: string;
  language: Language;
  isVerb: boolean;
  pronunciation: string | null;
  senses: DictionarySense[];
  related: string[];
  primaryTranslation: string;
};

export type ConjugationPerson = {
  pronoun: string;
  form: string;
};

export type ConjugationTense = {
  id: string;
  label: string;
  persons: ConjugationPerson[];
};

export type ConjugationMood = {
  id: string;
  label: string;
  tenses: ConjugationTense[];
};

export type ConjugationResult = {
  infinitive: string;
  language: Language;
  predicted: boolean;
  moods: ConjugationMood[];
};
