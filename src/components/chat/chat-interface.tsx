"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import {
  Send,
  Square,
  Bot,
  User,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  History,
} from "lucide-react";
import type { CefrLevel, ChatSession, Language, TutorMessage } from "@/lib/supabase/types";
import { useStreamingChat, type ChatMessage } from "@/hooks/use-streaming-chat";
import { useVoiceChat } from "@/hooks/use-voice-chat";
import { SessionList } from "@/components/chat/session-list";
import { getSessionMessages } from "@/app/actions/chat-history";

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
  /** Initial set of sessions to populate the sidebar with. */
  initialSessions: ChatSession[];
  /** Pre-loaded messages when continuing a saved session. */
  initialMessages?: TutorMessage[];
  /** The session ID being continued (null = new conversation). */
  initialSessionId?: string | null;
};

function tutorToChat(msgs: TutorMessage[]): ChatMessage[] {
  return msgs.map((m) => ({ id: m.id, role: m.role, content: m.content }));
}

export function ChatInterface({
  displayName,
  tutorName,
  cefrLevel,
  language,
  starters,
  initialSessions,
  initialMessages,
  initialSessionId,
}: Props) {
  // ── Session state ───────────────────────────────────────────────────────────
  const [sessions, setSessions] = useState<ChatSession[]>(initialSessions);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(
    initialSessionId ?? null,
  );
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loadingSession, setLoadingSession] = useState(false);

  // ── Streaming chat ──────────────────────────────────────────────────────────
  const { messages, input, setInput, sendMessage, append, stop, isLoading, reset } =
    useStreamingChat("/api/chat", {
      initialMessages: initialMessages ? tutorToChat(initialMessages) : undefined,
      initialSessionId: initialSessionId ?? null,
      language,
      onSessionCreated: (sessionId, title) => {
        setActiveSessionId(sessionId);
        // Prepend the new session to the sidebar list.
        setSessions((prev) => [
          {
            id: sessionId,
            user_id: "",
            language,
            title,
            message_count: 2,
            last_message_at: new Date().toISOString(),
            created_at: new Date().toISOString(),
          },
          ...prev,
        ]);
      },
    });

  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const lastSpokenIdRef = useRef<string | null>(null);

  // ── Voice setup ─────────────────────────────────────────────────────────────
  const handleFinalTranscript = useCallback(
    (text: string) => {
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
    ttsFallbackReason,
    clearTtsFallback,
  } = useVoiceChat({
    lang: LANG_BCP47[language],
    onFinalTranscript: handleFinalTranscript,
  });

  // ── Auto-speak each completed AI response ───────────────────────────────────
  useEffect(() => {
    if (isLoading) return;
    const lastMsg = messages[messages.length - 1];
    if (!lastMsg || lastMsg.role !== "assistant" || !lastMsg.content) return;
    if (lastMsg.id === lastSpokenIdRef.current) return;
    lastSpokenIdRef.current = lastMsg.id;
    speak(lastMsg.content);
  }, [isLoading, messages, speak]);

  // ── Scroll to bottom ────────────────────────────────────────────────────────
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, interimText]);

  // ── Session switching ───────────────────────────────────────────────────────
  async function handleSelectSession(session: ChatSession) {
    if (session.id === activeSessionId) {
      setSidebarOpen(false);
      return;
    }
    setLoadingSession(true);
    const msgs = await getSessionMessages(session.id);
    reset(tutorToChat(msgs), session.id);
    setActiveSessionId(session.id);
    setLoadingSession(false);
    setSidebarOpen(false);
  }

  function handleNewConversation() {
    reset([], null);
    setActiveSessionId(null);
    setSidebarOpen(false);
  }

  function handleSessionDeleted(sessionId: string) {
    setSessions((prev) => prev.filter((s) => s.id !== sessionId));
    if (activeSessionId === sessionId) {
      handleNewConversation();
    }
  }

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

  // ── Action button ───────────────────────────────────────────────────────────
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
    <div className="flex h-full overflow-hidden">
      {/* ── History sidebar ──────────────────────────────────────────────────── */}
      {/* Overlay on mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}
      <aside
        className={`absolute inset-y-0 left-0 z-30 w-72 shrink-0 transition-transform duration-200 lg:relative lg:z-auto lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:hidden"
        } ${sidebarOpen ? "lg:block" : ""}`}
      >
        <SessionList
          sessions={sessions}
          activeSessionId={activeSessionId}
          language={language}
          onSelectSession={handleSelectSession}
          onNewConversation={handleNewConversation}
          onSessionDeleted={handleSessionDeleted}
          onClose={() => setSidebarOpen(false)}
        />
      </aside>

      {/* ── Main chat area ───────────────────────────────────────────────────── */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* ── Messages ──────────────────────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto bg-[#07070f] px-4 py-6 sm:px-6">
          {/* History toggle button — top-left of the message area */}
          <button
            type="button"
            onClick={() => setSidebarOpen((v) => !v)}
            title={sidebarOpen ? "Hide history" : "Conversation history"}
            className="mb-4 flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 text-xs text-slate-400 transition hover:bg-white/10 hover:text-white"
          >
            <History className="h-3.5 w-3.5" aria-hidden="true" />
            History
            {sessions.length > 0 && (
              <span className="rounded-full bg-emerald-500/20 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-300">
                {sessions.length}
              </span>
            )}
          </button>

          {ttsFallbackReason && (
            <div className="mb-4 flex items-start justify-between gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
              <p>
                Using browser voice — ElevenLabs unavailable. On the free plan,
                create a voice in{" "}
                <a
                  href="https://elevenlabs.io/voice-lab"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline hover:text-amber-100"
                >
                  Voice Lab
                </a>
                , copy its ID, and set <code className="rounded bg-white/10 px-1">ELEVENLABS_VOICE_ES</code> in{" "}
                <code className="rounded bg-white/10 px-1">.env.local</code>.
              </p>
              <button
                type="button"
                onClick={clearTtsFallback}
                className="shrink-0 text-amber-400 hover:text-amber-200"
                aria-label="Dismiss"
              >
                ×
              </button>
            </div>
          )}

          {loadingSession ? (
            <div className="flex h-64 items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
            </div>
          ) : showSuggestions ? (
            <div className="flex h-full flex-col items-center justify-center gap-6 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 shadow-lg shadow-cyan-500/30">
                <Bot className="h-8 w-8 text-white" aria-hidden="true" />
              </div>
              <div>
                <p className="text-lg font-semibold text-white">
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
                    className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-sm font-medium text-emerald-300 transition hover:bg-emerald-500/20"
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
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-white shadow-sm ${isUser ? "bg-gradient-to-br from-emerald-500 to-teal-600" : "bg-gradient-to-br from-cyan-600 to-blue-700"}`}
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
                            ? "rounded-br-sm bg-gradient-to-br from-emerald-500 to-teal-600 text-white"
                            : "rounded-bl-sm border border-white/10 bg-white/8 text-slate-200"
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

        {/* ── Listening overlay ────────────────────────────────────────────── */}
        {isListening && (
          <div className="border-t border-red-500/20 bg-red-500/10 px-4 py-3 sm:px-6">
            <div className="mx-auto flex max-w-2xl items-center gap-3">
              <span className="flex shrink-0 gap-1" aria-hidden="true">
                <span className="h-2 w-2 animate-bounce rounded-full bg-red-400 [animation-delay:0ms]" />
                <span className="h-2 w-2 animate-bounce rounded-full bg-red-400 [animation-delay:150ms]" />
                <span className="h-2 w-2 animate-bounce rounded-full bg-red-400 [animation-delay:300ms]" />
              </span>
              <p className={`flex-1 text-sm ${interimText ? "text-red-300" : "italic text-red-400"}`}>
                {interimText || "Listening…"}
              </p>
              <span className="text-xs text-red-400">tap mic to stop</span>
            </div>
          </div>
        )}

        {/* ── Input bar ───────────────────────────────────────────────────── */}
        <div className="border-t border-white/8 bg-[#0d0d1e] px-4 py-4 sm:px-6">
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
              className="flex-1 resize-none rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-slate-500 outline-none transition focus:border-emerald-500/50 focus:bg-white/8 focus:ring-2 focus:ring-emerald-500/20 disabled:opacity-60"
              style={{ maxHeight: "120px" }}
            />

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

            {actionButton}
          </form>

          <p className="mx-auto mt-2 max-w-2xl text-center text-xs text-slate-400">
            {voiceSupported ? (
              <>
                <kbd className="rounded border border-slate-600 px-1 font-mono">Enter</kbd> to send ·{" "}
                <kbd className="rounded border border-slate-600 px-1 font-mono">Shift+Enter</kbd> for new line · mic for voice
              </>
            ) : (
              <>
                Press <kbd className="rounded border border-slate-600 px-1 font-mono">Enter</kbd> to send ·{" "}
                <kbd className="rounded border border-slate-600 px-1 font-mono">Shift+Enter</kbd> for new line
              </>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}
