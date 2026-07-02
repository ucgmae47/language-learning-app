export type Idiom = {
  id: string;
  expression: string;         // In target language
  translation: string;        // English meaning
  literal?: string;           // Literal word-for-word translation (often funny)
  exampleTarget: string;      // Usage sentence in the target language
  exampleEnglish: string;     // English translation of the example
};
