"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { Loader2, Languages } from "lucide-react";

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Split a paragraph into sentences, preserving trailing punctuation. */
function splitSentences(paragraph: string): string[] {
  // Split after . ! ? when followed by a space and an uppercase / accented letter,
  // or at the very end. Imperfect but works well for AI-generated prose.
  const raw = paragraph.split(/(?<=[.!?])\s+(?=\S)/u);
  return raw.map((s) => s.trim()).filter(Boolean);
}

/** Strip leading/trailing punctuation from a word for lookup purposes. */
function cleanWord(word: string): string {
  return word.replace(/^[¡¿«"'([\s]+|[!?.,:;»"')[\]\s]+$/gu, "").toLowerCase();
}

/** Split a sentence into display tokens (preserving spaces and punctuation). */
function tokenise(sentence: string): string[] {
  // Split on whitespace, keep each token.
  return sentence.split(/(\s+)/).filter(Boolean);
}

// ─── Types ───────────────────────────────────────────────────────────────────

type CacheKey = string;

type TooltipState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "ready"; translation: string };

// ─── Word chip (inside the sentence tooltip) ─────────────────────────────────

function WordChip({
  token,
  language,
  cache,
}: {
  token: string;
  language: "es" | "fr";
  cache: React.MutableRefObject<Map<CacheKey, string>>;
}) {
  const isSpace = /^\s+$/.test(token);
  const [tip, setTip] = useState<TooltipState>({ status: "idle" });
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  if (isSpace) return <span>{token}</span>;

  const clean = cleanWord(token);
  if (!clean) return <span>{token}</span>;

  async function fetchWord() {
    const key = `word:${language}:${clean}`;
    if (cache.current.has(key)) {
      setTip({ status: "ready", translation: cache.current.get(key)! });
      return;
    }
    setTip({ status: "loading" });
    try {
      const res = await fetch("/api/stories/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: clean, type: "word", language }),
      });
      const data = (await res.json()) as { translation?: string };
      const t = data.translation ?? "";
      cache.current.set(key, t);
      setTip({ status: "ready", translation: t });
    } catch {
      setTip({ status: "idle" });
    }
  }

  function handleEnter() {
    timeoutRef.current = setTimeout(fetchWord, 300);
  }

  function handleLeave() {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setTip({ status: "idle" });
  }

  return (
    <span className="relative inline-block">
      <span
        onMouseEnter={handleEnter}
        onMouseLeave={handleLeave}
        className="cursor-help rounded px-0.5 transition-colors hover:bg-yellow-200"
      >
        {token}
      </span>
      {tip.status !== "idle" && (
        <span className="pointer-events-none absolute bottom-full left-1/2 z-30 mb-1 -translate-x-1/2 rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-medium text-slate-700 shadow-lg whitespace-nowrap">
          {tip.status === "loading" ? (
            <Loader2 className="h-3 w-3 animate-spin text-slate-400" />
          ) : (
            tip.translation || "—"
          )}
        </span>
      )}
    </span>
  );
}

// ─── Sentence span ────────────────────────────────────────────────────────────

function SentenceSpan({
  sentence,
  language,
  cache,
}: {
  sentence: string;
  language: "es" | "fr";
  cache: React.MutableRefObject<Map<CacheKey, string>>;
}) {
  const [hover, setHover] = useState(false);
  const [tip, setTip] = useState<TooltipState>({ status: "idle" });
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fetchedRef = useRef(false);

  const fetchTranslation = useCallback(async () => {
    if (fetchedRef.current && tip.status === "ready") return;
    const key = `sentence:${language}:${sentence}`;
    if (cache.current.has(key)) {
      setTip({ status: "ready", translation: cache.current.get(key)! });
      fetchedRef.current = true;
      return;
    }
    setTip({ status: "loading" });
    try {
      const res = await fetch("/api/stories/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: sentence, type: "sentence", language }),
      });
      const data = (await res.json()) as { translation?: string };
      const t = data.translation ?? "";
      cache.current.set(key, t);
      setTip({ status: "ready", translation: t });
      fetchedRef.current = true;
    } catch {
      setTip({ status: "idle" });
    }
  }, [sentence, language, cache, tip.status]);

  function handleEnter() {
    setHover(true);
    timeoutRef.current = setTimeout(fetchTranslation, 350);
  }

  function handleLeave() {
    setHover(false);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    // Keep tip visible briefly so users can read it.
    setTimeout(() => setHover(false), 0);
  }

  const tokens = tokenise(sentence);

  return (
    <span className="relative">
      {/* Sentence text */}
      <span
        onMouseEnter={handleEnter}
        onMouseLeave={handleLeave}
        className={`cursor-default rounded transition-colors duration-150 ${
          hover ? "bg-yellow-100" : "hover:bg-yellow-50"
        }`}
      >
        {sentence}
      </span>

      {/* Sentence tooltip (with word chips) */}
      {hover && tip.status !== "idle" && (
        <span
          onMouseEnter={() => setHover(true)}
          onMouseLeave={() => setHover(false)}
          className="absolute left-0 top-full z-20 mt-1 w-max max-w-sm rounded-xl border border-slate-200 bg-white p-3 shadow-xl"
          style={{ minWidth: "220px" }}
        >
          {tip.status === "loading" ? (
            <span className="flex items-center gap-2 text-xs text-slate-400">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Translating…
            </span>
          ) : (
            <span className="block space-y-2.5">
              {/* English translation */}
              <span className="flex items-start gap-1.5">
                <Languages className="mt-0.5 h-3.5 w-3.5 shrink-0 text-indigo-400" />
                <span className="text-xs leading-snug text-slate-700">
                  {tip.translation}
                </span>
              </span>
              {/* Divider */}
              <span className="block border-t border-slate-100" />
              {/* Word chips */}
              <span className="block text-[11px] text-slate-400 mb-1">
                Hover a word for its meaning
              </span>
              <span className="flex flex-wrap gap-0.5 text-xs text-slate-700 leading-relaxed font-mono">
                {tokens.map((token, idx) => (
                  <WordChip
                    key={idx}
                    token={token}
                    language={language}
                    cache={cache}
                  />
                ))}
              </span>
            </span>
          )}
        </span>
      )}
    </span>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

type Props = {
  body: string;
  language: "es" | "fr";
};

export function TranslatedStoryBody({ body, language }: Props) {
  // Shared translation cache across all sentences and words on the page.
  const cache = useRef<Map<string, string>>(new Map());

  const paragraphs = body
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean);

  return (
    <>
      <p className="mb-4 flex items-center gap-1.5 text-xs text-slate-400">
        <Languages className="h-3.5 w-3.5" />
        Hover any sentence to see its translation, then hover individual words for definitions.
      </p>
      {paragraphs.map((para, pi) => {
        const sentences = splitSentences(para);
        return (
          <p key={pi} className="mt-5 text-base leading-8 text-slate-800 first:mt-0">
            {sentences.map((sent, si) => (
              <SentenceSpan
                key={si}
                sentence={sent}
                language={language}
                cache={cache}
              />
            ))}
          </p>
        );
      })}
    </>
  );
}
