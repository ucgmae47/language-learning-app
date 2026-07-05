"use client";

import { useState, useTransition } from "react";
import { MessageSquare, Plus, Trash2, X } from "lucide-react";
import { deleteChatSession } from "@/app/actions/chat-history";
import type { ChatSession, Language } from "@/lib/supabase/types";

const LANG_FLAG: Record<Language, string> = { es: "🇪🇸", fr: "🇫🇷" };

function relativeDate(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

type Props = {
  sessions: ChatSession[];
  activeSessionId: string | null;
  language: Language;
  onSelectSession: (session: ChatSession) => void;
  onNewConversation: () => void;
  onSessionDeleted: (sessionId: string) => void;
  onClose: () => void;
};

export function SessionList({
  sessions,
  activeSessionId,
  language,
  onSelectSession,
  onNewConversation,
  onSessionDeleted,
  onClose,
}: Props) {
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [, startTransition] = useTransition();
  // Keep `language` referenced to avoid an unused-vars warning for now.
  void language;

  function handleDelete(e: React.MouseEvent, session: ChatSession) {
    e.stopPropagation();
    setDeletingId(session.id);
    startTransition(async () => {
      await deleteChatSession(session.id);
      onSessionDeleted(session.id);
      setDeletingId(null);
    });
  }

  return (
    <div className="flex h-full flex-col bg-[#0a0a18]">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/8 px-4 py-3">
        <span className="text-sm font-semibold text-slate-200">Conversations</span>
        <button
          type="button"
          onClick={onClose}
          className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 transition hover:bg-white/8 hover:text-white"
          aria-label="Close history panel"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* New conversation button */}
      <div className="px-3 py-2">
        <button
          type="button"
          onClick={onNewConversation}
          className="flex w-full items-center gap-2.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-2.5 text-sm font-semibold text-emerald-300 transition hover:bg-emerald-500/20"
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          New conversation
        </button>
      </div>

      {/* Session list */}
      <div className="flex-1 overflow-y-auto px-2 pb-4">
        {sessions.length === 0 ? (
          <div className="flex flex-col items-center gap-3 px-4 py-10 text-center">
            <MessageSquare className="h-8 w-8 text-slate-600" />
            <p className="text-sm text-slate-500">
              No saved conversations yet. Start chatting and your history will appear here.
            </p>
          </div>
        ) : (
          <ul className="flex flex-col gap-0.5">
            {sessions.map((session) => {
              const isActive = session.id === activeSessionId;
              return (
                <li key={session.id}>
                  <button
                    type="button"
                    onClick={() => onSelectSession(session)}
                    className={`group flex w-full items-start gap-2.5 rounded-xl px-3 py-2.5 text-left transition ${
                      isActive
                        ? "bg-white/10 text-white"
                        : "text-slate-300 hover:bg-white/6 hover:text-white"
                    }`}
                  >
                    <span className="mt-0.5 text-base" aria-hidden="true">
                      {LANG_FLAG[session.language as Language]}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium leading-5">
                        {session.title}
                      </p>
                      <p className="mt-0.5 text-xs text-slate-500">
                        {session.message_count} msg{session.message_count !== 1 ? "s" : ""} ·{" "}
                        {relativeDate(session.last_message_at)}
                      </p>
                    </div>
                    {/* Delete button — appears on hover */}
                    <button
                      type="button"
                      onClick={(e) => handleDelete(e, session)}
                      disabled={deletingId === session.id}
                      className="mt-0.5 hidden h-6 w-6 shrink-0 items-center justify-center rounded-lg text-slate-500 transition hover:bg-red-500/20 hover:text-red-400 group-hover:flex disabled:opacity-40"
                      aria-label="Delete conversation"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
