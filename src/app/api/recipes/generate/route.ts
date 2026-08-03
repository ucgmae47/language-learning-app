import { NextRequest, NextResponse } from "next/server";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { generateObject } from "ai";
import { z } from "zod";
import { requireUser, isUnauthorized } from "@/lib/auth/require-user";

const RecipeSchema = z.object({
  name: z.string().describe("Recipe name in the target language"),
  name_english: z.string().describe("Recipe name in English"),
  country: z.string(),
  difficulty: z.string().describe("Easy, Medium, or Challenging"),
  prep_time: z.string().describe("e.g. 30 minutos"),
  servings: z.string().describe("e.g. 4 personas"),
  description: z.string().describe("2-3 sentences describing the dish"),
  cultural_note: z.string().describe("Brief note about the dish's cultural significance"),
  ingredients: z.string().describe(
    "Numbered list of ingredients in target language, one per line",
  ),
  instructions: z.string().describe(
    "Numbered step-by-step instructions in target language at the user's CEFR level, one per line",
  ),
  vocabulary_notes: z.string().describe(
    "5 key cooking vocabulary words from the recipe: word — translation, one per line",
  ),
});

export type Recipe = z.infer<typeof RecipeSchema>;

export async function POST(request: NextRequest) {
  const authed = await requireUser();
  if (isUnauthorized(authed)) return authed;

  try {
    const body = (await request.json()) as {
      language: string;
      cefrLevel: string;
      cuisine: string;
    };

    const { language, cefrLevel, cuisine } = body;

    const langName = language === "es" ? "Spanish" : "French";

    const prompt = `You are a culinary language teacher. Generate a real, authentic recipe from ${cuisine} cuisine written in ${langName}.

The learner's CEFR level is ${cefrLevel} — adjust the complexity of the language accordingly.
For lower levels (A1-B1): use simple sentences, common vocabulary.
For higher levels (B2-C2): use more natural, complex language.

The recipe must be:
- A real, authentic dish from ${cuisine} culture
- Written entirely in ${langName} (ingredients and instructions)
- Educational for language learners

Include clear numbered ingredients and step-by-step instructions.`;

    const google = createGoogleGenerativeAI({ apiKey: process.env.GEMINI_API_KEY! });

    const { object } = await generateObject({
      model: google("gemini-2.5-flash-lite"),
      schema: RecipeSchema,
      prompt,
    });

    return NextResponse.json(object);
  } catch (err) {
    console.error("[recipes/generate]", err);
    return NextResponse.json({ error: "Failed to generate recipe" }, { status: 500 });
  }
}
