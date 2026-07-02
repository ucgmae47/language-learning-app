import { NextResponse } from "next/server";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { generateText } from "ai";
import { createClient } from "@/lib/supabase/server";

type TranslateRequest = {
  text: string;
  type: "sentence" | "word";
  language: "es" | "fr";
};

type TranslateResponse = {
  translation: string;
};

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: TranslateRequest;
  try {
    body = (await request.json()) as TranslateRequest;
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { text, type, language } = body;

  if (!text?.trim()) {
    return NextResponse.json<TranslateResponse>({ translation: "" });
  }

  const langName = language === "es" ? "Spanish" : "French";

  const prompt =
    type === "sentence"
      ? `Translate this ${langName} sentence into natural English. Return only the English translation, nothing else.\n\nSentence: ${text}`
      : `What does the ${langName} word or phrase "${text}" mean in English? Give the most common meaning in 1–4 words (just the meaning, no punctuation, no extra text).`;

  try {
    const google = createGoogleGenerativeAI({
      apiKey: process.env.GEMINI_API_KEY ?? "",
    });

    const { text: translation } = await generateText({
      model: google("gemini-2.5-flash-lite"),
      prompt,
      maxOutputTokens: type === "sentence" ? 200 : 30,
    });

    return NextResponse.json<TranslateResponse>({
      translation: translation.trim(),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[stories/translate] Gemini call failed:", message);
    return NextResponse.json({ error: "Translation failed" }, { status: 500 });
  }
}
