"use client";

import { useState, useRef, useCallback, useEffect } from "react";

// Minimal Web Speech API type declarations — not in all TS lib.dom versions.
interface SpeechRecognitionResultItem {
  readonly transcript: string;
  readonly confidence: number;
}
interface SpeechRecognitionResult {
  readonly isFinal: boolean;
  readonly length: number;
  [index: number]: SpeechRecognitionResultItem;
}
interface SpeechRecognitionResultList {
  readonly length: number;
  [index: number]: SpeechRecognitionResult;
}
interface SpeechRecognitionEvent extends Event {
  readonly resultIndex: number;
  readonly results: SpeechRecognitionResultList;
}
interface SpeechRecognitionErrorEvent extends Event {
  readonly error: string;
}
interface ISpeechRecognition extends EventTarget {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  maxAlternatives: number;
  onstart: ((ev: Event) => void) | null;
  onend: ((ev: Event) => void) | null;
  onresult: ((ev: SpeechRecognitionEvent) => void) | null;
  onerror: ((ev: SpeechRecognitionErrorEvent) => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
}
interface ISpeechRecognitionCtor {
  new (): ISpeechRecognition;
}
declare global {
  interface Window {
    SpeechRecognition?: ISpeechRecognitionCtor;
    webkitSpeechRecognition?: ISpeechRecognitionCtor;
  }
}

type UseVoiceChatOptions = {
  /** BCP-47 language tag, e.g. 'es-ES', 'fr-FR'. Used for both STT and TTS. */
  lang: string;
  /** Called with the final transcript after the user stops speaking. */
  onFinalTranscript: (text: string) => void;
};

export type UseVoiceChatReturn = {
  /** False on iOS Safari or any browser without the Web Speech API. */
  isSupported: boolean;
  isListening: boolean;
  startListening: () => void;
  stopListening: () => void;
  /** Live interim transcript — empty when not listening. */
  interimText: string;
  /** Speak a string aloud via ElevenLabs, falling back to browser TTS. */
  speak: (text: string) => void;
  isSpeaking: boolean;
  stopSpeaking: () => void;
  /** Set when ElevenLabs failed and browser TTS was used instead. */
  ttsFallbackReason: string | null;
  clearTtsFallback: () => void;
};

export function useVoiceChat({
  lang,
  onFinalTranscript,
}: UseVoiceChatOptions): UseVoiceChatReturn {
  const [isSupported, setIsSupported] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [interimText, setInterimText] = useState("");
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [ttsFallbackReason, setTtsFallbackReason] = useState<string | null>(null);

  const recognitionRef = useRef<ISpeechRecognition | null>(null);
  // Accumulates the final portion of the transcript across result chunks.
  const finalRef = useRef("");
  // Keep callback ref current without re-creating startListening on every render.
  const onFinalRef = useRef(onFinalTranscript);
  useEffect(() => {
    onFinalRef.current = onFinalTranscript;
  }, [onFinalTranscript]);

  // Ref to the currently-playing HTMLAudioElement (ElevenLabs path).
  const audioRef = useRef<HTMLAudioElement | null>(null);
  // Tracks object URLs so we can revoke them after playback to avoid leaks.
  const blobUrlRef = useRef<string | null>(null);

  useEffect(() => {
    setIsSupported(
      typeof window !== "undefined" &&
        (window.SpeechRecognition != null || window.webkitSpeechRecognition != null),
    );
  }, []);

  const stopSpeaking = useCallback(() => {
    // Stop ElevenLabs audio if playing.
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = "";
      audioRef.current = null;
    }
    if (blobUrlRef.current) {
      URL.revokeObjectURL(blobUrlRef.current);
      blobUrlRef.current = null;
    }
    // Also cancel any browser speechSynthesis fallback that may be running.
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
  }, []);

  /** Speak text via ElevenLabs (server route), falling back to browser TTS. */
  const speak = useCallback(
    async (text: string) => {
      if (typeof window === "undefined") return;

      // Stop anything already playing.
      stopSpeaking();
      setIsSpeaking(true);

      // Extract the language code from the BCP-47 tag (e.g. "es-ES" → "es").
      const langCode = lang.split("-")[0] ?? "es";

      try {
        const res = await fetch("/api/tts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text, lang: langCode }),
        });

        if (!res.ok) {
          let reason = "ElevenLabs unavailable";
          try {
            const json = (await res.json()) as { code?: string; detail?: string };
            if (json.code === "paid_plan_required") {
              reason =
                "ElevenLabs free plan cannot use library voices via the API. Create a voice in Voice Lab, copy its ID, and set ELEVENLABS_VOICE_ES in .env.local.";
            } else if (json.code) {
              reason = `ElevenLabs error: ${json.code}`;
            }
          } catch {
            // ignore parse errors
          }
          throw new Error(reason);
        }

        setTtsFallbackReason(null);
        const blob = await res.blob();
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

        await audio.play();
      } catch (err) {
        const reason =
          err instanceof Error ? err.message : "ElevenLabs unavailable";
        setTtsFallbackReason(reason);
        console.warn("[tts] falling back to browser voice:", reason);
        if (!window.speechSynthesis) {
          setIsSpeaking(false);
          return;
        }
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = lang;
        utterance.rate = 0.85;
        utterance.onend = () => setIsSpeaking(false);
        utterance.onerror = () => setIsSpeaking(false);
        window.speechSynthesis.speak(utterance);
      }
    },
    [lang, stopSpeaking],
  );

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
  }, []);

  const startListening = useCallback(() => {
    if (typeof window === "undefined") return;
    const SpeechRecognitionClass: ISpeechRecognitionCtor | undefined =
      window.SpeechRecognition ?? window.webkitSpeechRecognition;
    if (!SpeechRecognitionClass) return;

    // Interrupt any ongoing TTS so the mic doesn't pick it up.
    stopSpeaking();

    // Tear down any previous recognition session.
    if (recognitionRef.current) {
      recognitionRef.current.abort();
      recognitionRef.current = null;
    }

    const recognition = new SpeechRecognitionClass();
    recognition.lang = lang;
    recognition.interimResults = true;
    // continuous: false — browser auto-stops after a pause in speech.
    recognition.continuous = false;
    recognition.maxAlternatives = 1;

    finalRef.current = "";

    recognition.onstart = () => {
      setIsListening(true);
      setInterimText("");
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interimTranscript = "";
      let finalTranscript = "";

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const item = result?.[0];
        if (!result || !item) continue;
        const t = item.transcript;
        if (result.isFinal) {
          finalTranscript += t;
        } else {
          interimTranscript += t;
        }
      }

      if (finalTranscript) {
        finalRef.current += finalTranscript;
      }
      setInterimText(finalRef.current + interimTranscript);
    };

    recognition.onend = () => {
      setIsListening(false);
      setInterimText("");
      const text = finalRef.current.trim();
      finalRef.current = "";
      if (text) {
        onFinalRef.current(text);
      }
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      // 'no-speech' is normal — user just didn't say anything.
      if (event.error !== "no-speech") {
        console.error("[SpeechRecognition] error:", event.error);
      }
      setIsListening(false);
      setInterimText("");
      finalRef.current = "";
    };

    recognitionRef.current = recognition;
    recognition.start();
  }, [lang, stopSpeaking]);

  return {
    isSupported,
    isListening,
    startListening,
    stopListening,
    interimText,
    speak,
    isSpeaking,
    stopSpeaking,
    ttsFallbackReason,
    clearTtsFallback: () => setTtsFallbackReason(null),
  };
}
