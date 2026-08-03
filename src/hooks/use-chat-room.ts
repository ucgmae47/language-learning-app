"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { createClient } from "@/lib/supabase/browser";
import type { ChatRoomMessage } from "@/lib/supabase/types";
import type { RealtimePostgresInsertPayload } from "@supabase/supabase-js";

export type CurrentUser = {
  id: string;
  displayName: string;
  cefrLevel: string;
};

export type UseChatRoomReturn = {
  messages: ChatRoomMessage[];
  onlineCount: number;
  send: (content: string) => Promise<boolean>;
  isSending: boolean;
  isConnected: boolean;
  sendError: string | null;
  clearSendError: () => void;
};

const RATE_LIMIT_MS = 2000;

export function useChatRoom(
  roomId: string,
  currentUser: CurrentUser,
  initialMessages: ChatRoomMessage[],
): UseChatRoomReturn {
  const [messages, setMessages] = useState<ChatRoomMessage[]>(initialMessages);
  const [onlineCount, setOnlineCount] = useState(1);
  const [isSending, setIsSending] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);

  const knownIds = useRef<Set<string>>(
    new Set(initialMessages.map((m) => m.id)),
  );
  const lastSendTime = useRef(0);

  useEffect(() => {
    const client = createClient();

    const channel = client.channel(`chat-room:${roomId}`, {
      config: { presence: { key: currentUser.id } },
    });

    channel.on("presence", { event: "sync" }, () => {
      const state = channel.presenceState<{ user_id: string }>();
      setOnlineCount(Math.max(1, Object.keys(state).length));
    });

    channel.on<ChatRoomMessage>(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "chat_room_messages",
        filter: `room_id=eq.${roomId}`,
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
  }, [roomId, currentUser.id, currentUser.displayName]);

  const send = useCallback(
    async (content: string) => {
      const trimmed = content.trim();
      if (!trimmed || isSending) return false;

      const now = Date.now();
      if (now - lastSendTime.current < RATE_LIMIT_MS) return false;
      lastSendTime.current = now;

      setIsSending(true);
      setSendError(null);
      try {
        const client = createClient();
        const { error } = await client.from("chat_room_messages").insert({
          room_id: roomId,
          user_id: currentUser.id,
          display_name: currentUser.displayName,
          cefr_level: currentUser.cefrLevel,
          content: trimmed,
        });
        if (error) {
          console.error("[chat-room] send failed:", error.message);
          setSendError("Message could not be sent. Please try again.");
          return false;
        }
        return true;
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Send failed";
        console.error("[chat-room] send threw:", msg);
        setSendError("Message could not be sent. Please try again.");
        return false;
      } finally {
        setIsSending(false);
      }
    },
    [isSending, roomId, currentUser],
  );

  return {
    messages,
    onlineCount,
    send,
    isSending,
    isConnected,
    sendError,
    clearSendError: () => setSendError(null),
  };
}
