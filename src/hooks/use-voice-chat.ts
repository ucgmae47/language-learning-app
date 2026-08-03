"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { useTts } from "@/hooks/use-tts";

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
  speak: (text: string) => Promise<void>;
  /**
   * Load TTS audio, call `onReady` once buffered, then play.
   * Use this to reveal assistant messages in sync with speech.
   */
  speakWhenReady: (text: string, onReady: () => void) => Promise<void>;
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

  const recognitionRef = useRef<ISpeechRecognition | null>(null);
  const finalRef = useRef("");
  const onFinalRef = useRef(onFinalTranscript);
  useEffect(() => {
    onFinalRef.current = onFinalTranscript;
  }, [onFinalTranscript]);

  const {
    speak,
    speakWhenReady,
    isSpeaking,
    stopSpeaking,
    ttsFallbackReason,
    clearTtsFallback,
  } = useTts({ lang });

  useEffect(() => {
    const id = setTimeout(() => {
      setIsSupported(
        typeof window !== "undefined" &&
          (window.SpeechRecognition != null || window.webkitSpeechRecognition != null),
      );
    }, 0);
    return () => clearTimeout(id);
  }, []);

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
  }, []);

  const startListening = useCallback(() => {
    if (typeof window === "undefined") return;
    const SpeechRecognitionClass: ISpeechRecognitionCtor | undefined =
      window.SpeechRecognition ?? window.webkitSpeechRecognition;
    if (!SpeechRecognitionClass) return;

    stopSpeaking();

    if (recognitionRef.current) {
      recognitionRef.current.abort();
      recognitionRef.current = null;
    }

    const recognition = new SpeechRecognitionClass();
    recognition.lang = lang;
    recognition.interimResults = true;
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
    speakWhenReady,
    isSpeaking,
    stopSpeaking,
    ttsFallbackReason,
    clearTtsFallback,
  };
}
