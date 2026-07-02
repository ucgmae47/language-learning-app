"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { createClient } from "@/lib/supabase/browser";
import type { ChatRoomMessage, Language } from "@/lib/supabase/types";
import type { RealtimePostgresInsertPayload } from "@supabase/supabase-js";

export type CurrentUser = {
  id: string;
  displayName: string;
  cefrLevel: string;
};

export type UseChatRoomReturn = {
  messages: ChatRoomMessage[];
  onlineCount: number;
  send: (content: string) => Promise<void>;
  isSending: boolean;
  /** True after the Realtime channel is SUBSCRIBED. */
  isConnected: boolean;
};

const RATE_LIMIT_MS = 2000; // min ms between sends

export function useChatRoom(
  language: Language,
  currentUser: CurrentUser,
  initialMessages: ChatRoomMessage[],
): UseChatRoomReturn {
  const [messages, setMessages] = useState<ChatRoomMessage[]>(initialMessages);
  const [onlineCount, setOnlineCount] = useState(1);
  const [isSending, setIsSending] = useState(false);
  const [isConnected, setIsConnected] = useState(false);

  // Track IDs we've already displayed to avoid duplicates from Realtime.
  const knownIds = useRef<Set<string>>(new Set(initialMessages.map((m) => m.id)));
  const lastSendTime = useRef(0);

  useEffect(() => {
    const client = createClient();

    const channel = client.channel(`chat-room-${language}`, {
      config: { presence: { key: currentUser.id } },
    });

    // ── Presence: count learners in this room ─────────────────────────────
    channel.on("presence", { event: "sync" }, () => {
      const state = channel.presenceState<{ user_id: string }>();
      setOnlineCount(Math.max(1, Object.keys(state).length));
    });

    // ── Realtime: new messages ────────────────────────────────────────────
    channel.on<ChatRoomMessage>(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "chat_room_messages",
        filter: `language=eq.${language}`,
      },
      (payload: RealtimePostgresInsertPayload<ChatRoomMessage>) => {
        const msg = payload.new;
        if (knownIds.current.has(msg.id)) return;
        knownIds.current.add(msg.id);
        setMessages((prev) => [...prev, msg]);
      },
    );

    channel.subscribe(async (status) => {
      if (status === "SUBSCRIBED") {
        setIsConnected(true);
        await channel.track({
          user_id: currentUser.id,
          display_name: currentUser.displayName,
        });
      }
      if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
        setIsConnected(false);
      }
    });

    return () => {
      void client.removeChannel(channel);
      setIsConnected(false);
    };
  }, [language, currentUser.id, currentUser.displayName]);

  const send = useCallback(
    async (content: string) => {
      const trimmed = content.trim();
      if (!trimmed || isSending) return;

      // Client-side rate limiting
      const now = Date.now();
      if (now - lastSendTime.current < RATE_LIMIT_MS) return;
      lastSendTime.current = now;

      setIsSending(true);
      try {
        const client = createClient();
        await client.from("chat_room_messages").insert({
          user_id: currentUser.id,
          language,
          display_name: currentUser.displayName,
          cefr_level: currentUser.cefrLevel,
          content: trimmed,
        });
      } finally {
        setIsSending(false);
      }
    },
    [isSending, language, currentUser],
  );

  return { messages, onlineCount, send, isSending, isConnected };
}
