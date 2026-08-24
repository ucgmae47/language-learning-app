import { NextRequest, NextResponse } from "next/server";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { generateObject } from "ai";
import { z } from "zod";
import { getCalendarEvents, type CalendarEvent } from "@/lib/calendar/events-bank";
import { isPremiumAiEnabled } from "@/lib/features/premium-ai";
import { requireUser, isUnauthorized } from "@/lib/auth/require-user";

const CalendarSchema = z.object({
  events: z.string().describe(
    "JSON array of events, each with: date (YYYY-MM-DD), name (in target language), country, emoji, description (2 sentences), type (holiday|festival|cultural). Return as raw JSON string.",
  ),
  month_note: z.string().describe(
    "Interesting cultural note about this month in the Spanish/French-speaking world",
  ),
});

export type { CalendarEvent };

export async function GET(request: NextRequest) {
  const authed = await requireUser();
  if (isUnauthorized(authed)) return authed;

  try {
    const { searchParams } = new URL(request.url);
    const language = (searchParams.get("language") ?? "es") as "es" | "fr";
    const year = parseInt(searchParams.get("year") ?? String(new Date().getFullYear()), 10);
    const month = parseInt(searchParams.get("month") ?? String(new Date().getMonth() + 1), 10);

    const seeded = getCalendarEvents(language === "fr" ? "fr" : "es", year, month);

    if (!isPremiumAiEnabled() || !process.env.GEMINI_API_KEY) {
      return NextResponse.json(seeded, {
        headers: {
          "Cache-Control": "s-maxage=86400, stale-while-revalidate",
          "X-Calendar-Source": "static",
        },
      });
    }

    const langName = language === "es" ? "Spanish" : "French";
    const monthName = new Date(year, month - 1, 1).toLocaleString("en-US", { month: "long" });

    const prompt = `You are a cultural expert on the ${langName}-speaking world. List 8-12 real cultural events, holidays, and festivals that happen in ${monthName} ${year} across ${langName}-speaking countries.

Include events from various countries: ${language === "es" ? "Spain, Mexico, Colombia, Argentina, Peru, Cuba, etc." : "France, Belgium, Quebec, Morocco, Senegal, Haiti, etc."}

For each event provide:
- date: exact date in YYYY-MM-DD format (use ${year}-${String(month).padStart(2, "0")}-DD)
- name: event name in ${langName}
- country: country where it's celebrated
- emoji: relevant emoji for the event
- description: 2 sentences describing the event and its cultural significance
- type: one of "holiday", "festival", or "cultural"

Return as a JSON array string. Include the month_note as a separate interesting cultural observation.`;

    const google = createGoogleGenerativeAI({ apiKey: process.env.GEMINI_API_KEY! });

    const { object } = await generateObject({
      model: google("gemini-2.5-flash-lite"),
      schema: CalendarSchema,
      prompt,
    });

    let events: CalendarEvent[] = [];
    try {
      events = JSON.parse(object.events) as CalendarEvent[];
    } catch {
      events = seeded.events;
    }

    return NextResponse.json(
      { events, month_note: object.month_note },
      {
        headers: {
          "Cache-Control": "s-maxage=86400, stale-while-revalidate",
          "X-Calendar-Source": "gemini",
        },
      },
    );
  } catch (err) {
    console.error("[calendar/events]", err);
    return NextResponse.json({ error: "Failed to load calendar events" }, { status: 500 });
  }
}
