"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Plus, Users, Clock, RefreshCw } from "lucide-react";
import { createClient } from "@/lib/supabase/browser";
import { CreateRoomDialog } from "@/components/chat-room/create-room-dialog";
import type { ChatRoom, Language } from "@/lib/supabase/types";
import type { RealtimePostgresChangesPayload } from "@supabase/supabase-js";

const LANG_META: Record<Language, { name: string; flag: string }> = {
  es: { name: "Spanish", flag: "🇪🇸" },
  fr: { name: "French", flag: "🇫🇷" },
};

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

function formatTimeLeft(expiresAt: string): { label: string; urgent: boolean } {
  const secs = Math.max(0, Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000));
  if (secs === 0) return { label: "Ended", urgent: true };
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  if (m >= 60) {
    const h = Math.floor(m / 60);
    return { label: `${h}h ${m % 60}m`, urgent: false };
  }
  if (m > 5) return { label: `${m}m left`, urgent: false };
  return { label: `${m}:${String(s).padStart(2, "0")} left`, urgent: true };
}

// ── Room card ────────────────────────────────────────────────────────────────

function RoomCard({ room }: { room: ChatRoom }) {
  const router = useRouter();
  const [timeLabel, setTimeLabel] = useState(() => formatTimeLeft(room.expires_at));

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLabel(formatTimeLeft(room.expires_at));
    }, 1000);
    return () => clearInterval(interval);
  }, [room.expires_at]);

  const hasEnded = timeLabel.label === "Ended";

  return (
    <div
      className={`group relative flex flex-col gap-3 overflow-hidden rounded-2xl border p-5 transition ${
        hasEnded
          ? "border-white/5 bg-white/2 opacity-50"
          : "border-white/10 bg-white/4 hover:border-white/20 hover:bg-white/6"
      }`}
    >
      {/* Top row */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <h3 className="truncate text-base font-extrabold text-white">{room.name}</h3>
          <p className="mt-0.5 text-xs text-slate-500">
            Host: <span className="text-slate-400">{room.host_display_name}</span>
          </p>
        </div>
        {/* CEFR badge */}
        <span className="shrink-0 rounded-lg bg-violet-500/20 px-2 py-0.5 text-xs font-bold text-violet-300">
          {room.cefr_level}
        </span>
      </div>

      {/* Topic */}
      <span
        className={`inline-block w-fit rounded-lg px-2.5 py-0.5 text-xs font-semibold ${topicColor(room.topic)}`}
      >
        {room.topic}
      </span>

      {/* Stats row */}
      <div className="flex items-center gap-4 text-xs text-slate-500">
        <span className="flex items-center gap-1">
          <Users className="h-3 w-3" aria-hidden="true" />
          Up to {room.max_members}
        </span>
        <span
          className={`flex items-center gap-1 font-semibold ${
            timeLabel.urgent ? "text-amber-400" : "text-slate-400"
          }`}
        >
          <Clock className="h-3 w-3" aria-hidden="true" />
          {timeLabel.label}
        </span>
      </div>

      {/* Join button */}
      {!hasEnded && (
        <button
          type="button"
          onClick={() => router.push(`/chat-room/${room.id}`)}
          className="mt-1 w-full rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 py-2 text-sm font-bold text-white shadow-md shadow-emerald-500/20 transition hover:from-emerald-400 hover:to-teal-500 active:scale-95"
        >
          Join Room
        </button>
      )}
    </div>
  );
}

// ── Main component ───────────────────────────────────────────────────────────

type Props = {
  language: Language;
  initialRooms: ChatRoom[];
  displayName: string;
};

export function RoomBrowser({ language, initialRooms, displayName }: Props) {
  const [rooms, setRooms] = useState<ChatRoom[]>(initialRooms);
  const [showCreate, setShowCreate] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const meta = LANG_META[language];

  const refresh = useCallback(async () => {
    setIsRefreshing(true);
    const client = createClient();
    const { data } = await client
      .from("chat_rooms")
      .select("*")
      .eq("language", language)
      .eq("status", "active")
      .gt("expires_at", new Date().toISOString())
      .order("created_at", { ascending: false })
      .returns<ChatRoom[]>();
    setRooms(data ?? []);
    setIsRefreshing(false);
  }, [language]);

  // Realtime: listen for new / closed rooms
  useEffect(() => {
    const client = createClient();
    const channel = client
      .channel("chat-rooms-browser")
      .on<ChatRoom>(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "chat_rooms",
          filter: `language=eq.${language}`,
        },
        (payload: RealtimePostgresChangesPayload<ChatRoom>) => {
          if (payload.eventType === "INSERT") {
            const newRoom = payload.new;
            if (newRoom.status === "active") {
              setRooms((prev) =>
                prev.some((r) => r.id === newRoom.id) ? prev : [newRoom, ...prev],
              );
            }
          } else if (payload.eventType === "UPDATE") {
            const updated = payload.new;
            setRooms((prev) =>
              updated.status !== "active"
                ? prev.filter((r) => r.id !== updated.id)
                : prev.map((r) => (r.id === updated.id ? updated : r)),
            );
          } else if (payload.eventType === "DELETE") {
            const deleted = payload.old as Partial<ChatRoom>;
            if (deleted.id) setRooms((prev) => prev.filter((r) => r.id !== deleted.id));
          }
        },
      )
      .subscribe();

    return () => {
      void client.removeChannel(channel);
    };
  }, [language]);

  const activeRooms = rooms.filter(
    (r) => r.status === "active" && new Date(r.expires_at) > new Date(),
  );

  return (
    <>
      {showCreate && <CreateRoomDialog onClose={() => setShowCreate(false)} />}

      <div className="mx-auto max-w-4xl px-4 py-6">
        {/* Browser header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-2xl" aria-hidden="true">{meta.flag}</span>
              <h2 className="text-xl font-extrabold text-white">
                {meta.name} Rooms
              </h2>
            </div>
            <p className="mt-0.5 text-sm text-slate-400">
              {activeRooms.length === 0
                ? "No active rooms — create one to get started!"
                : `${activeRooms.length} active room${activeRooms.length !== 1 ? "s" : ""}`}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={refresh}
              disabled={isRefreshing}
              title="Refresh rooms"
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-slate-400 transition hover:bg-white/10 hover:text-white disabled:opacity-40"
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={() => setShowCreate(true)}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 px-4 py-2 text-sm font-bold text-white shadow-lg shadow-emerald-500/30 transition hover:from-emerald-400 hover:to-teal-500 active:scale-95"
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
              New Room
            </button>
          </div>
        </div>

        {/* Room grid */}
        {activeRooms.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-white/10 py-20 text-center">
            <span className="text-5xl" aria-hidden="true">💬</span>
            <p className="text-lg font-bold text-white">No rooms open yet</p>
            <p className="max-w-xs text-sm text-slate-400">
              Be the first! Create a room and invite others to practice{" "}
              {meta.name} with you.
            </p>
            <button
              type="button"
              onClick={() => setShowCreate(true)}
              className="mt-2 flex items-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-emerald-500/30 transition hover:scale-105"
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
              Create a Room
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {activeRooms.map((room) => (
              <RoomCard key={room.id} room={room} />
            ))}
          </div>
        )}

        <p className="mt-6 text-center text-xs text-slate-600">
          Signed in as{" "}
          <span className="font-semibold text-slate-400">{displayName}</span> ·
          Rooms auto-close when their timer expires
        </p>
      </div>
    </>
  );
}
