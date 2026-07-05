"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Users, Plus, LogIn } from "lucide-react";
import Link from "next/link";
import { createPictionaryRoom, joinPictionaryRoom } from "@/app/actions/pictionary";
import type { Language } from "@/lib/supabase/types";

const LANG_META: Record<Language, { name: string; flag: string }> = {
  es: { name: "Spanish", flag: "🇪🇸" },
  fr: { name: "French", flag: "🇫🇷" },
};

export function PictionaryLobby({ language }: { language: Language }) {
  const meta = LANG_META[language];
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [joinCode, setJoinCode] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleCreate = () => {
    setError(null);
    startTransition(async () => {
      const result = await createPictionaryRoom(language);
      if ("error" in result) { setError(result.error); return; }
      router.push(`/gameroom/pictionary/${result.code}`);
    });
  };

  const handleJoin = () => {
    const code = joinCode.trim().toUpperCase();
    if (code.length !== 6) { setError("Room codes are 6 characters."); return; }
    setError(null);
    startTransition(async () => {
      const result = await joinPictionaryRoom(code);
      if ("error" in result) { setError(result.error); return; }
      router.push(`/gameroom/pictionary/${code}`);
    });
  };

  return (
    <div className="flex min-h-screen flex-col bg-[#07070f]">
      <header className="flex items-center gap-4 border-b border-white/8 bg-gradient-to-r from-[#0d0d1e] to-[#12122a] px-6 py-4">
        <Link href="/gameroom" className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-300 hover:text-white">
          <ArrowLeft className="h-4 w-4" /> Games
        </Link>
        <div>
          <h1 className="font-extrabold text-white">🎨 Pictionary</h1>
          <p className="text-xs text-slate-400">{meta.flag} {meta.name}</p>
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-md flex-col gap-6 px-6 py-12">
        <div className="text-center">
          <span className="text-6xl">🎨</span>
          <h2 className="mt-4 text-2xl font-extrabold text-white">Live Pictionary</h2>
          <p className="mt-2 text-slate-400">
            One player draws a {meta.name} word while everyone else guesses. First to guess correctly scores the most points!
          </p>
        </div>

        {error && (
          <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-400">
            {error}
          </div>
        )}

        {/* Create room */}
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <div className="mb-3 flex items-center gap-2">
            <Plus className="h-4 w-4 text-fuchsia-400" />
            <p className="font-bold text-white">Create a room</p>
          </div>
          <p className="mb-4 text-sm text-slate-400">You'll become the host. Share the room code with friends to invite them.</p>
          <button
            type="button"
            onClick={handleCreate}
            disabled={isPending}
            className="w-full rounded-2xl bg-gradient-to-r from-fuchsia-500 to-pink-600 py-3.5 font-bold text-white disabled:opacity-50 hover:opacity-90"
          >
            {isPending ? "Creating…" : "Create Room"}
          </button>
        </div>

        {/* Join room */}
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <div className="mb-3 flex items-center gap-2">
            <LogIn className="h-4 w-4 text-emerald-400" />
            <p className="font-bold text-white">Join a room</p>
          </div>
          <p className="mb-4 text-sm text-slate-400">Enter the 6-character room code shared by your friend.</p>
          <div className="flex gap-2">
            <input
              type="text"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase().slice(0, 6))}
              onKeyDown={(e) => e.key === "Enter" && handleJoin()}
              placeholder="XXXXXX"
              maxLength={6}
              className="flex-1 rounded-2xl border border-white/10 bg-white/8 px-4 py-3 text-center font-mono text-xl font-bold uppercase tracking-[0.3em] text-white placeholder-slate-600 outline-none focus:border-emerald-500/40 focus:ring-2 focus:ring-emerald-500/15"
            />
            <button
              type="button"
              onClick={handleJoin}
              disabled={isPending || joinCode.length < 6}
              className="rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 px-5 py-3 font-bold text-white disabled:opacity-40 hover:opacity-90"
            >
              <Users className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
