"use client";

import Link from "next/link";
import { ArrowLeft, Wifi } from "lucide-react";
import { useScrollLock } from "@/hooks/use-scroll-lock";
import { ChatInterface } from "@/components/chat/chat-interface";
import type { CefrLevel, ChatSession, Language, TutorMessage } from "@/lib/supabase/types";

type Props = {
  tutorName: string;
  cefrLevel: CefrLevel;
  interests: string[];
  displayName: string;
  language: Language;
  starters: string[];
  sessions: ChatSession[];
  initialMessages?: TutorMessage[];
  initialSessionId?: string | null;
};

export function ChatPageShell({
  tutorName,
  cefrLevel,
  interests,
  displayName,
  language,
  starters,
  sessions,
  initialMessages,
  initialSessionId,
}: Props) {
  useScrollLock();

  return (
    <div className="fixed inset-0 z-[60] flex flex-col overflow-hidden bg-[#07070f]">
      <header className="shrink-0 border-b border-white/8 bg-[#07070f]/80 backdrop-blur-md">
        <div className="flex h-14 items-center gap-4 px-4 sm:h-16 sm:px-6">
          <Link
            href="/dashboard"
            className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-300 transition hover:bg-white/10 hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Dashboard
          </Link>

          <div className="flex flex-1 items-center justify-center gap-3">
            <div className="flex flex-col items-center">
              <p className="text-sm font-bold text-white">{tutorName}</p>
              <div className="flex items-center gap-1">
                <Wifi className="h-3 w-3 text-emerald-400" aria-hidden="true" />
                <span className="text-xs text-emerald-400">Online</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="rounded-xl bg-cyan-500/20 px-2.5 py-0.5 text-xs font-bold text-cyan-300">
              {cefrLevel}
            </span>
            {interests.length > 0 && (
              <span className="hidden text-xs text-slate-500 sm:block">
                {interests.slice(0, 2).join(", ")}
              </span>
            )}
          </div>
        </div>
      </header>

      <div className="min-h-0 flex-1 overflow-hidden">
        <ChatInterface
          displayName={displayName}
          tutorName={tutorName}
          cefrLevel={cefrLevel}
          language={language}
          starters={starters}
          initialSessions={sessions}
          initialMessages={initialMessages}
          initialSessionId={initialSessionId}
        />
      </div>
    </div>
  );
}
