"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { createClient } from "@/lib/supabase/browser";
import type { RealtimeChannel } from "@supabase/supabase-js";
import type { PictionaryPlayer } from "@/app/actions/pictionary";

export type RoomStatus = "lobby" | "playing" | "game_over";

export type PictionaryRoomState = {
  code: string;
  hostId: string;
  language: "es" | "fr";
  status: RoomStatus;
  players: PictionaryPlayer[];
  round: number;
  totalRounds: number;
  drawerUserId: string | null;
  wordBlanks: string | null;
  wordLength: number | null;
  wordHint: string | null;   // revealed after round / correct guess
  roundEndsAt: string | null;
  scores: Record<string, number>;
};

export type DrawSegment = {
  type: "segment";
  points: { x: number; y: number }[];
  color: string;
  size: number;
  isEnd: boolean;
};

export type GuessEvent = {
  type: "guess";
  userId: string;
  displayName: string;
  text: string;
  correct: boolean;
};

export type SystemEvent = {
  type: "system";
  text: string;
};

export type ChatLine = GuessEvent | SystemEvent;

type BroadcastPayload = { event: string; payload: unknown };

export function usePictionary(
  roomCode: string,
  currentUserId: string,
  initialRoom: PictionaryRoomState,
  myWord: string | null,
) {
  const [room, setRoom] = useState<PictionaryRoomState>(initialRoom);
  const [myCurrentWord, setMyCurrentWord] = useState<string | null>(myWord);
  const [chatLines, setChatLines] = useState<ChatLine[]>([]);
  const [onlineIds, setOnlineIds] = useState<Set<string>>(new Set([currentUserId]));
  const channelRef = useRef<RealtimeChannel | null>(null);
  const drawCallbacks = useRef<((seg: DrawSegment) => void)[]>([]);
  const clearCallbacks = useRef<(() => void)[]>([]);

  const supabase = createClient();

  // Subscribe to room state via postgres_changes + realtime broadcast
  useEffect(() => {
    const channel = supabase
      .channel(`pictionary:${roomCode}`)
      // ── Presence (online players) ──
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState<{ userId: string }>();
        const ids = new Set(Object.values(state).flat().map((p) => p.userId));
        setOnlineIds(ids);
      })
      // ── Room state changes ──
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "pictionary_rooms",
          filter: `code=eq.${roomCode}`,
        },
        (payload) => {
          const r = payload.new as Record<string, unknown>;
          setRoom({
            code: r.code as string,
            hostId: r.host_id as string,
            language: r.language as "es" | "fr",
            status: r.status as RoomStatus,
            players: (r.players as PictionaryPlayer[]) ?? [],
            round: r.round as number,
            totalRounds: r.total_rounds as number,
            drawerUserId: r.current_drawer_id as string | null,
            wordBlanks: r.word_blanks as string | null,
            wordLength: r.word_length as number | null,
            wordHint: r.word_hint as string | null,
            roundEndsAt: r.round_ends_at as string | null,
            scores: (r.scores as Record<string, number>) ?? {},
          });
          // If a new round started and I'm the drawer, fetch my word
          if (r.status === "playing" && r.current_drawer_id === currentUserId) {
            supabase
              .from("pictionary_secrets")
              .select("word")
              .eq("room_code", roomCode)
              .single()
              .then(({ data }) => {
                if (data) setMyCurrentWord(data.word);
              });
          }
          if (r.status !== "playing") setMyCurrentWord(null);
        },
      )
      // ── Draw events (broadcast) ──
      .on("broadcast", { event: "draw" }, ({ payload }: BroadcastPayload) => {
        const seg = payload as DrawSegment;
        drawCallbacks.current.forEach((cb) => cb(seg));
      })
      // ── Clear canvas ──
      .on("broadcast", { event: "clear" }, () => {
        clearCallbacks.current.forEach((cb) => cb());
      })
      // ── Guess events ──
      .on("broadcast", { event: "guess" }, ({ payload }: BroadcastPayload) => {
        const g = payload as GuessEvent;
        setChatLines((prev) => [...prev.slice(-99), g]);
      })
      // ── System messages ──
      .on("broadcast", { event: "system" }, ({ payload }: BroadcastPayload) => {
        const s = payload as SystemEvent;
        setChatLines((prev) => [...prev.slice(-99), s]);
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          await channel.track({ userId: currentUserId });
        }
      });

    channelRef.current = channel;
    return () => { supabase.removeChannel(channel); };
  }, [roomCode, currentUserId, supabase]);

  // ── Broadcast helpers ─────────────────────────────────────────────────────

  const broadcastDraw = useCallback((seg: DrawSegment) => {
    channelRef.current?.send({ type: "broadcast", event: "draw", payload: seg });
  }, []);

  const broadcastClear = useCallback(() => {
    channelRef.current?.send({ type: "broadcast", event: "clear", payload: {} });
  }, []);

  const broadcastGuess = useCallback((line: GuessEvent) => {
    channelRef.current?.send({ type: "broadcast", event: "guess", payload: line });
  }, []);

  const broadcastSystem = useCallback((text: string) => {
    channelRef.current?.send({ type: "broadcast", event: "system", payload: { type: "system", text } });
  }, []);

  // ── Register canvas callbacks ─────────────────────────────────────────────

  const onDrawSegment = useCallback((cb: (seg: DrawSegment) => void) => {
    drawCallbacks.current.push(cb);
    return () => { drawCallbacks.current = drawCallbacks.current.filter((f) => f !== cb); };
  }, []);

  const onClearCanvas = useCallback((cb: () => void) => {
    clearCallbacks.current.push(cb);
    return () => { clearCallbacks.current = clearCallbacks.current.filter((f) => f !== cb); };
  }, []);

  return {
    room,
    myCurrentWord,
    chatLines,
    onlineIds,
    broadcastDraw,
    broadcastClear,
    broadcastGuess,
    broadcastSystem,
    onDrawSegment,
    onClearCanvas,
    setChatLines,
  };
}
