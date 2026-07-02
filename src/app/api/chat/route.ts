import { createOpenAI } from "@ai-sdk/openai";
import { streamText, createTextStreamResponse } from "ai";
import type { ModelMessage } from "ai";
import { createClient } from "@/lib/supabase/server";
import { buildChatSystemPrompt } from "@/lib/chat/system-prompt";
import type { CefrLevel, InterestTopic, Language } from "@/lib/supabase/types";

function getModel() {
  const github = createOpenAI({
    baseURL: "https://models.inference.ai.azure.com",
    apiKey: process.env.GITHUB_TOKEN ?? "",
  });
  return github.chat("gpt-4o-mini");
}

export async function POST(request: Request) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const { messages } = (await request.json()) as {
    messages: ModelMessage[];
  };

  const [profileResult, interestsResult] = await Promise.all([
    supabase
      .from("profiles")
      .select("display_name, cefr_level, language")
      .eq("id", user.id)
      .single(),
    supabase
      .from("user_interests")
      .select("topic")
      .eq("user_id", user.id)
      .order("weight", { ascending: false })
      .limit(5),
  ]);

  const cefrLevel: CefrLevel = profileResult.data?.cefr_level ?? "B1";
  const language: Language = profileResult.data?.language ?? "es";
  const displayName: string =
    profileResult.data?.display_name ??
    user.user_metadata?.display_name ??
    "Learner";
  const interests: string[] =
    interestsResult.data?.map(
      (r: { topic: InterestTopic }) => r.topic,
    ) ?? [];

  const systemPrompt = buildChatSystemPrompt(displayName, cefrLevel, interests, language);

  try {
    const result = streamText({
      model: getModel(),
      system: systemPrompt,
      messages,
      maxOutputTokens: 512,
      temperature: 0.8,
    });

    return createTextStreamResponse({ stream: result.textStream });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[chat] streamText failed:", message);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
