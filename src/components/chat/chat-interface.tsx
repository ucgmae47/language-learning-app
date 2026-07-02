"use client";

import { useEffect, useRef, useCallback } from "react";
import {
  Send,
  Square,
  Bot,
  User,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
} from "lucide-react";
import type { CefrLevel, Language } from "@/lib/supabase/types";
import { useStreamingChat } from "@/hooks/use-streaming-chat";
import { useVoiceChat } from "@/hooks/use-voice-chat";

const LANG_BCP47: Record<Language, string> = {
  es: "es-ES",
  fr: "fr-FR",
};

const GREETING: Record<Language, (name: string, tutor: string) => string> = {
  es: (name, tutor) => `¡Hola, ${name}! Soy ${tutor}.`,
  fr: (name, tutor) => `Bonjour, ${name}\u00a0! Je suis ${tutor}.`,
};

const SUBTITLE: Record<Language, string> = {
  es: "Tu compañera de conversación en español. Empieza a escribir o hablar.",
  fr: "Ta partenaire de conversation en français. Commence à écrire ou à parler.",
};

type Props = {
  displayName: string;
  tutorName: string;
  cefrLevel: CefrLevel;
  language: Language;
  starters: string[];
};

export function ChatInterface({
  displayName,
  tutorName,
  cefrLevel,
  language,
  starters,
}: Props) {
  const { messages, input, setInput, sendMessage, append, stop, isLoading } =
    useStreamingChat("/api/chat");

  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const lastSpokenIdRef = useRef<string | null>(null);

  // ── Voice setup ────────────────────────────────────────────────────────────
  const handleFinalTranscript = useCallback(
    (text: string) => {
      // Send immediately — no editing step, like ChatGPT voice mode.
      append(text);
    },
    [append],
  );

  const {
    isSupported: voiceSupported,
    isListening,
    startListening,
    stopListening,
    interimText,
    speak,
    isSpeaking,
    stopSpeaking,
  } = useVoiceChat({
    lang: LANG_BCP47[language],
    onFinalTranscript: handleFinalTranscript,
  });

  // ── Auto-speak each completed AI response ──────────────────────────────────
  useEffect(() => {
    if (isLoading) return;
    const lastMsg = messages[messages.length - 1];
    if (!lastMsg || lastMsg.role !== "assistant" || !lastMsg.content) return;
    if (lastMsg.id === lastSpokenIdRef.current) return;
    lastSpokenIdRef.current = lastMsg.id;
    speak(lastMsg.content);
  }, [isLoading, messages, speak]);

  // ── Scroll to bottom ───────────────────────────────────────────────────────
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, interimText]);

  const showSuggestions = messages.length === 0 && !isListening;

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void sendMessage(input);
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    void sendMessage(input);
  }

  function handleMicClick() {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  }

  // ── Derive action button ───────────────────────────────────────────────────
  // Priority: AI loading → listening → speaking → send
  let actionButton: React.ReactNode;
  if (isLoading) {
    actionButton = (
      <button
        type="button"
        onClick={stop}
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-slate-300 bg-white text-slate-600 transition hover:border-red-300 hover:text-red-600"
        aria-label="Stop generating"
      >
        <Square className="h-4 w-4" aria-hidden="true" />
      </button>
    );
  } else if (isSpeaking) {
    actionButton = (
      <button
        type="button"
        onClick={stopSpeaking}
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-violet-300 bg-violet-50 text-violet-600 transition hover:bg-violet-100"
        aria-label="Stop speaking"
      >
        <VolumeX className="h-4 w-4" aria-hidden="true" />
      </button>
    );
  } else {
    actionButton = (
      <button
        type="submit"
        disabled={!input.trim() || isListening}
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-white shadow-sm transition hover:bg-emerald-700 disabled:opacity-40"
        aria-label="Send message"
      >
        <Send className="h-4 w-4" aria-hidden="true" />
      </button>
    );
  }

  return (
    <div className="flex h-full flex-col">
      {/* ── Messages ──────────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto px-4 py-6 sm:px-6">
        {showSuggestions ? (
          <div className="flex h-full flex-col items-center justify-center gap-6 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-100">
              <Bot className="h-8 w-8 text-emerald-700" aria-hidden="true" />
            </div>
            <div>
              <p className="text-lg font-semibold text-slate-900">
                {GREETING[language](displayName, tutorName)}
              </p>
              <p className="mt-1 text-sm text-slate-500">
                {SUBTITLE[language]}
              </p>
            </div>
            <div className="flex flex-wrap justify-center gap-2">
              {starters.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => append(s)}
                  className="rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-800 transition hover:bg-emerald-100"
                >
                  {s}
                </button>
              ))}
            </div>
            {voiceSupported && (
              <p className="flex items-center gap-1.5 text-xs text-slate-400">
                <Mic className="h-3.5 w-3.5" aria-hidden="true" />
                Tap the mic button below to speak instead of typing
              </p>
            )}
          </div>
        ) : (
          <div className="mx-auto flex max-w-2xl flex-col gap-4">
            {messages.map((msg) => {
              const isUser = msg.role === "user";
              return (
                <div
                  key={msg.id}
                  className={`flex items-end gap-2 ${isUser ? "flex-row-reverse" : "flex-row"}`}
                >
                  <div
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-white shadow-sm ${isUser ? "bg-emerald-600" : "bg-slate-700"}`}
                  >
                    {isUser ? (
                      <User className="h-4 w-4" aria-hidden="true" />
                    ) : (
                      <Bot className="h-4 w-4" aria-hidden="true" />
                    )}
                  </div>

                  <div className="group relative max-w-[75%]">
                    <div
                      className={`rounded-2xl px-4 py-3 text-sm leading-6 shadow-sm ${
                        isUser
                          ? "rounded-br-sm bg-emerald-600 text-white"
                          : "rounded-bl-sm border border-slate-200 bg-white text-slate-800"
                      }`}
                    >
                      {msg.content || (
                        <span className="flex gap-1">
                          <span className="h-2 w-2 animate-bounce rounded-full bg-slate-300 [animation-delay:0ms]" />
                          <span className="h-2 w-2 animate-bounce rounded-full bg-slate-300 [animation-delay:150ms]" />
                          <span className="h-2 w-2 animate-bounce rounded-full bg-slate-300 [animation-delay:300ms]" />
                        </span>
                      )}
                    </div>

                    {/* Re-play TTS button on completed assistant messages */}
                    {!isUser && voiceSupported && msg.content && !isLoading && (
                      <button
                        type="button"
                        onClick={() => speak(msg.content)}
                        className="absolute -bottom-2 -right-2 hidden h-6 w-6 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-400 shadow-sm transition hover:text-violet-600 group-hover:flex"
                        aria-label="Replay audio"
                        title="Play aloud"
                      >
                        <Volume2 className="h-3 w-3" aria-hidden="true" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      {/* ── Listening overlay ─────────────────────────────────────────────── */}
      {isListening && (
        <div className="border-t border-red-100 bg-red-50 px-4 py-3 sm:px-6">
          <div className="mx-auto flex max-w-2xl items-center gap-3">
            {/* Animated pulse dots */}
            <span className="flex shrink-0 gap-1" aria-hidden="true">
              <span className="h-2 w-2 animate-bounce rounded-full bg-red-400 [animation-delay:0ms]" />
              <span className="h-2 w-2 animate-bounce rounded-full bg-red-400 [animation-delay:150ms]" />
              <span className="h-2 w-2 animate-bounce rounded-full bg-red-400 [animation-delay:300ms]" />
            </span>
            <p
              className={`flex-1 text-sm ${interimText ? "text-red-800" : "italic text-red-400"}`}
            >
              {interimText || "Listening…"}
            </p>
            <span className="text-xs text-red-400">
              tap mic to stop
            </span>
          </div>
        </div>
      )}

      {/* ── Input bar ─────────────────────────────────────────────────────── */}
      <div className="border-t border-slate-200 bg-white px-4 py-4 sm:px-6">
        <form
          onSubmit={handleSubmit}
          className="mx-auto flex max-w-2xl items-end gap-2"
        >
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={1}
            placeholder={
              isListening
                ? "Speaking…"
                : language === "fr"
                  ? "Écris un message…"
                  : "Escribe un mensaje…"
            }
            disabled={isLoading || isListening}
            className="flex-1 resize-none rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-900 placeholder-slate-400 outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 disabled:opacity-60"
            style={{ maxHeight: "120px" }}
          />

          {/* Mic button — hidden on unsupported browsers */}
          {voiceSupported && (
            <button
              type="button"
              onClick={handleMicClick}
              disabled={isLoading}
              aria-label={isListening ? "Stop listening" : "Start voice input"}
              className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full border transition disabled:opacity-40 ${
                isListening
                  ? "animate-pulse border-red-300 bg-red-500 text-white shadow-lg"
                  : "border-slate-300 bg-white text-slate-500 hover:border-emerald-300 hover:text-emerald-600"
              }`}
            >
              {isListening ? (
                <MicOff className="h-4 w-4" aria-hidden="true" />
              ) : (
                <Mic className="h-4 w-4" aria-hidden="true" />
              )}
            </button>
          )}

          {/* Action button: stop-loading / stop-TTS / send */}
          {actionButton}
        </form>

        <p className="mx-auto mt-2 max-w-2xl text-center text-xs text-slate-400">
          {voiceSupported ? (
            <>
              <kbd className="rounded border border-slate-200 px-1 font-mono">
                Enter
              </kbd>{" "}
              to send ·{" "}
              <kbd className="rounded border border-slate-200 px-1 font-mono">
                Shift+Enter
              </kbd>{" "}
              for new line · mic for voice
            </>
          ) : (
            <>
              Press{" "}
              <kbd className="rounded border border-slate-200 px-1 font-mono">
                Enter
              </kbd>{" "}
              to send ·{" "}
              <kbd className="rounded border border-slate-200 px-1 font-mono">
                Shift+Enter
              </kbd>{" "}
              for new line
            </>
          )}
        </p>
      </div>
    </div>
  );
}
