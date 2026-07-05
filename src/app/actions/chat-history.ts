"use server";

import { createClient } from "@/lib/supabase/server";
import type { ChatSession, Language, TutorMessage } from "@/lib/supabase/types";

/**
 * Saves a user + assistant message pair to the database.
 *
 * - If sessionId is null, creates a new session (title = first 60 chars of
 *   the user message).
 * - Returns the session ID so the client can track it for subsequent pairs.
 */
export async function saveMessagePair(
  sessionId: string | null,
  language: Language,
  userContent: string,
  assistantContent: string,
): Promise<{ sessionId: string | null; error?: string }> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { sessionId: null, error: "Not authenticated." };

  let sid = sessionId;

  // ── Create session on first message ───────────────────────────────────────
  if (!sid) {
    const title =
      userContent.trim().slice(0, 60) +
      (userContent.trim().length > 60 ? "…" : "");

    const { data: session, error: sessionErr } = await supabase
      .from("chat_sessions")
      .insert({
        user_id: user.id,
        language,
        title: title || "New conversation",
      })
      .select("id")
      .single<Pick<ChatSession, "id">>();

    if (sessionErr || !session) {
      return { sessionId: null, error: sessionErr?.message ?? "Failed to create session." };
    }
    sid = session.id;
  }

  // ── Insert both messages ───────────────────────────────────────────────────
  const { error: msgErr } = await supabase.from("chat_messages").insert([
    { session_id: sid, user_id: user.id, role: "user", content: userContent },
    { session_id: sid, user_id: user.id, role: "assistant", content: assistantContent },
  ]);

  if (msgErr) return { sessionId: sid, error: msgErr.message };

  // ── Update session metadata ────────────────────────────────────────────────
  await supabase
    .from("chat_sessions")
    .update({
      last_message_at: new Date().toISOString(),
      message_count: (
        await supabase
          .from("chat_messages")
          .select("id", { count: "exact", head: true })
          .eq("session_id", sid)
      ).count ?? 0,
    })
    .eq("id", sid);

  return { sessionId: sid };
}

/** Returns all saved sessions for the current user + language, newest first. */
export async function getChatSessions(
  language: Language,
): Promise<ChatSession[]> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data } = await supabase
    .from("chat_sessions")
    .select("*")
    .eq("user_id", user.id)
    .eq("language", language)
    .order("last_message_at", { ascending: false })
    .limit(40)
    .returns<ChatSession[]>();

  return data ?? [];
}

/** Returns all messages for a session (oldest first) after verifying ownership. */
export async function getSessionMessages(
  sessionId: string,
): Promise<TutorMessage[]> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data } = await supabase
    .from("chat_messages")
    .select("*")
    .eq("session_id", sessionId)
    .eq("user_id", user.id)
    .order("created_at", { ascending: true })
    .returns<TutorMessage[]>();

  return data ?? [];
}

/** Deletes a session (and all its messages via cascade) after verifying ownership. */
export async function deleteChatSession(sessionId: string): Promise<{ error?: string }> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated." };

  const { error } = await supabase
    .from("chat_sessions")
    .delete()
    .eq("id", sessionId)
    .eq("user_id", user.id);

  if (error) return { error: error.message };
  return {};
}
