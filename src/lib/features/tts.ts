/**
 * ElevenLabs TTS kill switch. Set DISABLE_TTS=true (default during soft
 * launch) to hard-off voice everywhere it would otherwise show a speaker
 * button — there's no free-tier fallback voice, so a visible button that
 * always fails is worse than no button.
 */
export function isTtsEnabled(): boolean {
  return process.env.DISABLE_TTS !== "true";
}
