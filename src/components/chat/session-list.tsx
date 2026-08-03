"use client";

import { useState, useTransition } from "react";
import { MessageSquare, Plus, Trash2 } from "lucide-react";
import { deleteChatSession } from "@/app/actions/chat-history";
import type { ChatSession, Language } from "@/lib/supabase/types";

const LANG_FLAG: Record<Language, string> = { es: "🇪🇸", fr: "🇫🇷" };

function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

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

function groupSessions(sessions: ChatSession[]) {
  const today = startOfDay(new Date());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const weekAgo = new Date(today);
  weekAgo.setDate(weekAgo.getDate() - 7);

  const groups: { label: string; sessions: ChatSession[] }[] = [
    { label: "Today", sessions: [] },
    { label: "Yesterday", sessions: [] },
    { label: "Previous 7 days", sessions: [] },
    { label: "Older", sessions: [] },
  ];

  for (const session of sessions) {
    const day = startOfDay(new Date(session.last_message_at));
    if (day >= today) groups[0]!.sessions.push(session);
    else if (day >= yesterday) groups[1]!.sessions.push(session);
    else if (day >= weekAgo) groups[2]!.sessions.push(session);
    else groups[3]!.sessions.push(session);
  }

  return groups.filter((g) => g.sessions.length > 0);
}

type Props = {
  sessions: ChatSession[];
  activeSessionId: string | null;
  language: Language;
  onSelectSession: (session: ChatSession) => void;
  onNewConversation: () => void;
  onSessionDeleted: (sessionId: string) => void;
};

export function SessionList({
  sessions,
  activeSessionId,
  language,
  onSelectSession,
  onNewConversation,
  onSessionDeleted,
}: Props) {
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [, startTransition] = useTransition();
  void language;

  const grouped = groupSessions(sessions);

  function handleDelete(e: React.MouseEvent, session: ChatSession) {
    e.stopPropagation();
    setDeletingId(session.id);
    setDeleteError(null);
    startTransition(async () => {
      const { error } = await deleteChatSession(session.id);
      if (error) {
        setDeleteError(error);
        setDeletingId(null);
        return;
      }
      onSessionDeleted(session.id);
      setDeletingId(null);
    });
  }

  return (
    <div className="flex h-full flex-col bg-[#0a0a18]">
      <div className="border-b border-white/8 px-3 py-3">
        <span className="text-sm font-semibold text-slate-200">Chats</span>
      </div>

      <div className="px-3 py-3">
        <button
          type="button"
          onClick={onNewConversation}
          className="flex w-full items-center gap-2.5 rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm font-medium text-slate-200 transition hover:border-emerald-500/30 hover:bg-emerald-500/10 hover:text-emerald-200"
        >
          <Plus className="h-4 w-4 shrink-0" aria-hidden="true" />
          New chat
        </button>
        {deleteError && (
          <p className="mt-2 px-1 text-xs text-red-400">{deleteError}</p>
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-2 pb-4">
        {sessions.length === 0 ? (
          <div className="flex flex-col items-center gap-3 px-4 py-10 text-center">
            <MessageSquare className="h-8 w-8 text-slate-600" />
            <p className="text-sm text-slate-500">
              No saved chats yet. Start a conversation and it will appear here.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {grouped.map((group) => (
              <section key={group.label}>
                <h3 className="mb-1 px-2 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                  {group.label}
                </h3>
                <ul className="flex flex-col gap-0.5">
                  {group.sessions.map((session) => {
                    const isActive = session.id === activeSessionId;
                    return (
                      <li
                        key={session.id}
                        className={`group flex items-start gap-1 rounded-xl transition ${
                          isActive ? "bg-white/10" : "hover:bg-white/6"
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() => onSelectSession(session)}
                          className={`min-w-0 flex-1 flex items-start gap-2 rounded-xl px-2.5 py-2 text-left transition ${
                            isActive
                              ? "text-white"
                              : "text-slate-300 hover:text-white"
                          }`}
                        >
                          <span className="mt-0.5 text-sm" aria-hidden="true">
                            {LANG_FLAG[session.language as Language]}
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm leading-5">{session.title}</p>
                            <p className="mt-0.5 text-[11px] text-slate-500">
                              {session.message_count} msg
                              {session.message_count !== 1 ? "s" : ""} ·{" "}
                              {relativeDate(session.last_message_at)}
                            </p>
                          </div>
                        </button>
                        <button
                          type="button"
                          onClick={(e) => handleDelete(e, session)}
                          disabled={deletingId === session.id}
                          className="mt-1.5 mr-1 hidden h-6 w-6 shrink-0 items-center justify-center rounded-lg text-slate-500 transition hover:bg-red-500/20 hover:text-red-400 group-hover:flex disabled:opacity-40"
                          aria-label="Delete chat"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </section>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
