/**
 * Server-side TTS proxy for ElevenLabs.
 *
 * Accepts { text, lang } in the request body, selects the right voice,
 * calls the ElevenLabs streaming endpoint, and pipes the MP3 bytes back to
 * the client. Requires an authenticated user. Set DISABLE_TTS=true to hard-off
 * the route (recommended until Premium is live).
 *
 * Voice IDs can be overridden via env vars without code changes:
 *   ELEVENLABS_VOICE_ES  — Spanish tutor voice (default: Rachel)
 *   ELEVENLABS_VOICE_FR  — French tutor voice  (default: Rachel)
 */

import { requireUser, isUnauthorized } from "@/lib/auth/require-user";

// Rachel — warm, clear, works beautifully with eleven_multilingual_v2.
const DEFAULT_VOICE_ID = "21m00Tcm4TlvDq8ikWAM";

/** Soft cap to stop a single request from burning the ElevenLabs quota. */
const MAX_TTS_CHARS = 2_500;

function classifyElevenLabsFailure(
  status: number,
  detail: string,
): { code: string; httpStatus: number } {
  let parsedCode: string | undefined;
  try {
    const parsed = JSON.parse(detail) as {
      detail?: { code?: string; message?: string; status?: string };
    };
    parsedCode = parsed.detail?.code ?? parsed.detail?.status;
  } catch {
    // detail may be plain text
  }

  const haystack = `${parsedCode ?? ""} ${detail}`;
  if (
    status === 429 ||
    /rate.?limit|quota_exceeded|too many requests/i.test(haystack)
  ) {
    return { code: "rate_limit", httpStatus: 429 };
  }

  if (parsedCode) return { code: parsedCode, httpStatus: status || 503 };
  return { code: "tts_unavailable", httpStatus: status || 503 };
}

export async function POST(request: Request) {
  const authed = await requireUser();
  if (isUnauthorized(authed)) return authed;

  if (process.env.DISABLE_TTS === "true") {
    return new Response(
      JSON.stringify({
        error: "TTS is temporarily disabled.",
        code: "tts_disabled",
      }),
      { status: 503, headers: { "Content-Type": "application/json" } },
    );
  }

  const apiKey = process.env.ELEVENLABS_API_KEY;

  const VOICE_BY_LANG: Record<string, string> = {
    es: process.env.ELEVENLABS_VOICE_ES ?? DEFAULT_VOICE_ID,
    fr: process.env.ELEVENLABS_VOICE_FR ?? DEFAULT_VOICE_ID,
  };
  if (!apiKey) {
    return new Response(
      JSON.stringify({
        error: "ELEVENLABS_API_KEY is not configured.",
        code: "tts_unavailable",
      }),
      { status: 503, headers: { "Content-Type": "application/json" } },
    );
  }

  let text = "";
  let lang = "es";
  try {
    const body = (await request.json()) as { text?: string; lang?: string };
    text = (body.text ?? "").trim();
    lang = body.lang ?? "es";
  } catch {
    return new Response(JSON.stringify({ error: "Invalid request body." }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (!text) {
    return new Response(JSON.stringify({ error: "text is required." }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (text.length > MAX_TTS_CHARS) {
    return new Response(
      JSON.stringify({
        error: `Text exceeds ${MAX_TTS_CHARS} character limit.`,
        code: "tts_too_long",
      }),
      { status: 400, headers: { "Content-Type": "application/json" } },
    );
  }

  const voiceId = VOICE_BY_LANG[lang] ?? DEFAULT_VOICE_ID;

  const elRes = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}/stream?output_format=mp3_44100_128`,
    {
      method: "POST",
      headers: {
        "xi-api-key": apiKey,
        "Content-Type": "application/json",
        Accept: "audio/mpeg",
      },
      body: JSON.stringify({
        text,
        model_id: "eleven_multilingual_v2",
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75,
          style: 0.3,
          use_speaker_boost: true,
        },
      }),
    },
  ).catch((err: unknown) => {
    console.error("[tts] ElevenLabs fetch failed:", err);
    return null;
  });

  if (!elRes || !elRes.ok) {
    const detail = elRes
      ? await elRes.text().catch(() => elRes.statusText)
      : "network error";

    const { code, httpStatus } = classifyElevenLabsFailure(
      elRes?.status ?? 0,
      detail,
    );

    console.error("[tts] ElevenLabs error:", detail);
    return new Response(
      JSON.stringify({ error: "TTS service unavailable.", code, detail }),
      { status: httpStatus, headers: { "Content-Type": "application/json" } },
    );
  }

  return new Response(elRes.body, {
    headers: {
      "Content-Type": "audio/mpeg",
      "Cache-Control": "no-store",
    },
  });
}
