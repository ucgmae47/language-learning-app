import { NextResponse } from "next/server";
import { createGroq } from "@ai-sdk/groq";
import { generateText } from "ai";
import { createClient } from "@/lib/supabase/server";
import { isExactMatch, normalizeAnswer } from "@/lib/drills/types";
import { QUESTIONS_ES } from "@/lib/drills/questions-es";
import { QUESTIONS_FR } from "@/lib/drills/questions-fr";
import type { DrillQuestion } from "@/lib/drills/types";

type CheckRequest = {
  questionId: string;
  userAnswer: string;
  language: "es" | "fr";
};

type CheckResponse = {
  correct: boolean;
  feedback: string;
  correctAnswer: string;
};

const ALL_QUESTIONS: DrillQuestion[] = [...QUESTIONS_ES, ...QUESTIONS_FR];

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: CheckRequest;
  try {
    body = (await request.json()) as CheckRequest;
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { questionId, userAnswer, language } = body;

  const question = ALL_QUESTIONS.find((q) => q.id === questionId);
  if (!question) {
    return NextResponse.json({ error: "Question not found" }, { status: 404 });
  }

  // Fast path: exact local match — no AI call needed.
  if (isExactMatch(userAnswer, question)) {
    return NextResponse.json<CheckResponse>({
      correct: true,
      feedback: "Correct! Well done.",
      correctAnswer: question.answer,
    });
  }

  // Slow path: call Groq to check for alternate valid forms and generate feedback.
  const langName = language === "es" ? "Spanish" : "French";
  const userNorm = normalizeAnswer(userAnswer);

  const groqKey = process.env.GROQ_API_KEY;
  if (!groqKey) {
    // Groq not configured — fall back to local-only checking.
    return NextResponse.json<CheckResponse>({
      correct: false,
      feedback: question.explanation,
      correctAnswer: question.answer,
    });
  }

  let groqResult: CheckResponse;

  try {
    const groq = createGroq({ apiKey: groqKey });

    const { text } = await generateText({
      model: groq("llama-3.1-8b-instant"),
      system: `You are a strict ${langName} grammar expert and language tutor.
Your job is to evaluate a student's conjugation or fill-in-the-blank answer.
Rules:
- Accept the answer as correct ONLY if it is grammatically valid ${langName}.
- Accept minor typographical variants if and only if the accent mark has no grammatical effect.
- Reject incorrect accent marks if they would form a different word or be grammatically wrong.
- If incorrect, say what the correct form is in a single short sentence.
- Be encouraging but precise.
Respond ONLY with valid JSON — no markdown, no backticks, no extra text.`,
      prompt: `Question: "${question.prompt}"${question.sentence ? `\nSentence: "${question.sentence}"` : ""}
Expected answer: "${question.answer}"${question.alternates ? `\nAlso accepted: ${question.alternates.join(", ")}` : ""}
Student answered: "${userNorm}"

Respond with this exact JSON shape:
{"correct": <true|false>, "feedback": "<one or two encouraging sentences in English>"}`,
      maxOutputTokens: 120,
    });

    const parsed = JSON.parse(text.trim()) as { correct: boolean; feedback: string };
    groqResult = {
      correct: parsed.correct,
      feedback: parsed.correct ? parsed.feedback : `${parsed.feedback} ${question.explanation}`,
      correctAnswer: question.answer,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[drills/check] Groq call failed:", message);
    // Graceful degradation: return local explanation.
    groqResult = {
      correct: false,
      feedback: question.explanation,
      correctAnswer: question.answer,
    };
  }

  return NextResponse.json<CheckResponse>(groqResult);
}
