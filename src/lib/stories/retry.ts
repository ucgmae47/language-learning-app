/**
 * Shared Gemini retry helpers for story generation.
 *
 * Transient capacity / rate-limit errors are retried with exponential backoff
 * so the user can stay on a single loading state instead of hammering the button.
 */

export function isTransientAiError(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err);
  return /quota|rate.?limit|resource.?exhausted|429|503|502|504|high demand|overloaded|unavailable|temporar|try again later|econnreset|etimedout|fetch failed|network/i.test(
    msg,
  );
}

export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export type RetryOptions = {
  /** Total attempts including the first try. Default 5. */
  attempts?: number;
  /** Initial backoff in ms. Default 2000. */
  initialDelayMs?: number;
  /** Max backoff cap in ms. Default 12000. */
  maxDelayMs?: number;
  /** Optional label for log lines. */
  label?: string;
};

/**
 * Run `fn` with retries on transient AI / network failures.
 * Non-transient errors fail immediately.
 */
export async function withAiRetries<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {},
): Promise<T> {
  const attempts = options.attempts ?? 5;
  const initialDelayMs = options.initialDelayMs ?? 2000;
  const maxDelayMs = options.maxDelayMs ?? 12_000;
  const label = options.label ?? "ai";

  let lastError: unknown;

  for (let attempt = 0; attempt < attempts; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      const message = err instanceof Error ? err.message : String(err);
      const transient = isTransientAiError(err);
      const hasMore = attempt < attempts - 1;

      if (!transient || !hasMore) {
        throw err;
      }

      const waitMs = Math.min(
        initialDelayMs * 2 ** attempt,
        maxDelayMs,
      );
      console.warn(
        `[${label}] Transient AI error (attempt ${attempt + 1}/${attempts}): ${message}. Retrying in ${waitMs}ms…`,
      );
      await delay(waitMs);
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error(String(lastError ?? "Unknown AI error"));
}

export const FRIENDLY_STORY_BUSY_ERROR =
  "Our story writer is a little busy right now. Please wait a moment and try again — this usually clears up quickly.";

export const FRIENDLY_STORY_FAILED_ERROR =
  "We couldn't create your story just now. Please try again in a moment.";
