import { z } from "zod";

const GridCellSchema = z.union([z.string().length(1), z.null()]);

export const GeneratedCrosswordEntrySchema = z.object({
  number: z.number().int().positive(),
  direction: z.enum(["across", "down"]),
  row: z.number().int().nonnegative(),
  col: z.number().int().nonnegative(),
  answer: z.string().min(2),
  clue: z.string().min(3),
});

export const GeneratedCrosswordSchema = z.object({
  title: z.string(),
  /** null = black square, single uppercase letter = white cell */
  grid: z.array(z.array(GridCellSchema)),
  entries: z.array(GeneratedCrosswordEntrySchema).min(3).max(12),
});

export type GeneratedCrossword = z.infer<typeof GeneratedCrosswordSchema>;
