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
  PanelLeftOpen,
  PanelLeftClose,
} from "lucide-react";
import type { CefrLevel, ChatSession, Language, TutorMessage } from "@/lib/supabase/types";
import { useStreamingChat, type ChatMessage } from "@/hooks/use-streaming-chat";
import { useVoiceChat } from "@/hooks/use-voice-chat";
import { SessionList } from "@/components/chat/session-list";
import { getSessionMessages } from "@/app/actions/chat-history";
import { useChatSidebar } from "@/hooks/use-chat-sidebar";

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
  const { isDesktop, isOpen: sidebarOpen, hydrated, close: closeSidebar, toggle: toggleSidebar } =
    useChatSidebar();
  const [loadingSession, setLoadingSession] = useState(false);
  const [persistError, setPersistError] = useState<string | null>(null);
  // Keep `cefrLevel` referenced to avoid an unused-vars warning while it's
  // currently unused in the UI; it may be surfaced in future iterations.
  void cefrLevel;

  // ── Streaming chat ──────────────────────────────────────────────────────────
  const { messages, input, setInput, sendMessage, append, stop, isLoading, reset } =
    useStreamingChat("/api/chat", {
      initialMessages: initialMessages ? tutorToChat(initialMessages) : undefined,
      initialSessionId: initialSessionId ?? null,
      language,
      onSessionCreated: (sessionId, title) => {
        setActiveSessionId(sessionId);
        setPersistError(null);
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
      onPersistError: (message) => {
        setPersistError(message);
      },
    });

  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const lastSpokenIdRef = useRef<string | null>(null);
  const speakInFlightRef = useRef<string | null>(null);

  const [revealedIds, setRevealedIds] = useState<Set<string>>(() => {
    const ids = new Set<string>();
    for (const msg of initialMessages ?? []) {
      if (msg.role === "assistant") ids.add(msg.id);
    }
    return ids;
  });
  const [preparingAudioId, setPreparingAudioId] = useState<string | null>(null);

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
    speakWhenReady,
    isSpeaking,
    stopSpeaking,
    ttsFallbackReason,
    clearTtsFallback,
  } = useVoiceChat({
    lang: LANG_BCP47[language],
    onFinalTranscript: handleFinalTranscript,
  });

  // ── Reveal + speak each completed AI response in sync ───────────────────────
  useEffect(() => {
    if (isLoading) return;

    const lastMsg = messages[messages.length - 1];
    if (!lastMsg || lastMsg.role !== "assistant" || !lastMsg.content.trim()) return;
    if (revealedIds.has(lastMsg.id)) return;
    if (lastMsg.id === lastSpokenIdRef.current) return;
    if (speakInFlightRef.current === lastMsg.id) return;

    lastSpokenIdRef.current = lastMsg.id;
    speakInFlightRef.current = lastMsg.id;
    setPreparingAudioId(lastMsg.id);

    let cancelled = false;

    void speakWhenReady(lastMsg.content, () => {
      if (cancelled) return;
      setRevealedIds((prev) => new Set(prev).add(lastMsg.id));
      setPreparingAudioId(null);
    }).finally(() => {
      if (speakInFlightRef.current === lastMsg.id) {
        speakInFlightRef.current = null;
      }
      if (!cancelled) setPreparingAudioId(null);
    });

    return () => {
      cancelled = true;
    };
  }, [isLoading, messages, revealedIds, speakWhenReady]);

  // ── Scroll to bottom ────────────────────────────────────────────────────────
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, interimText, preparingAudioId]);

  // ── Session switching ───────────────────────────────────────────────────────
  async function handleSelectSession(session: ChatSession) {
    if (session.id === activeSessionId) {
      closeSidebar();
      return;
    }
    setLoadingSession(true);
    const msgs = await getSessionMessages(session.id);
    reset(tutorToChat(msgs), session.id);
    setActiveSessionId(session.id);
    setRevealedIds(
      new Set(msgs.filter((m) => m.role === "assistant").map((m) => m.id)),
    );
    lastSpokenIdRef.current = null;
    speakInFlightRef.current = null;
    setPreparingAudioId(null);
    setLoadingSession(false);
    closeSidebar();
  }

  function handleNewConversation() {
    reset([], null);
    setActiveSessionId(null);
    setRevealedIds(new Set());
    lastSpokenIdRef.current = null;
    speakInFlightRef.current = null;
    setPreparingAudioId(null);
    closeSidebar();
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
    <div className="relative h-full overflow-hidden">
      {/* Mobile drawer + backdrop */}
      {hydrated && !isDesktop && (
        <>
          {sidebarOpen && (
            <div
              className="absolute inset-0 z-20 bg-black/60 backdrop-blur-sm"
              onClick={closeSidebar}
              aria-hidden="true"
            />
          )}
          <aside
            className={`absolute inset-y-0 left-0 z-30 w-72 overflow-hidden border-r border-white/8 bg-[#0a0a18] shadow-2xl transition-transform duration-300 ease-in-out ${
              sidebarOpen ? "translate-x-0" : "-translate-x-full pointer-events-none"
            }`}
            aria-label="Chat history"
            aria-hidden={!sidebarOpen}
          >
            <div className="h-full w-72">
              <SessionList
                sessions={sessions}
                activeSessionId={activeSessionId}
                language={language}
                onSelectSession={handleSelectSession}
                onNewConversation={handleNewConversation}
                onSessionDeleted={handleSessionDeleted}
              />
            </div>
          </aside>
        </>
      )}

      {/* Desktop: grid collapses column to 0; mobile: single full-width column */}
      <div
        className="grid h-full overflow-hidden transition-[grid-template-columns] duration-300 ease-in-out"
        style={{
          gridTemplateColumns:
            hydrated && isDesktop
              ? sidebarOpen
                ? "18rem 1fr"
                : "0rem 1fr"
              : "1fr",
        }}
      >
        {(!hydrated || isDesktop) && (
          <aside
            className="min-w-0 overflow-hidden border-r border-white/8 bg-[#0a0a18]"
            aria-label="Chat history"
            aria-hidden={hydrated ? !sidebarOpen : false}
          >
            {(sidebarOpen || !hydrated) && (
              <div className="h-full w-72">
                <SessionList
                  sessions={sessions}
                  activeSessionId={activeSessionId}
                  language={language}
                  onSelectSession={handleSelectSession}
                  onNewConversation={handleNewConversation}
                  onSessionDeleted={handleSessionDeleted}
                />
              </div>
            )}
          </aside>
        )}

        {/* Main chat area */}
        <div className="relative flex min-h-0 min-w-0 flex-col overflow-hidden">
          {/* Toolbar — z-50 keeps toggle above mobile backdrop */}
          <div className="relative z-50 flex shrink-0 items-center gap-2 border-b border-white/8 bg-[#07070f] px-4 py-2 sm:px-6">
            <button
              type="button"
              onClick={toggleSidebar}
              title={sidebarOpen ? "Hide chat history" : "Show chat history"}
              aria-label={sidebarOpen ? "Hide chat history" : "Show chat history"}
              aria-expanded={sidebarOpen}
              className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 transition hover:bg-white/8 hover:text-white"
            >
              {sidebarOpen ? (
                <PanelLeftClose className="h-4 w-4" aria-hidden="true" />
              ) : (
                <PanelLeftOpen className="h-4 w-4" aria-hidden="true" />
              )}
            </button>
            {!sidebarOpen && sessions.length > 0 && (
              <span className="text-xs text-slate-500">
                {sessions.length} saved chat{sessions.length !== 1 ? "s" : ""}
              </span>
            )}
          </div>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain bg-[#07070f] px-4 py-6 sm:px-6">
          {persistError && (
            <div className="mb-4 flex items-start justify-between gap-3 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
              <p>Could not save this chat: {persistError}</p>
              <button
                type="button"
                onClick={() => setPersistError(null)}
                className="shrink-0 text-red-300/80 transition hover:text-red-100"
                aria-label="Dismiss"
              >
                ×
              </button>
            </div>
          )}
          {ttsFallbackReason && (
            <div className="mb-4 flex items-start justify-between gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
              <p>{ttsFallbackReason}</p>
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
            <div className="flex min-h-full flex-col items-center justify-center gap-6 text-center">
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
                const isAssistant = msg.role === "assistant";
                const isVisible = isUser || revealedIds.has(msg.id);
                const showTyping =
                  isAssistant &&
                  !isVisible &&
                  (isLoading || preparingAudioId === msg.id);

                if (isAssistant && !isVisible && !showTyping) return null;

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
                        {showTyping ? (
                          <span className="flex gap-1">
                            <span className="h-2 w-2 animate-bounce rounded-full bg-slate-300 [animation-delay:0ms]" />
                            <span className="h-2 w-2 animate-bounce rounded-full bg-slate-300 [animation-delay:150ms]" />
                            <span className="h-2 w-2 animate-bounce rounded-full bg-slate-300 [animation-delay:300ms]" />
                          </span>
                        ) : (
                          msg.content
                        )}
                      </div>

                      {!isUser && voiceSupported && msg.content && isVisible && !isLoading && (
                        <button
                          type="button"
                          onClick={() => void speak(msg.content)}
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
          <div className="shrink-0 border-t border-red-500/20 bg-red-500/10 px-4 py-3 sm:px-6">
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

        {/* Input bar */}
        <div className="shrink-0 border-t border-white/8 bg-[#0d0d1e] px-4 py-4 sm:px-6">
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
    </div>
  );
}
