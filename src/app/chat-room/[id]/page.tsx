import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ChatRoomUI } from "@/components/chat-room/chat-room-ui";
import type { ChatRoom, ChatRoomMessage, Profile, LanguageProfile } from "@/lib/supabase/types";

const INITIAL_MESSAGE_LIMIT = 60;

export default async function ChatRoomPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [roomResult, profileResult, langProfileResult, messagesResult] =
    await Promise.all([
      supabase
        .from("chat_rooms")
        .select("*")
        .eq("id", id)
        .single<ChatRoom>(),
      supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single<Profile>(),
      supabase
        .from("language_profiles")
        .select("*")
        .eq("user_id", user.id)
        .limit(1)
        .returns<LanguageProfile[]>(),
      supabase
        .from("chat_room_messages")
        .select("*")
        .eq("room_id", id)
        .order("created_at", { ascending: true })
        .limit(INITIAL_MESSAGE_LIMIT)
        .returns<ChatRoomMessage[]>(),
    ]);

  const room = roomResult.data;
  if (!room) notFound();

  // Redirect if room is closed
  if (room.status === "closed") {
    redirect("/chat-room");
  }

  const profile = profileResult.data;
  const displayName =
    profile?.display_name ?? user.user_metadata?.display_name ?? "Learner";
  const cefrLevel =
    langProfileResult.data?.[0]?.cefr_level ?? profile?.cefr_level ?? "A1";

  const currentUser = {
    id: user.id,
    displayName,
    cefrLevel,
  };

  const initialMessages = messagesResult.data ?? [];
  const isHost = room.host_id === user.id;

  return (
    <div className="flex h-screen flex-col bg-[#07070f]">
      <ChatRoomUI
        room={room}
        currentUser={currentUser}
        initialMessages={initialMessages}
        isHost={isHost}
      />
    </div>
  );
}
