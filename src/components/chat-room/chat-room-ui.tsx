"use client";

import { useState, useEffect, useRef, useCallback, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Send, Users, Wifi, WifiOff, Clock, ArrowLeft, X } from "lucide-react";
import { useChatRoom, type CurrentUser } from "@/hooks/use-chat-room";
import { closeChatRoom } from "@/app/actions/chat-room";
import type { ChatRoom, ChatRoomMessage } from "@/lib/supabase/types";

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

function useCountdown(expiresAt: string) {
  const [secsLeft, setSecsLeft] = useState(() =>
    Math.max(0, Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000)),
  );

  useEffect(() => {
    const interval = setInterval(() => {
      setSecsLeft(Math.max(0, Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000)));
    }, 1000);
    return () => clearInterval(interval);
  }, [expiresAt]);

  const h = Math.floor(secsLeft / 3600);
  const m = Math.floor((secsLeft % 3600) / 60);
  const s = secsLeft % 60;

  let label: string;
  if (secsLeft === 0) label = "Ended";
  else if (h > 0) label = `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  else label = `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;

  return { secsLeft, label, hasEnded: secsLeft === 0 };
}

const TOPIC_COLORS: Record<string, string> = {
  "Free Conversation": "bg-emerald-500/20 text-emerald-300",
  "Travel & Places": "bg-blue-500/20 text-blue-300",
  "Food & Cooking": "bg-orange-500/20 text-orange-300",
  "Movies & TV": "bg-purple-500/20 text-purple-300",
  "Music": "bg-pink-500/20 text-pink-300",
  "Sports": "bg-cyan-500/20 text-cyan-300",
  "Technology": "bg-indigo-500/20 text-indigo-300",
  "Books & Literature": "bg-amber-500/20 text-amber-300",
  "Current Events": "bg-red-500/20 text-red-300",
  "Daily Life": "bg-teal-500/20 text-teal-300",
};

function topicColor(topic: string): string {
  return TOPIC_COLORS[topic] ?? "bg-slate-500/20 text-slate-300";
}

const LANG_FLAG: Record<string, string> = { es: "🇪🇸", fr: "🇫🇷" };

// ── Message bubble ──────────────────────────────────────────────────────────

function MessageBubble({ msg, isOwn }: { msg: ChatRoomMessage; isOwn: boolean }) {
  const gradient = avatarGradient(msg.user_id);
  const abbr = initials(msg.display_name);

  return (
    <div className={`flex items-end gap-2.5 ${isOwn ? "flex-row-reverse" : "flex-row"}`}>
      <div
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br text-xs font-bold text-white shadow-md ${gradient}`}
        title={msg.display_name}
        aria-hidden="true"
      >
        {abbr}
      </div>

      <div className={`flex max-w-[75%] flex-col gap-1 ${isOwn ? "items-end" : "items-start"}`}>
        {!isOwn && (
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-semibold text-slate-300">{msg.display_name}</span>
            <span className="rounded-md bg-emerald-500/20 px-1.5 py-0.5 text-[10px] font-bold text-emerald-400">
              {msg.cefr_level}
            </span>
          </div>
        )}
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
  room: ChatRoom;
  currentUser: CurrentUser;
  initialMessages: ChatRoomMessage[];
  isHost: boolean;
};

export function ChatRoomUI({ room, currentUser, initialMessages, isHost }: Props) {
  const router = useRouter();
  const [isPendingClose, startClose] = useTransition();

  const { messages, onlineCount, send, isSending, isConnected, sendError, clearSendError } =
    useChatRoom(room.id, currentUser, initialMessages);

  const { secsLeft, label: countdownLabel, hasEnded } = useCountdown(room.expires_at);
  const isUrgent = secsLeft > 0 && secsLeft <= 300; // last 5 minutes

  const [draft, setDraft] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isAtBottomRef = useRef(true);

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
    if (!draft.trim() || hasEnded) return;
    const ok = await send(draft);
    if (!ok) return;
    setDraft("");
    isAtBottomRef.current = true;
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [draft, send, hasEnded]);

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void handleSend();
    }
  }

  function handleCloseRoom() {
    startClose(async () => {
      await closeChatRoom(room.id);
      router.push("/chat-room");
    });
  }

  const flag = LANG_FLAG[room.language] ?? "💬";

  return (
    <div className="flex h-full flex-col">
      {/* ── Room header ─────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-3 border-b border-white/8 bg-white/3 px-4 py-3">
        {/* Left: back + room info */}
        <div className="flex min-w-0 items-center gap-3">
          <button
            type="button"
            onClick={() => router.push("/chat-room")}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-slate-400 transition hover:bg-white/10 hover:text-white"
            aria-label="Back to rooms"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          </button>
          <span className="text-xl" aria-hidden="true">{flag}</span>
          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-white">{room.name}</p>
            <div className="flex items-center gap-1.5">
              <span
                className={`rounded-md px-1.5 py-0.5 text-[10px] font-semibold ${topicColor(room.topic)}`}
              >
                {room.topic}
              </span>
              <span className="rounded-md bg-violet-500/20 px-1.5 py-0.5 text-[10px] font-bold text-violet-300">
                {room.cefr_level}
              </span>
            </div>
          </div>
        </div>

        {/* Right: stats + countdown + controls */}
        <div className="flex shrink-0 items-center gap-2">
          <div className="flex items-center gap-1.5 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-2 py-1">
            <Users className="h-3 w-3 text-emerald-400" aria-hidden="true" />
            <span className="text-xs font-semibold text-emerald-400">
              {onlineCount}/{room.max_members}
            </span>
          </div>

          <div
            className={`flex items-center gap-1 rounded-xl border px-2 py-1 text-xs font-bold ${
              hasEnded
                ? "border-slate-600/30 bg-slate-600/10 text-slate-500"
                : isUrgent
                  ? "border-amber-500/30 bg-amber-500/10 text-amber-400"
                  : "border-slate-600/20 bg-white/3 text-slate-400"
            }`}
          >
            <Clock className="h-3 w-3" aria-hidden="true" />
            {countdownLabel}
          </div>

          <div
            className={`flex items-center gap-1 text-xs ${isConnected ? "text-emerald-400" : "text-amber-400"}`}
            title={isConnected ? "Connected" : "Connecting…"}
          >
            {isConnected ? (
              <Wifi className="h-3.5 w-3.5" aria-hidden="true" />
            ) : (
              <WifiOff className="h-3.5 w-3.5" aria-hidden="true" />
            )}
          </div>

          {isHost && !hasEnded && (
            <button
              type="button"
              onClick={handleCloseRoom}
              disabled={isPendingClose}
              title="Close this room"
              className="flex h-7 items-center gap-1 rounded-xl border border-red-500/30 bg-red-500/10 px-2.5 text-xs font-semibold text-red-400 transition hover:bg-red-500/20 disabled:opacity-50"
            >
              <X className="h-3 w-3" aria-hidden="true" />
              Close
            </button>
          )}
        </div>
      </div>

      {/* ── Ended banner ────────────────────────────────────────────────── */}
      {hasEnded && (
        <div className="flex items-center justify-between gap-3 border-b border-amber-500/20 bg-amber-500/10 px-4 py-2.5">
          <p className="text-sm font-semibold text-amber-300">
            This room has ended. Messages are read-only.
          </p>
          <button
            type="button"
            onClick={() => router.push("/chat-room")}
            className="rounded-xl bg-amber-500/20 px-3 py-1 text-xs font-bold text-amber-300 transition hover:bg-amber-500/30"
          >
            Browse Rooms
          </button>
        </div>
      )}

      {/* ── Messages ────────────────────────────────────────────────────── */}
      <div
        className="flex-1 overflow-y-auto px-4 py-5"
        onScroll={handleScroll}
        aria-label="Chat messages"
      >
        {messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
            <span className="text-4xl" aria-hidden="true">{flag}</span>
            <p className="text-lg font-bold text-white">Start the conversation!</p>
            <p className="max-w-xs text-sm text-slate-400">
              Topic: <span className="text-white">{room.topic}</span>
            </p>
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

      {/* ── Input bar ───────────────────────────────────────────────────── */}
      {!hasEnded && (
        <div className="border-t border-white/8 bg-[#0d0d1e] px-4 py-4">
          {sendError && (
            <div className="mx-auto mb-3 flex max-w-3xl items-center justify-between gap-3 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm text-red-200">
              <p>{sendError}</p>
              <button
                type="button"
                onClick={clearSendError}
                className="shrink-0 text-red-300/80 transition hover:text-red-100"
                aria-label="Dismiss"
              >
                ×
              </button>
            </div>
          )}
          <div className="mx-auto flex max-w-3xl items-end gap-2">
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={handleKeyDown}
              rows={1}
              maxLength={500}
              placeholder={`Message the room…`}
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
            <kbd className="rounded border border-slate-700 px-1 font-mono">Enter</kbd>{" "}
            to send · Shift+Enter for newline
          </p>
        </div>
      )}
    </div>
  );
}
