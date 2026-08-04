import { z } from "zod";

export const StoryQuizQuestionSchema = z.object({
  question: z.string().describe("A comprehension question in English about the story."),
  options: z
    .array(
      z.object({
        label: z.string().describe("The answer text."),
        value: z.enum(["A", "B", "C", "D"]),
      }),
    )
    .length(4),
  correct: z.enum(["A", "B", "C", "D"]),
});

export const GeneratedStorySchema = z.object({
  title: z
    .string()
    .describe(
      "A short, evocative title for the story in the target language (not English).",
    ),
  body: z
    .string()
    .describe(
      "The complete story text written entirely in the target language, divided into 5–7 paragraphs separated by newlines.",
    ),
  quiz: z
    .array(StoryQuizQuestionSchema)
    .length(5)
    .describe(
      "Exactly 5 reading-comprehension questions in English with 4 options each.",
    ),
});

export type GeneratedStory = z.infer<typeof GeneratedStorySchema>;
