"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Send, Users, Wifi, WifiOff } from "lucide-react";
import { useChatRoom, type CurrentUser } from "@/hooks/use-chat-room";
import type { ChatRoomMessage, Language } from "@/lib/supabase/types";

// ── Helpers ─────────────────────────────────────────────────────────────────

const AVATAR_GRADIENTS = [
  "from-violet-500 to-purple-600",
  "from-rose-500 to-red-600",
  "from-amber-500 to-orange-600",
  "from-cyan-500 to-blue-600",
  "from-emerald-500 to-teal-600",
  "from-fuchsia-500 to-pink-600",
  "from-indigo-500 to-violet-600",
  "from-lime-500 to-green-600",
] as const;

function avatarGradient(userId: string): string {
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = (hash * 31 + userId.charCodeAt(i)) % AVATAR_GRADIENTS.length;
  }
  return AVATAR_GRADIENTS[hash] ?? AVATAR_GRADIENTS[0]!;
}

function initials(name: string): string {
  return name
    .split(" ")
    .slice(0, 2)
    .map((w) => (w[0] ?? "").toUpperCase())
    .join("");
}

function formatTime(iso: string): string {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

const LANG_META: Record<Language, { name: string; flag: string; hint: string }> = {
  es: { name: "Spanish Room", flag: "🇪🇸", hint: "Practice in Spanish — all levels welcome!" },
  fr: { name: "French Room", flag: "🇫🇷", hint: "Pratiquez en français — tous niveaux bienvenus!" },
};

// ── Message bubble ──────────────────────────────────────────────────────────

function MessageBubble({
  msg,
  isOwn,
}: {
  msg: ChatRoomMessage;
  isOwn: boolean;
}) {
  const gradient = avatarGradient(msg.user_id);
  const abbr = initials(msg.display_name);

  return (
    <div className={`flex items-end gap-2.5 ${isOwn ? "flex-row-reverse" : "flex-row"}`}>
      {/* Avatar */}
      <div
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br text-xs font-bold text-white shadow-md ${gradient}`}
        title={msg.display_name}
        aria-hidden="true"
      >
        {abbr}
      </div>

      <div className={`flex max-w-[75%] flex-col gap-1 ${isOwn ? "items-end" : "items-start"}`}>
        {/* Name + CEFR badge */}
        {!isOwn && (
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-semibold text-slate-300">{msg.display_name}</span>
            <span className="rounded-md bg-emerald-500/20 px-1.5 py-0.5 text-[10px] font-bold text-emerald-400">
              {msg.cefr_level}
            </span>
          </div>
        )}

        {/* Message bubble */}
        <div
          className={`rounded-2xl px-4 py-2.5 text-sm leading-6 shadow-sm ${
            isOwn
              ? "rounded-br-sm bg-gradient-to-br from-emerald-500 to-teal-600 text-white"
              : "rounded-bl-sm border border-white/10 bg-white/8 text-slate-200"
          }`}
        >
          {msg.content}
        </div>

        <span className="text-[10px] text-slate-600">{formatTime(msg.created_at)}</span>
      </div>
    </div>
  );
}

// ── Main component ──────────────────────────────────────────────────────────

type Props = {
  language: Language;
  currentUser: CurrentUser;
  initialMessages: ChatRoomMessage[];
};

export function ChatRoomUI({ language, currentUser, initialMessages }: Props) {
  const { messages, onlineCount, send, isSending, isConnected } = useChatRoom(
    language,
    currentUser,
    initialMessages,
  );

  const [draft, setDraft] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isAtBottomRef = useRef(true);

  const meta = LANG_META[language];

  // Auto-scroll only when user is already at the bottom
  useEffect(() => {
    if (isAtBottomRef.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  function handleScroll(e: React.UIEvent<HTMLDivElement>) {
    const el = e.currentTarget;
    isAtBottomRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < 60;
  }

  const handleSend = useCallback(async () => {
    if (!draft.trim()) return;
    await send(draft);
    setDraft("");
    // Always scroll to bottom after sending your own message
    isAtBottomRef.current = true;
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [draft, send]);

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void handleSend();
    }
  }

  return (
    <div className="flex h-full flex-col" ref={bottomRef}>
      {/* ── Room header ──────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between border-b border-white/8 bg-white/3 px-4 py-2.5">
        <div className="flex items-center gap-2">
          <span className="text-xl" aria-hidden="true">{meta.flag}</span>
          <span className="text-sm font-bold text-white">{meta.name}</span>
        </div>

        <div className="flex items-center gap-3">
          {/* Online count */}
          <div className="flex items-center gap-1.5 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1">
            <Users className="h-3 w-3 text-emerald-400" aria-hidden="true" />
            <span className="text-xs font-semibold text-emerald-400">
              {onlineCount} online
            </span>
          </div>

          {/* Connection status dot */}
          <div
            className={`flex items-center gap-1 text-xs ${isConnected ? "text-emerald-400" : "text-amber-400"}`}
            title={isConnected ? "Connected" : "Connecting…"}
          >
            {isConnected ? (
              <Wifi className="h-3.5 w-3.5" aria-hidden="true" />
            ) : (
              <WifiOff className="h-3.5 w-3.5" aria-hidden="true" />
            )}
            <span className="hidden sm:inline">{isConnected ? "Live" : "Connecting…"}</span>
          </div>
        </div>
      </div>

      {/* ── Messages ─────────────────────────────────────────────────────── */}
      <div
        className="flex-1 overflow-y-auto px-4 py-5"
        onScroll={handleScroll}
        aria-label="Chat messages"
      >
        {messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
            <span className="text-5xl" aria-hidden="true">{meta.flag}</span>
            <p className="text-lg font-bold text-white">Start the conversation!</p>
            <p className="max-w-xs text-sm text-slate-400">{meta.hint}</p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {messages.map((msg) => (
              <MessageBubble
                key={msg.id}
                msg={msg}
                isOwn={msg.user_id === currentUser.id}
              />
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* ── Input bar ────────────────────────────────────────────────────── */}
      <div className="border-t border-white/8 bg-[#0d0d1e] px-4 py-4">
        <div className="mx-auto flex max-w-3xl items-end gap-2">
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={1}
            maxLength={500}
            placeholder={`Message the ${meta.name}…`}
            disabled={isSending}
            className="flex-1 resize-none rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-slate-500 outline-none transition focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/20 disabled:opacity-60"
            style={{ maxHeight: "120px" }}
          />

          <button
            type="button"
            onClick={() => void handleSend()}
            disabled={!draft.trim() || isSending}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/30 transition hover:from-emerald-400 hover:to-teal-500 disabled:opacity-40"
            aria-label="Send message"
          >
            <Send className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        <p className="mx-auto mt-2 max-w-3xl text-center text-xs text-slate-600">
          {meta.hint} ·{" "}
          <kbd className="rounded border border-slate-700 px-1 font-mono">Enter</kbd> to send
        </p>
      </div>
    </div>
  );
}
