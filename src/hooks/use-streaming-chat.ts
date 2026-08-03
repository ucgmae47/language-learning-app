"use client";

import { useState, useCallback, useRef } from "react";
import { saveMessagePair } from "@/app/actions/chat-history";
import type { Language } from "@/lib/supabase/types";

export type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

let idCounter = 0;
function nextId() {
  return `msg-${Date.now()}-${++idCounter}`;
}

type UseStreamingChatOptions = {
  /** Pre-load messages from a saved session. */
  initialMessages?: ChatMessage[];
  /** Existing session ID to append to (loading a past conversation). */
  initialSessionId?: string | null;
  /** Active language — used when creating a new session row. */
  language?: Language;
  /** Called when a new session is created so the parent can add it to the list. */
  onSessionCreated?: (sessionId: string, title: string) => void;
  /** Called when persisting messages to the database fails. */
  onPersistError?: (message: string) => void;
};

export function useStreamingChat(
  api: string,
  options: UseStreamingChatOptions = {},
) {
  const { initialMessages, initialSessionId, language = "es", onSessionCreated, onPersistError } = options;

  const [messages, setMessages] = useState<ChatMessage[]>(
    initialMessages ?? [],
  );
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  // Tracks the active DB session ID.  null = no session yet (new conversation).
  const sessionIdRef = useRef<string | null>(initialSessionId ?? null);
  const firstMessageRef = useRef(!(initialMessages && initialMessages.length > 0));

  /** Reset to a fresh conversation (e.g. "New conversation" button clicked). */
  const reset = useCallback((newMessages: ChatMessage[] = [], newSessionId: string | null = null) => {
    setMessages(newMessages);
    sessionIdRef.current = newSessionId;
    firstMessageRef.current = newMessages.length === 0;
  }, []);

  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim() || isLoading) return;

      const userMessage: ChatMessage = {
        id: nextId(),
        role: "user",
        content: text,
      };

      const assistantMessage: ChatMessage = {
        id: nextId(),
        role: "assistant",
        content: "",
      };

      const nextMessages = [...messages, userMessage];
      setMessages([...nextMessages, assistantMessage]);
      setInput("");
      setIsLoading(true);

      const controller = new AbortController();
      abortRef.current = controller;

      let finalContent = "";

      try {
        const res = await fetch(api, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: nextMessages.map(({ role, content }) => ({
              role,
              content,
            })),
          }),
          signal: controller.signal,
        });

        if (!res.ok || !res.body) {
          let detail = `Server error (${res.status}).`;
          try {
            const errBody = (await res.json()) as { error?: string };
            if (errBody.error) detail = errBody.error;
          } catch {
            // body wasn't JSON — keep the generic message
          }
          throw new Error(detail);
        }

        const contentType = res.headers.get("content-type") ?? "";
        if (!contentType.includes("text/plain")) {
          const resText = await res.text();
          throw new Error(resText || `Unexpected response type: ${contentType}`);
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });
          finalContent += chunk;
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantMessage.id
                ? { ...m, content: m.content + chunk }
                : m,
            ),
          );
        }
      } catch (err) {
        if ((err as Error).name === "AbortError") return;
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantMessage.id
              ? {
                  ...m,
                  content: "Sorry, something went wrong. Please try again.",
                }
              : m,
          ),
        );
        return;
      } finally {
        setIsLoading(false);
        abortRef.current = null;
      }

      // ── Persist the exchange silently ──────────────────────────────────────
      // Fire-and-forget — doesn't block the UI.
      if (finalContent) {
        const isFirst = firstMessageRef.current;
        firstMessageRef.current = false;

        void (async () => {
          const { sessionId, error } = await saveMessagePair(
            sessionIdRef.current,
            language,
            text,
            finalContent,
          );
          if (!error && sessionId) {
            const prevSessionId = sessionIdRef.current;
            sessionIdRef.current = sessionId;
            // Notify parent when a brand-new session is created.
            if (isFirst && !prevSessionId && onSessionCreated) {
              onSessionCreated(
                sessionId,
                text.trim().slice(0, 60) + (text.trim().length > 60 ? "…" : ""),
              );
            }
          } else if (error) {
            console.error("[chat] saveMessagePair failed:", error);
            onPersistError?.(error);
          }
        })();
      }
    },
    [api, messages, isLoading, language, onSessionCreated, onPersistError],
  );

  const append = useCallback(
    (text: string) => {
      void sendMessage(text);
    },
    [sendMessage],
  );

  const stop = useCallback(() => {
    abortRef.current?.abort();
    setIsLoading(false);
  }, []);

  return {
    messages,
    input,
    setInput,
    sendMessage,
    append,
    stop,
    isLoading,
    reset,
  };
}
