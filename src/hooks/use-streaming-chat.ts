"use client";

import { useState, useCallback, useRef } from "react";

export type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

let idCounter = 0;
function nextId() {
  return `msg-${Date.now()}-${++idCounter}`;
}

export function useStreamingChat(api: string) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

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
          // Try to extract a JSON error message from the body
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
          // Unexpected response format — surface the body as an error
          const text = await res.text();
          throw new Error(text || `Unexpected response type: ${contentType}`);
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });
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
              ? { ...m, content: "Sorry, something went wrong. Please try again." }
              : m,
          ),
        );
      } finally {
        setIsLoading(false);
        abortRef.current = null;
      }
    },
    [api, messages, isLoading],
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
  };
}
