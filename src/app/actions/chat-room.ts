"use server";

import { createClient } from "@/lib/supabase/server";
import type { ChatRoom, Language } from "@/lib/supabase/types";

export type CreateRoomInput = {
  name: string;
  topic: string;
  cefr_level: string;
  max_members: number;
  duration_minutes: number;
};

export type CreateRoomResult = { error: string } | { roomId: string };

export async function createChatRoom(
  input: CreateRoomInput,
): Promise<CreateRoomResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { data: profile } = await supabase
    .from("profiles")
    .select("language, display_name")
    .eq("id", user.id)
    .single();

  if (!profile) return { error: "Profile not found" };

  const language: Language = profile.language ?? "es";
  const hostDisplayName = profile.display_name ?? "Learner";
  const durationMinutes = Math.min(Math.max(input.duration_minutes, 5), 60);
  const expiresAt = new Date(
    Date.now() + durationMinutes * 60 * 1000,
  ).toISOString();

  const { data, error } = await supabase
    .from("chat_rooms")
    .insert({
      host_id: user.id,
      language,
      name: input.name.trim(),
      topic: input.topic,
      cefr_level: input.cefr_level,
      max_members: input.max_members,
      expires_at: expiresAt,
      status: "active",
      host_display_name: hostDisplayName,
    })
    .select("id")
    .single();

  if (error) return { error: error.message };
  return { roomId: data.id };
}

export async function closeChatRoom(
  roomId: string,
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { error } = await supabase
    .from("chat_rooms")
    .update({ status: "closed" })
    .eq("id", roomId)
    .eq("host_id", user.id);

  if (error) return { error: error.message };
  return {};
}

export async function getActiveRooms(language: Language): Promise<ChatRoom[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("chat_rooms")
    .select("*")
    .eq("language", language)
    .eq("status", "active")
    .gt("expires_at", new Date().toISOString())
    .order("created_at", { ascending: false })
    .returns<ChatRoom[]>();

  return data ?? [];
}
