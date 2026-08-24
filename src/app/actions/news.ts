"use server";

import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createGroq } from "@ai-sdk/groq";
import { generateObject, generateText } from "ai";
import { z } from "zod";
import { getSeedNews } from "@/lib/news/seed-articles";
import { isPremiumAiEnabled } from "@/lib/features/premium-ai";
import type { Language } from "@/lib/supabase/types";

// ── Types ─────────────────────────────────────────────────────────────────────

export type RawArticle = {
  title: string;
  description: string | null;
  url: string;
  urlToImage: string | null;
  publishedAt: string;
  source: { name: string };
};

export type SummarizedArticle = {
  title: string;
  sourceName: string;
  publishedAt: string;
  url: string;
  imageUrl: string | null;
  summary: string;
  category: string;
};

// ── NewsAPI fetch ─────────────────────────────────────────────────────────────

const NEWS_API_ENDPOINT = "https://newsapi.org/v2/top-headlines";

async function fetchHeadlines(): Promise<RawArticle[]> {
  const apiKey = process.env.NEWS_API_KEY;
  if (!apiKey) throw new Error("NEWS_API_KEY is not configured.");

  const url = new URL(NEWS_API_ENDPOINT);
  url.searchParams.set("language", "en");
  url.searchParams.set("pageSize", "12");
  url.searchParams.set("apiKey", apiKey);

  const res = await fetch(url.toString(), {
    next: { revalidate: 1800 },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`NewsAPI error ${res.status}: ${text}`);
  }

  const json = (await res.json()) as { articles?: RawArticle[] };
  return (json.articles ?? []).filter(
    (a) => a.title && a.title !== "[Removed]" && a.description,
  );
}

// ── AI batch summarisation ────────────────────────────────────────────────────

const LANG_NAMES: Record<Language, string> = { es: "Spanish", fr: "French" };

const SummaryArraySchema = z.object({
  summaries: z
    .array(
      z.object({
        index: z.number().describe("Zero-based index matching the input article list."),
        summary: z.string().describe("3-sentence summary in the target language."),
        category: z
          .string()
          .describe(
            "One of: World, Technology, Science, Business, Sports, Entertainment, Health, Politics",
          ),
      }),
    )
    .describe("One entry per article, in the same order as the input."),
});

function buildPrompt(
  articles: RawArticle[],
  language: Language,
  cefrLevel: string,
): string {
  const langName = LANG_NAMES[language];
  const articleList = articles
    .map((a, i) => `[${i}] ${a.title}\n${a.description ?? ""}`)
    .join("\n\n");

  return `You are a ${langName} language learning assistant.

Below are ${articles.length} English news articles. For EACH article:
1. Write a 3-sentence summary in ${langName} appropriate for a ${cefrLevel} CEFR learner.
   Use vocabulary and sentence structures suitable for that level.
2. Assign one category from: World, Technology, Science, Business, Sports, Entertainment, Health, Politics.

Articles:
${articleList}

Return one entry per article with the zero-based index.`;
}

function mapSummaries(
  articles: RawArticle[],
  summaries: z.infer<typeof SummaryArraySchema>["summaries"],
): Array<{ summary: string; category: string }> {
  const result: Array<{ summary: string; category: string }> = articles.map(
    () => ({
      summary: "",
      category: "World",
    }),
  );
  for (const s of summaries) {
    if (s.index >= 0 && s.index < result.length) {
      result[s.index] = { summary: s.summary, category: s.category };
    }
  }
  return result;
}

function parseJsonObject(text: string): unknown {
  const trimmed = text.trim();
  try {
    return JSON.parse(trimmed);
  } catch {
    const start = trimmed.indexOf("{");
    const end = trimmed.lastIndexOf("}");
    if (start >= 0 && end > start) {
      return JSON.parse(trimmed.slice(start, end + 1));
    }
    throw new Error("No JSON object in model response");
  }
}

async function summariseWithGemini(prompt: string) {
  const google = createGoogleGenerativeAI({
    apiKey: process.env.GEMINI_API_KEY ?? "",
  });
  const { object } = await generateObject({
    model: google("gemini-2.5-flash-lite"),
    schema: SummaryArraySchema,
    prompt,
  });
  return object;
}

async function summariseWithGroq(prompt: string) {
  const groq = createGroq({ apiKey: process.env.GROQ_API_KEY ?? "" });
  const { text } = await generateText({
    model: groq("llama-3.1-8b-instant"),
    prompt: `${prompt}

Respond with ONLY valid JSON (no markdown, no backticks) in this exact shape:
{
  "summaries": [
    { "index": number, "summary": string, "category": string }
  ]
}`,
    maxOutputTokens: 2500,
  });
  return SummaryArraySchema.parse(parseJsonObject(text));
}

async function batchSummarise(
  articles: RawArticle[],
  language: Language,
  cefrLevel: string,
): Promise<Array<{ summary: string; category: string }>> {
  const prompt = buildPrompt(articles, language, cefrLevel);

  const attempts = [
    {
      name: "gemini",
      enabled: Boolean(process.env.GEMINI_API_KEY),
      run: () => summariseWithGemini(prompt),
    },
    {
      name: "groq",
      enabled: Boolean(process.env.GROQ_API_KEY),
      run: () => summariseWithGroq(prompt),
    },
  ];

  for (const attempt of attempts) {
    if (!attempt.enabled) continue;
    try {
      const object = await attempt.run();
      return mapSummaries(articles, object.summaries);
    } catch (err) {
      console.warn(`[news] ${attempt.name} summarise failed:`, err);
    }
  }

  throw new Error("AI_UNAVAILABLE");
}

function toFriendlyError(err: unknown): string {
  const msg = err instanceof Error ? err.message : String(err);

  if (msg.includes("NEWS_API_KEY")) {
    return "NEWS_API_KEY is not configured.";
  }
  if (msg.includes("NewsAPI error")) {
    return "We couldn't reach the news provider right now. Please try again shortly.";
  }
  if (
    msg.includes("AI_UNAVAILABLE") ||
    /quota|rate.?limit|resource.?exhausted|429/i.test(msg)
  ) {
    return "News summaries are briefly unavailable. Please try again in a moment.";
  }
  return "We couldn't load today's news right now. Please try again shortly.";
}

// ── Public action ─────────────────────────────────────────────────────────────

export async function fetchSummarizedNews(
  language: Language,
  cefrLevel: string,
): Promise<{ articles: SummarizedArticle[]; error?: string }> {
  // Free path: preloaded graded articles (no NewsAPI / AI cost).
  if (!isPremiumAiEnabled()) {
    return { articles: getSeedNews(language) };
  }

  try {
    const raw = await fetchHeadlines();
    if (raw.length === 0) return { articles: getSeedNews(language) };

    // Summarise in smaller batches so Groq fallback stays reliable
    const batchSize = 6;
    const summaries: Array<{ summary: string; category: string }> = [];
    for (let i = 0; i < raw.length; i += batchSize) {
      const chunk = raw.slice(i, i + batchSize);
      const chunkSummaries = await batchSummarise(chunk, language, cefrLevel);
      summaries.push(...chunkSummaries);
    }

    const articles: SummarizedArticle[] = raw.map((a, i) => ({
      title: a.title,
      sourceName: a.source.name,
      publishedAt: a.publishedAt,
      url: a.url,
      imageUrl: a.urlToImage,
      summary: summaries[i]?.summary ?? "",
      category: summaries[i]?.category ?? "World",
    }));

    return { articles };
  } catch (err) {
    console.error("[news]", err);
    const seeded = getSeedNews(language);
    if (seeded.length > 0) return { articles: seeded };
    return {
      articles: [],
      error: toFriendlyError(err),
    };
  }
}
