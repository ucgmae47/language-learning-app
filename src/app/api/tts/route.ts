/**
 * Server-side TTS proxy for ElevenLabs.
 *
 * Accepts { text, lang } in the request body, selects the right voice,
 * calls the ElevenLabs streaming endpoint, and pipes the MP3 bytes back to
 * the client.  Falls back cleanly with a 503 JSON error so the hook can
 * use browser speechSynthesis instead.
 *
 * Voice IDs can be overridden via env vars without code changes:
 *   ELEVENLABS_VOICE_ES  — Spanish tutor voice (default: Rachel)
 *   ELEVENLABS_VOICE_FR  — French tutor voice  (default: Rachel)
 *
 * The eleven_multilingual_v2 model speaks any language with any voice,
 * so the same voice ID works for both Spanish and French if you prefer.
 */

// Rachel — warm, clear, works beautifully with eleven_multilingual_v2.
// Users can swap this to any voice from their ElevenLabs account via env vars:
//   ELEVENLABS_VOICE_ES  — voice ID for Spanish
//   ELEVENLABS_VOICE_FR  — voice ID for French
const DEFAULT_VOICE_ID = "21m00Tcm4TlvDq8ikWAM";

export async function POST(request: Request) {
  const apiKey = process.env.ELEVENLABS_API_KEY;

  // Read voice IDs inside the handler so they're always fresh (no module-level caching).
  const VOICE_BY_LANG: Record<string, string> = {
    es: process.env.ELEVENLABS_VOICE_ES ?? DEFAULT_VOICE_ID,
    fr: process.env.ELEVENLABS_VOICE_FR ?? DEFAULT_VOICE_ID,
  };
  if (!apiKey) {
    return new Response(
      JSON.stringify({ error: "ELEVENLABS_API_KEY is not configured." }),
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

  const voiceId = VOICE_BY_LANG[lang] ?? DEFAULT_VOICE_ID;

  // output_format must be a query param, not a body field.
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

    let code = "tts_unavailable";
    try {
      const parsed = JSON.parse(detail) as {
        detail?: { code?: string; message?: string };
      };
      if (parsed.detail?.code) code = parsed.detail.code;
    } catch {
      // detail may be plain text
    }

    console.error("[tts] ElevenLabs error:", detail);
    return new Response(
      JSON.stringify({ error: "TTS service unavailable.", code, detail }),
      { status: 503, headers: { "Content-Type": "application/json" } },
    );
  }

  // Pipe the ElevenLabs audio stream directly back to the client.
  return new Response(elRes.body, {
    headers: {
      "Content-Type": "audio/mpeg",
      // Prevent the browser from caching TTS audio across sessions.
      "Cache-Control": "no-store",
    },
  });
}
