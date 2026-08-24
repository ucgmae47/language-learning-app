import { NextRequest, NextResponse } from "next/server";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { generateObject } from "ai";
import { z } from "zod";
import { buildWeeklyPlan } from "@/lib/planner/templates";
import { isPremiumAiEnabled } from "@/lib/features/premium-ai";
import { requireUser, isUnauthorized } from "@/lib/auth/require-user";

const PlannerSchema = z.object({
  week_theme: z.string().describe(
    "A motivating theme for the week (e.g. 'Travel Vocabulary Week')",
  ),
  daily_plans: z.string().describe(
    "JSON array of 7 objects (Mon-Sun), each with: day (Monday etc), focus (main topic), activities (array of {feature, duration_minutes, description}), tip. Return as raw JSON string.",
  ),
  weekly_goals: z.string().describe(
    "3 specific, measurable goals for the week, one per line",
  ),
  motivation: z.string().describe(
    "2-3 sentences of personalized encouragement based on their level and interests",
  ),
});

export type PlannerResult = z.infer<typeof PlannerSchema>;

export async function POST(request: NextRequest) {
  const authed = await requireUser();
  if (isUnauthorized(authed)) return authed;

  try {
    const body = (await request.json()) as {
      language: string;
      cefrLevel: string;
      weakAreas: string[];
      interests: string[];
      availableMinutes: number;
    };

    const { language, cefrLevel, weakAreas = [], interests = [], availableMinutes = 30 } = body;

    const seeded = buildWeeklyPlan({
      language,
      cefrLevel,
      weakAreas,
      interests,
      availableMinutes,
    });

    if (!isPremiumAiEnabled() || !process.env.GEMINI_API_KEY) {
      return NextResponse.json(seeded, {
        headers: { "X-Planner-Source": "static" },
      });
    }

    const langName = language === "es" ? "Spanish" : "French";

    const prompt = `You are a personalized language learning coach. Create a 7-day study plan for a ${langName} learner.

Learner profile:
- CEFR Level: ${cefrLevel}
- Available time per day: ${availableMinutes} minutes
- Weak areas: ${weakAreas.length > 0 ? weakAreas.join(", ") : "none specified"}
- Interests: ${interests.length > 0 ? interests.join(", ") : "general"}

Available learning features to use in activities:
- Stories (reading comprehension)
- Flashcards (vocabulary review)
- Drills (grammar practice)
- Music (listening comprehension)
- Phrasebook (practical phrases)
- Pronunciation Coach (speaking practice)
- Explore (culture)
- Recipe Explorer (cultural vocabulary)
- Crossword
- Game Room

Create a balanced, engaging 7-day plan that:
1. Addresses weak areas while incorporating interests
2. Fits within the ${availableMinutes} minutes per day limit
3. Varies activities to prevent boredom
4. Progressively builds skills through the week

For daily_plans, return a JSON array of 7 objects (Monday through Sunday).
Each object must have:
- day: "Monday", "Tuesday", etc.
- focus: the main learning topic for that day
- activities: array of {feature, duration_minutes, description}
- tip: a daily learning tip

Total activity duration per day should not exceed ${availableMinutes} minutes.`;

    const google = createGoogleGenerativeAI({ apiKey: process.env.GEMINI_API_KEY! });

    const { object } = await generateObject({
      model: google("gemini-2.5-flash-lite"),
      schema: PlannerSchema,
      prompt,
    });

    return NextResponse.json(object, {
      headers: { "X-Planner-Source": "gemini" },
    });
  } catch (err) {
    console.error("[planner]", err);
    return NextResponse.json({ error: "Failed to generate plan" }, { status: 500 });
  }
}
