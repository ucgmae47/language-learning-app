import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PictionaryRoom } from "@/components/games/pictionary/pictionary-room";
import type { PictionaryRoomState } from "@/hooks/use-pictionary";
import type { PictionaryPlayer } from "@/app/actions/pictionary";

export default async function PictionaryRoomPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, cefr_level")
    .eq("id", user.id)
    .single();

  const { data: room } = await supabase
    .from("pictionary_rooms")
    .select("*")
    .eq("code", code.toUpperCase())
    .single();

  if (!room) notFound();

  // Ensure this user is in the players list (they may have joined via the lobby)
  const players: PictionaryPlayer[] = room.players ?? [];
  const isInRoom = players.some((p: PictionaryPlayer) => p.userId === user.id);
  if (!isInRoom) redirect(`/gameroom/pictionary?code=${code.toUpperCase()}`);

  // If this user is the current drawer, fetch their word
  let myWord: string | null = null;
  if (room.current_drawer_id === user.id && room.status === "playing") {
    const { data: secret } = await supabase
      .from("pictionary_secrets")
      .select("word")
      .eq("room_code", code.toUpperCase())
      .single();
    myWord = secret?.word ?? null;
  }

  const initialRoom: PictionaryRoomState = {
    code: room.code,
    hostId: room.host_id,
    language: room.language,
    status: room.status,
    players: room.players ?? [],
    round: room.round ?? 0,
    totalRounds: room.total_rounds ?? 5,
    drawerUserId: room.current_drawer_id ?? null,
    wordBlanks: room.word_blanks ?? null,
    wordLength: room.word_length ?? null,
    wordHint: room.word_hint ?? null,
    roundEndsAt: room.round_ends_at ?? null,
    scores: room.scores ?? {},
  };

  return (
    <PictionaryRoom
      initialRoom={initialRoom}
      currentUserId={user.id}
      currentDisplayName={profile?.display_name ?? "Player"}
      initialMyWord={myWord}
    />
  );
}
