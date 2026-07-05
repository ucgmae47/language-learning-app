import { NextRequest, NextResponse } from "next/server";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { generateObject } from "ai";
import { z } from "zod";

const MusicRecommendationSchema = z.object({
  title: z.string().describe("Song title"),
  artist: z.string().describe("Artist or band name"),
  genre: z.string().describe("Music genre (e.g. Pop, Reggaeton, Chanson)"),
  year: z.number().describe("Year the song was released"),
  country: z.string().describe("Country of origin of the artist"),
  description: z.string().describe("2-3 sentence description of the song and its cultural significance"),
  why_good_for_learning: z.string().describe("Why this song is great for learning the target language at this CEFR level"),
  fun_facts: z.array(z.string()).describe("Exactly 3 interesting facts about the song or artist"),
  featured_lyrics: z.string().describe("A memorable verse or chorus, 4-8 lines in the original language. Use actual line breaks."),
  vocabulary_notes: z.string().describe("3-4 notable vocabulary words or phrases from the lyrics, formatted as: word — meaning. One per line."),
});

export type MusicRecommendation = z.infer<typeof MusicRecommendationSchema>;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as {
      language: string;
      cefrLevel: string;
      likedSongs: { title: string; artist: string }[];
      seenSongs: { title: string; artist: string }[];
    };

    const { language, cefrLevel, likedSongs = [], seenSongs = [] } = body;

    const langName = language === "es" ? "Spanish" : "French";
    const langNote =
      language === "es"
        ? "The song MUST be primarily in Spanish (Latin American or Spanish artists)."
        : "The song MUST be primarily in French (French, Belgian, Québécois, or African Francophone artists).";

    const likedContext =
      likedSongs.length > 0
        ? `The user has liked: ${likedSongs.map((s) => `"${s.title}" by ${s.artist}`).join(", ")}. Recommend something with a similar vibe or genre.`
        : "This is the user's first recommendation.";

    const avoidContext =
      seenSongs.length > 0
        ? `Do NOT recommend any of these (already seen): ${seenSongs.map((s) => `"${s.title}" by ${s.artist}`).join(", ")}.`
        : "";

    const prompt = `You are a music curator for ${langName} language learners.

CEFR level: ${cefrLevel}
${langNote}

${likedContext}
${avoidContext}

Recommend exactly ONE real song. For lower levels (A1-B1) prefer songs with clear, repetitive, or slower lyrics. For higher levels (B2-C2) you can suggest more complex lyrics or poetry-like songs.

Return a complete JSON object with all required fields. The "featured_lyrics" must be real lyrics from the actual song.`;

    const google = createGoogleGenerativeAI({ apiKey: process.env.GEMINI_API_KEY! });

    const { object } = await generateObject({
      model: google("gemini-2.5-flash-lite"),
      schema: MusicRecommendationSchema,
      prompt,
    });

    return NextResponse.json(object);
  } catch (err) {
    console.error("[music/recommend]", err);
    return NextResponse.json(
      { error: "Failed to generate recommendation" },
      { status: 500 },
    );
  }
}
