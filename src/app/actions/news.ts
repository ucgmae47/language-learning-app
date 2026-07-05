"use server";

import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { generateObject } from "ai";
import { z } from "zod";
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
  summary: string;       // CEFR-appropriate summary in the target language
  category: string;      // e.g. "Technology", "World", "Science"
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
    // Cache for 30 minutes — limits repeated NewsAPI hits
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

// ── Gemini batch summarisation ────────────────────────────────────────────────

const LANG_NAMES: Record<Language, string> = { es: "Spanish", fr: "French" };

const SummaryArraySchema = z.object({
  summaries: z
    .array(
      z.object({
        index: z.number().describe("Zero-based index matching the input article list."),
        summary: z.string().describe("3-sentence summary in the target language."),
        category: z.string().describe("One of: World, Technology, Science, Business, Sports, Entertainment, Health, Politics"),
      }),
    )
    .describe("One entry per article, in the same order as the input."),
});

async function batchSummarise(
  articles: RawArticle[],
  language: Language,
  cefrLevel: string,
): Promise<Array<{ summary: string; category: string }>> {
  const langName = LANG_NAMES[language];

  const articleList = articles
    .map(
      (a, i) =>
        `[${i}] ${a.title}\n${a.description ?? ""}`,
    )
    .join("\n\n");

  const prompt = `You are a ${langName} language learning assistant.

Below are ${articles.length} English news articles. For EACH article:
1. Write a 3-sentence summary in ${langName} appropriate for a ${cefrLevel} CEFR learner.
   Use vocabulary and sentence structures suitable for that level.
2. Assign one category from: World, Technology, Science, Business, Sports, Entertainment, Health, Politics.

Articles:
${articleList}

Return one entry per article with the zero-based index.`;

  const google = createGoogleGenerativeAI({ apiKey: process.env.GEMINI_API_KEY! });

  const { object } = await generateObject({
    model: google("gemini-2.5-flash-lite"),
    schema: SummaryArraySchema,
    prompt,
  });

  // Map back by index, fill any gaps with a fallback
  const result: Array<{ summary: string; category: string }> = articles.map(() => ({
    summary: "",
    category: "World",
  }));
  for (const s of object.summaries) {
    if (s.index >= 0 && s.index < result.length) {
      result[s.index] = { summary: s.summary, category: s.category };
    }
  }
  return result;
}

// ── Public action ─────────────────────────────────────────────────────────────

export async function fetchSummarizedNews(
  language: Language,
  cefrLevel: string,
): Promise<{ articles: SummarizedArticle[]; error?: string }> {
  try {
    const raw = await fetchHeadlines();
    if (raw.length === 0) return { articles: [] };

    const summaries = await batchSummarise(raw, language, cefrLevel);

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
    return {
      articles: [],
      error: err instanceof Error ? err.message : "Failed to load news.",
    };
  }
}
