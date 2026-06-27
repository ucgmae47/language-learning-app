"use client";

import { useEffect, useRef } from "react";
import { Send, Square, Bot, User } from "lucide-react";
import type { CefrLevel } from "@/lib/supabase/types";
import { useStreamingChat } from "@/hooks/use-streaming-chat";

type Props = {
  displayName: string;
  cefrLevel: CefrLevel;
  starters: string[];
};

export function ChatInterface({ displayName, cefrLevel, starters }: Props) {
  const { messages, input, setInput, sendMessage, append, stop, isLoading } =
    useStreamingChat("/api/chat");

  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const showSuggestions = messages.length === 0;

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

  return (
    <div className="flex h-full flex-col">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6 sm:px-6">
        {showSuggestions ? (
          <div className="flex h-full flex-col items-center justify-center gap-6 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-100">
              <Bot className="h-8 w-8 text-emerald-700" aria-hidden="true" />
            </div>
            <div>
              <p className="text-lg font-semibold text-slate-900">
                ¡Hola, {displayName}! Soy Lucía.
              </p>
              <p className="mt-1 text-sm text-slate-500">
                Your Spanish conversation partner. Start typing or pick a
                prompt below.
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

                  <div
                    className={`max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-6 shadow-sm ${
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
                </div>
              );
            })}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      {/* Input bar */}
      <div className="border-t border-slate-200 bg-white px-4 py-4 sm:px-6">
        <form
          onSubmit={handleSubmit}
          className="mx-auto flex max-w-2xl items-end gap-3"
        >
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={1}
            placeholder="Escribe un mensaje…"
            disabled={isLoading}
            className="flex-1 resize-none rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-900 placeholder-slate-400 outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 disabled:opacity-60"
            style={{ maxHeight: "120px" }}
          />

          {isLoading ? (
            <button
              type="button"
              onClick={stop}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-slate-300 bg-white text-slate-600 transition hover:border-red-300 hover:text-red-600"
              aria-label="Stop generating"
            >
              <Square className="h-4 w-4" aria-hidden="true" />
            </button>
          ) : (
            <button
              type="submit"
              disabled={!input.trim()}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-white shadow-sm transition hover:bg-emerald-700 disabled:opacity-40"
              aria-label="Send message"
            >
              <Send className="h-4 w-4" aria-hidden="true" />
            </button>
          )}
        </form>
        <p className="mx-auto mt-2 max-w-2xl text-center text-xs text-slate-400">
          Press{" "}
          <kbd className="rounded border border-slate-200 px-1 font-mono">
            Enter
          </kbd>{" "}
          to send ·{" "}
          <kbd className="rounded border border-slate-200 px-1 font-mono">
            Shift+Enter
          </kbd>{" "}
          for new line
        </p>
      </div>
    </div>
  );
}
