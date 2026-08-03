"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { delay } from "@/lib/stories/retry";

export type UseTtsOptions = {
  /** BCP-47 language tag, e.g. 'es-ES', 'fr-FR'. */
  lang: string;
};

export type TtsErrorKind = "rate_limit" | "unavailable";

export type UseTtsReturn = {
  /** Speak via ElevenLabs only — never falls back to browser voice. */
  speak: (text: string) => Promise<void>;
  /**
   * Load TTS audio, call `onReady` once buffered (or when giving up), then play.
   * `onReady` always runs so callers can reveal UI even if audio fails.
   */
  speakWhenReady: (text: string, onReady: () => void) => Promise<void>;
  isSpeaking: boolean;
  /** True while fetching / buffering / retrying ElevenLabs audio. */
  isLoading: boolean;
  stopSpeaking: () => void;
  /**
   * User-facing error when voice is unavailable (especially rate limits).
   * Cleared on the next successful speak or via clearTtsError.
   */
  ttsError: string | null;
  clearTtsError: () => void;
};

/** @deprecated Prefer `ttsError` — kept for chat until callers migrate. */
export type UseTtsLegacyAlias = {
  ttsFallbackReason: string | null;
  clearTtsFallback: () => void;
};

const FRIENDLY_RATE_LIMIT =
  "Voice is temporarily unavailable — the service hit its rate limit. Please try again in a minute.";

const TTS_ATTEMPTS = 5;
const TTS_INITIAL_DELAY_MS = 1500;
const TTS_MAX_DELAY_MS = 10_000;

function waitForAudioReady(audio: HTMLAudioElement): Promise<void> {
  if (audio.readyState >= HTMLMediaElement.HAVE_ENOUGH_DATA) {
    return Promise.resolve();
  }

  return new Promise((resolve, reject) => {
    const onReady = () => {
      cleanup();
      resolve();
    };
    const onError = () => {
      cleanup();
      reject(new Error("Audio failed to load"));
    };
    const cleanup = () => {
      audio.removeEventListener("canplaythrough", onReady);
      audio.removeEventListener("error", onError);
    };

    audio.addEventListener("canplaythrough", onReady, { once: true });
    audio.addEventListener("error", onError, { once: true });
    audio.load();
  });
}

function isRateLimitPayload(status: number, code?: string, detail?: string): boolean {
  if (status === 429) return true;
  const haystack = `${code ?? ""} ${detail ?? ""}`;
  return /rate.?limit|quota|too many requests|429/i.test(haystack);
}

function isRetryableTtsFailure(status: number, code?: string, detail?: string): boolean {
  if (isRateLimitPayload(status, code, detail)) return false;
  if (status === 401 || status === 403 || status === 400) return false;
  if (code === "paid_plan_required" || code === "tts_unavailable") {
    // Config / missing key issues won't recover mid-session.
    if (code === "paid_plan_required") return false;
  }
  return (
    status >= 500 ||
    status === 0 ||
    /high demand|overloaded|unavailable|temporar|try again|econnreset|etimedout|fetch failed|network|503|502|504/i.test(
      `${code ?? ""} ${detail ?? ""}`,
    )
  );
}

/**
 * ElevenLabs-only TTS (no browser speechSynthesis).
 * Retries transient failures; rate limits fail immediately with a user message.
 */
export function useTts({ lang }: UseTtsOptions): UseTtsReturn & UseTtsLegacyAlias {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [ttsError, setTtsError] = useState<string | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const blobUrlRef = useRef<string | null>(null);
  const langRef = useRef(lang);
  const requestGenRef = useRef(0);

  useEffect(() => {
    langRef.current = lang;
  }, [lang]);

  useEffect(() => {
    return () => {
      requestGenRef.current += 1;
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = "";
        audioRef.current = null;
      }
      if (blobUrlRef.current) {
        URL.revokeObjectURL(blobUrlRef.current);
        blobUrlRef.current = null;
      }
    };
  }, []);

  const stopSpeaking = useCallback(() => {
    requestGenRef.current += 1;
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = "";
      audioRef.current = null;
    }
    if (blobUrlRef.current) {
      URL.revokeObjectURL(blobUrlRef.current);
      blobUrlRef.current = null;
    }
    setIsSpeaking(false);
    setIsLoading(false);
  }, []);

  const fetchElevenLabsOnce = useCallback(async (text: string): Promise<Blob> => {
    const langCode = langRef.current.split("-")[0] ?? "es";

    let res: Response;
    try {
      res = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, lang: langCode }),
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Network error";
      const error = new Error(message) as Error & {
        status: number;
        code?: string;
        retryable: boolean;
        rateLimited: boolean;
      };
      error.status = 0;
      error.retryable = true;
      error.rateLimited = false;
      throw error;
    }

    if (!res.ok) {
      let code: string | undefined;
      let detail: string | undefined;
      try {
        const json = (await res.json()) as { code?: string; detail?: string; error?: string };
        code = json.code;
        detail = json.detail ?? json.error;
      } catch {
        // ignore
      }

      const rateLimited = isRateLimitPayload(res.status, code, detail);
      const error = new Error(
        rateLimited
          ? FRIENDLY_RATE_LIMIT
          : detail || code || `TTS failed (${res.status})`,
      ) as Error & {
        status: number;
        code?: string;
        retryable: boolean;
        rateLimited: boolean;
      };
      error.status = res.status;
      error.code = code;
      error.rateLimited = rateLimited;
      error.retryable = isRetryableTtsFailure(res.status, code, detail);
      throw error;
    }

    return res.blob();
  }, []);

  const loadElevenLabsAudio = useCallback(
    async (text: string, requestGen: number): Promise<HTMLAudioElement> => {
      let lastError: unknown;

      for (let attempt = 0; attempt < TTS_ATTEMPTS; attempt++) {
        if (requestGen !== requestGenRef.current) {
          throw new Error("TTS cancelled");
        }

        try {
          const blob = await fetchElevenLabsOnce(text);
          if (requestGen !== requestGenRef.current) {
            throw new Error("TTS cancelled");
          }

          const url = URL.createObjectURL(blob);
          blobUrlRef.current = url;

          const audio = new Audio(url);
          audioRef.current = audio;

          audio.onended = () => {
            setIsSpeaking(false);
            if (blobUrlRef.current === url) {
              URL.revokeObjectURL(url);
              blobUrlRef.current = null;
            }
            audioRef.current = null;
          };
          audio.onerror = () => {
            setIsSpeaking(false);
            audioRef.current = null;
          };

          await waitForAudioReady(audio);
          return audio;
        } catch (err) {
          lastError = err;
          const rateLimited =
            typeof err === "object" &&
            err !== null &&
            "rateLimited" in err &&
            Boolean((err as { rateLimited?: boolean }).rateLimited);
          const retryable =
            typeof err === "object" &&
            err !== null &&
            "retryable" in err &&
            Boolean((err as { retryable?: boolean }).retryable);

          if (rateLimited) {
            throw err;
          }

          const hasMore = attempt < TTS_ATTEMPTS - 1;
          if (!retryable || !hasMore) {
            throw err;
          }

          const waitMs = Math.min(
            TTS_INITIAL_DELAY_MS * 2 ** attempt,
            TTS_MAX_DELAY_MS,
          );
          const message = err instanceof Error ? err.message : String(err);
          console.warn(
            `[tts] Transient error (attempt ${attempt + 1}/${TTS_ATTEMPTS}): ${message}. Retrying in ${waitMs}ms…`,
          );
          await delay(waitMs);
        }
      }

      throw lastError instanceof Error
        ? lastError
        : new Error(String(lastError ?? "TTS failed"));
    },
    [fetchElevenLabsOnce],
  );

  const speakWhenReady = useCallback(
    async (text: string, onReady: () => void) => {
      if (typeof window === "undefined") {
        onReady();
        return;
      }
      const trimmed = text.trim();
      if (!trimmed) {
        onReady();
        return;
      }

      stopSpeaking();
      const requestGen = requestGenRef.current;
      setIsLoading(true);
      setTtsError(null);

      try {
        const audio = await loadElevenLabsAudio(trimmed, requestGen);
        if (requestGen !== requestGenRef.current) {
          onReady();
          return;
        }
        onReady();
        setIsLoading(false);
        setIsSpeaking(true);
        setTtsError(null);
        await audio.play();
      } catch (err) {
        setIsLoading(false);
        setIsSpeaking(false);

        const cancelled =
          err instanceof Error && err.message === "TTS cancelled";
        if (cancelled) {
          onReady();
          return;
        }

        const rateLimited =
          typeof err === "object" &&
          err !== null &&
          "rateLimited" in err &&
          Boolean((err as { rateLimited?: boolean }).rateLimited);

        if (rateLimited) {
          setTtsError(FRIENDLY_RATE_LIMIT);
        } else {
          // Soft fail: no robotic fallback, no scary banner for transient exhaustion.
          console.warn(
            "[tts] Giving up without audio:",
            err instanceof Error ? err.message : err,
          );
          setTtsError(null);
        }

        onReady();
      }
    },
    [stopSpeaking, loadElevenLabsAudio],
  );

  const speak = useCallback(
    async (text: string) => {
      await speakWhenReady(text, () => {});
    },
    [speakWhenReady],
  );

  const clearTtsError = useCallback(() => setTtsError(null), []);

  return {
    speak,
    speakWhenReady,
    isSpeaking,
    isLoading,
    stopSpeaking,
    ttsError,
    clearTtsError,
    // Legacy aliases used by chat until fully renamed
    ttsFallbackReason: ttsError,
    clearTtsFallback: clearTtsError,
  };
}
