"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { ArrowLeft, Send, Trophy, Users, Clock } from "lucide-react";
import Link from "next/link";
import { DrawingCanvas } from "./drawing-canvas";
import { usePictionary } from "@/hooks/use-pictionary";
import {
  startPictionaryRound,
  endPictionaryRound,
  submitPictionaryGuess,
} from "@/app/actions/pictionary";
import type { PictionaryRoomState } from "@/hooks/use-pictionary";
import type { Language } from "@/lib/supabase/types";

const LANG_META: Record<Language, { name: string; flag: string }> = {
  es: { name: "Spanish", flag: "🇪🇸" },
  fr: { name: "French", flag: "🇫🇷" },
};

type Props = {
  initialRoom: PictionaryRoomState;
  currentUserId: string;
  currentDisplayName: string;
  initialMyWord: string | null;
};

export function PictionaryRoom({ initialRoom, currentUserId, currentDisplayName, initialMyWord }: Props) {
  const {
    room, myCurrentWord, chatLines, onlineIds,
    broadcastDraw, broadcastClear, broadcastGuess, broadcastSystem,
    onDrawSegment, onClearCanvas, setChatLines,
  } = usePictionary(initialRoom.code, currentUserId, initialRoom, initialMyWord);

  const [guessInput, setGuessInput] = useState("");
  const [timeLeft, setTimeLeft] = useState(0);
  const [drawColor, setDrawColor] = useState("#ffffff");
  const [drawSize, setDrawSize] = useState(6);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const isHost = room.hostId === currentUserId;
  const isDrawer = room.drawerUserId === currentUserId;
  const meta = LANG_META[room.language];

  // Auto-scroll chat
  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [chatLines]);

  // Round timer
  useEffect(() => {
    if (!room.roundEndsAt || room.status !== "playing") { setTimeLeft(0); return; }
    const update = () => {
      const secs = Math.max(0, Math.round((new Date(room.roundEndsAt!).getTime() - Date.now()) / 1000));
      setTimeLeft(secs);
      if (secs === 0 && isHost) {
        clearInterval(timerRef.current!);
        endPictionaryRound(room.code).then(() =>
          setChatLines((prev) => [...prev, { type: "system", text: `⏰ Time's up! The word was: ${room.wordHint ?? "?"}` }]),
        );
      }
    };
    update();
    timerRef.current = setInterval(update, 1000);
    return () => clearInterval(timerRef.current!);
  }, [room.roundEndsAt, room.status, isHost, room.code, room.wordHint, setChatLines]);

  const handleStartRound = useCallback(async () => {
    setIsSubmitting(true);
    await startPictionaryRound(room.code);
    broadcastSystem("🎨 A new round has started!");
    setIsSubmitting(false);
  }, [room.code, broadcastSystem]);

  const handleGuess = useCallback(async () => {
    const text = guessInput.trim();
    if (!text || isDrawer || room.status !== "playing") return;
    setGuessInput("");

    const { correct, word } = await submitPictionaryGuess(room.code, text);

    const line = {
      type: "guess" as const,
      userId: currentUserId,
      displayName: currentDisplayName,
      text,
      correct,
    };
    setChatLines((prev) => [...prev, line]);
    broadcastGuess(line);

    if (correct) {
      broadcastSystem(`🎉 ${currentDisplayName} guessed it! The word was: ${word}`);
    }
  }, [guessInput, isDrawer, room.status, room.code, currentUserId, currentDisplayName, setChatLines, broadcastGuess, broadcastSystem]);

  const playerName = (userId: string) =>
    room.players.find((p) => p.userId === userId)?.displayName ?? "Unknown";

  const sortedPlayers = [...room.players].sort(
    (a, b) => (room.scores[b.userId] ?? 0) - (room.scores[a.userId] ?? 0),
  );

  const timerColor = timeLeft <= 10 ? "text-rose-400" : timeLeft <= 20 ? "text-amber-400" : "text-emerald-400";

  return (
    <div className="flex min-h-screen flex-col bg-[#07070f]">
      {/* Header */}
      <header className="flex items-center justify-between border-b border-white/8 bg-gradient-to-r from-[#0d0d1e] to-[#12122a] px-6 py-3">
        <Link href="/gameroom/pictionary" className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-300 hover:text-white">
          <ArrowLeft className="h-4 w-4" /> Leave
        </Link>
        <div className="text-center">
          <p className="font-extrabold text-white">🎨 Pictionary</p>
          <p className="text-xs text-slate-400">{meta.flag} {meta.name} · Room <span className="font-mono text-white">{room.code}</span></p>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <Users className="h-3.5 w-3.5" />
          <span>{onlineIds.size}/{room.players.length}</span>
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-4 p-4 lg:flex-row lg:items-start">

        {/* ── Left: Canvas + word ─────────────────────────────────────────── */}
        <div className="flex flex-1 flex-col gap-3 min-w-0">
          {/* Word display */}
          {room.status === "playing" && (
            <div className="rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-center">
              {isDrawer && myCurrentWord ? (
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-fuchsia-400">Draw this word:</p>
                  <p className="text-3xl font-extrabold text-white">{myCurrentWord.toUpperCase()}</p>
                </div>
              ) : (
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-slate-400">
                    {playerName(room.drawerUserId ?? "")} is drawing…
                  </p>
                  <p className="font-mono text-2xl font-extrabold tracking-[0.25em] text-white">
                    {room.wordBlanks ?? ""}
                  </p>
                  <p className="text-xs text-slate-500">{room.wordLength} letters</p>
                </div>
              )}
            </div>
          )}

          {/* Timer */}
          {room.status === "playing" && (
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-slate-500" />
              <div className="flex-1 h-1.5 overflow-hidden rounded-full bg-white/8">
                <div
                  className={`h-full rounded-full transition-all duration-1000 ${timeLeft <= 10 ? "bg-rose-500" : timeLeft <= 20 ? "bg-amber-500" : "bg-emerald-500"}`}
                  style={{ width: `${(timeLeft / 60) * 100}%` }}
                />
              </div>
              <span className={`text-sm font-bold tabular-nums ${timerColor}`}>{timeLeft}s</span>
            </div>
          )}

          {/* Canvas */}
          <DrawingCanvas
            isDrawer={isDrawer && room.status === "playing"}
            onBroadcast={broadcastDraw}
            onClearBroadcast={broadcastClear}
            onDrawSegment={onDrawSegment}
            onClearCanvas={onClearCanvas}
            color={drawColor}
            size={drawSize}
            onColorChange={setDrawColor}
            onSizeChange={setDrawSize}
          />

          {/* Round info / lobby */}
          {room.status === "lobby" && (
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5 text-center">
              {room.round === 0 ? (
                <>
                  <p className="text-sm text-slate-400 mb-3">
                    {room.players.length < 2 ? "Waiting for at least 2 players…" : "Everyone ready? Start when you are!"}
                  </p>
                  {isHost && room.players.length >= 2 && (
                    <button type="button" onClick={handleStartRound} disabled={isSubmitting} className="rounded-2xl bg-gradient-to-r from-fuchsia-500 to-pink-600 px-6 py-3 font-bold text-white disabled:opacity-50 hover:opacity-90">
                      🎨 Start Game
                    </button>
                  )}
                  {!isHost && (
                    <p className="text-slate-500 text-sm">Waiting for host to start…</p>
                  )}
                </>
              ) : room.round < room.totalRounds ? (
                <>
                  <p className="text-sm font-bold text-white">Round {room.round} over!</p>
                  {room.wordHint && <p className="text-slate-400 text-sm">The word was: <span className="text-white font-bold">{room.wordHint}</span></p>}
                  {isHost && (
                    <button type="button" onClick={handleStartRound} disabled={isSubmitting} className="mt-3 rounded-2xl bg-gradient-to-r from-fuchsia-500 to-pink-600 px-6 py-3 font-bold text-white disabled:opacity-50 hover:opacity-90">
                      ▶ Next Round
                    </button>
                  )}
                  {!isHost && <p className="mt-3 text-slate-500 text-sm">Waiting for host…</p>}
                </>
              ) : null}
            </div>
          )}

          {room.status === "game_over" && (
            <div className="rounded-2xl border border-fuchsia-500/30 bg-fuchsia-500/10 p-5 text-center">
              <p className="text-xl font-extrabold text-white mb-1">🏆 Game Over!</p>
              <p className="text-slate-400 text-sm">Final scores above →</p>
              {isHost && (
                <button type="button" onClick={handleStartRound} disabled={isSubmitting} className="mt-3 rounded-2xl border border-white/10 bg-white/5 px-5 py-2.5 text-sm font-semibold text-slate-300 hover:text-white">
                  Play again
                </button>
              )}
            </div>
          )}
        </div>

        {/* ── Right: Players + Chat ───────────────────────────────────────── */}
        <div className="flex w-full flex-col gap-3 lg:w-72">
          {/* Scores */}
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <p className="mb-3 flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-slate-400">
              <Trophy className="h-3.5 w-3.5" /> Scores · Round {room.round}/{room.totalRounds}
            </p>
            <div className="flex flex-col gap-1.5">
              {sortedPlayers.map((p, i) => (
                <div key={p.userId} className={`flex items-center gap-2 rounded-xl px-3 py-2 ${p.userId === currentUserId ? "bg-fuchsia-500/15 border border-fuchsia-500/30" : "bg-white/4"}`}>
                  <span className="text-sm">{["🥇", "🥈", "🥉"][i] ?? "🏅"}</span>
                  <span className={`flex-1 truncate text-sm font-semibold ${onlineIds.has(p.userId) ? "text-white" : "text-slate-500"}`}>
                    {p.displayName}
                    {p.userId === room.drawerUserId && room.status === "playing" && <span className="ml-1 text-fuchsia-400">✏️</span>}
                  </span>
                  <span className="text-sm font-extrabold text-amber-400">{room.scores[p.userId] ?? 0}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Chat / guesses */}
          <div className="flex flex-1 flex-col rounded-2xl border border-white/10 bg-white/5 overflow-hidden" style={{ minHeight: "240px", maxHeight: "320px" }}>
            <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
              {chatLines.length === 0 && (
                <p className="text-center text-xs text-slate-600 mt-8">Guesses appear here…</p>
              )}
              {chatLines.map((line, i) => (
                <div key={i}>
                  {line.type === "system" ? (
                    <p className="text-center text-xs text-slate-500 italic">{line.text}</p>
                  ) : (
                    <div className={`rounded-xl px-3 py-1.5 text-sm ${line.correct ? "bg-emerald-500/20 border border-emerald-500/30" : "bg-white/4"}`}>
                      <span className={`font-bold ${line.userId === currentUserId ? "text-fuchsia-400" : "text-slate-300"}`}>{line.displayName}: </span>
                      <span className={line.correct ? "text-emerald-300 font-semibold" : "text-slate-400"}>{line.text}</span>
                      {line.correct && <span className="ml-1">✅</span>}
                    </div>
                  )}
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>
            {!isDrawer && room.status === "playing" && (
              <div className="flex gap-2 border-t border-white/8 p-2">
                <input
                  type="text"
                  value={guessInput}
                  onChange={(e) => setGuessInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleGuess()}
                  placeholder={`Guess in ${meta.name}…`}
                  autoComplete="off"
                  autoCorrect="off"
                  spellCheck={false}
                  className="flex-1 rounded-xl bg-white/8 px-3 py-2 text-sm text-white placeholder-slate-600 outline-none focus:ring-1 focus:ring-fuchsia-500/30"
                />
                <button type="button" onClick={handleGuess} disabled={!guessInput.trim()} className="flex h-9 w-9 items-center justify-center rounded-xl bg-fuchsia-500 text-white disabled:opacity-40">
                  <Send className="h-4 w-4" />
                </button>
              </div>
            )}
            {isDrawer && room.status === "playing" && (
              <div className="border-t border-white/8 px-3 py-2 text-center text-xs text-slate-500">
                You're the artist — keep drawing! 🎨
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
