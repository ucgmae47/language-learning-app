import { NextResponse } from "next/server";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { generateObject } from "ai";
import { createClient } from "@/lib/supabase/server";
import { buildStoryPrompt } from "@/lib/stories/prompt";
import { GeneratedStorySchema } from "@/lib/stories/schema";
import type { GeneratedStory } from "@/lib/stories/schema";
import type { CefrLevel, InterestTopic } from "@/lib/supabase/types";

export async function POST(request: Request) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Read the optional topic chosen by the user in the UI.
  let selectedTopic: string | null = null;
  try {
    const body = (await request.json()) as { topic?: string | null };
    selectedTopic = body.topic ?? null;
  } catch {
    // Body may be empty — that's fine.
  }

  const [profileResult, interestsResult] = await Promise.all([
    supabase
      .from("profiles")
      .select("cefr_level")
      .eq("id", user.id)
      .single(),
    supabase
      .from("user_interests")
      .select("topic")
      .eq("user_id", user.id)
      .order("weight", { ascending: false })
      .limit(3),
  ]);

  const cefrLevel: CefrLevel = profileResult.data?.cefr_level ?? "B1";
  const topics: string[] =
    interestsResult.data?.map((r: { topic: InterestTopic }) => r.topic) ?? [];

  const prompt = buildStoryPrompt(cefrLevel, topics, selectedTopic ?? undefined);

  let object: GeneratedStory;

  try {
    const google = createGoogleGenerativeAI({
      apiKey: process.env.GEMINI_API_KEY ?? "",
    });

    const result = await generateObject({
      model: google("gemini-2.5-flash-lite"),
      schema: GeneratedStorySchema,
      prompt,
    });

    object = result.object;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[stories/generate] AI call failed:", message);
    return NextResponse.json(
      { error: `Story generation failed: ${message}` },
      { status: 500 },
    );
  }

  const wordCount = object.body.trim().split(/\s+/).length;

  const { data: story, error: insertError } = await supabase
    .from("stories")
    .insert({
      user_id: user.id,
      title: object.title,
      body: object.body,
      cefr_level: cefrLevel,
      topics,
      word_count: wordCount,
      quiz: object.quiz,
    })
    .select("id")
    .single();

  if (insertError || !story) {
    console.error("[stories/generate] DB insert failed:", insertError?.message);
    return NextResponse.json(
      { error: "Failed to save story." },
      { status: 500 },
    );
  }

  return NextResponse.json({ storyId: story.id });
}
