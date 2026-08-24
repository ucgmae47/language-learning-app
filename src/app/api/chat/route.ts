import { after } from "next/server";
import { createOpenAI } from "@ai-sdk/openai";
import { streamText, createTextStreamResponse } from "ai";
import type { ModelMessage } from "ai";
import { createClient } from "@/lib/supabase/server";
import { buildChatSystemPrompt } from "@/lib/chat/system-prompt";
import { getUserContext } from "@/lib/user-context";
import { analyzeAndStorePersonality } from "@/lib/chat/personality-analyzer";
import { isStoriesOnlyPreview } from "@/lib/features/preview-gate";
import type { CefrLevel, Language, PersonalityTraits } from "@/lib/supabase/types";

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

  // Tier 3: AI Chat stays Premium during soft launch.
  if (isStoriesOnlyPreview()) {
    return new Response(
      JSON.stringify({
        error: "AI Chat is a Premium feature and isn’t available in free preview yet.",
      }),
      { status: 403, headers: { "Content-Type": "application/json" } },
    );
  }

  const { messages } = (await request.json()) as {
    messages: ModelMessage[];
  };

  // Fetch profile including stored personality traits.
  const profileResult = await supabase
    .from("profiles")
    .select("display_name, cefr_level, language, personality_traits")
    .eq("id", user.id)
    .single();

  const cefrLevel: CefrLevel = profileResult.data?.cefr_level ?? "B1";
  const language: Language = profileResult.data?.language ?? "es";
  const displayName: string =
    profileResult.data?.display_name ??
    user.user_metadata?.display_name ??
    "Learner";
  const personalityTraits =
    (profileResult.data?.personality_traits as PersonalityTraits | null) ?? null;

  // Assemble the full cross-app learner context.
  const userCtx = await getUserContext(
    supabase,
    user.id,
    language,
    cefrLevel,
    displayName,
  );

  const systemPrompt = buildChatSystemPrompt(
    displayName,
    cefrLevel,
    userCtx.explicitInterests,
    language,
    userCtx.contextString,
    personalityTraits,
  );

  // ── Background personality analysis ─────────────────────────────────────────
  // Extract the user's messages from the conversation history.
  const userMessages = messages
    .filter((m) => m.role === "user")
    .map((m) => (typeof m.content === "string" ? m.content : ""))
    .filter(Boolean);

  // Re-analyze on every 5th user message (1st, 6th, 11th, …) so the model
  // gets smarter over time without running on every single turn.
  if (userMessages.length > 0 && userMessages.length % 5 === 0) {
    const capturedUserId = user.id;
    const capturedMessages = [...userMessages];
    after(async () => {
      await analyzeAndStorePersonality(capturedUserId, capturedMessages);
    });
  }

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
