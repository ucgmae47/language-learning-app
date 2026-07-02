import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { ChatRoomUI } from "@/components/chat-room/chat-room-ui";
import type { ChatRoomMessage, Language, Profile, LanguageProfile } from "@/lib/supabase/types";

const INITIAL_MESSAGE_LIMIT = 60;

export default async function ChatRoomPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const [profileResult, langProfileResult, messagesResult] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).single<Profile>(),
    supabase
      .from("language_profiles")
      .select("*")
      .eq("user_id", user.id)
      .limit(1)
      .returns<LanguageProfile[]>(),
    // Initial messages are fetched server-side; Realtime delivers the rest.
    supabase
      .from("chat_room_messages")
      .select("*")
      .order("created_at", { ascending: true })
      .limit(INITIAL_MESSAGE_LIMIT)
      .returns<ChatRoomMessage[]>(),
  ]);

  const profile = profileResult.data;
  const language: Language = profile?.language ?? "es";
  const displayName =
    profile?.display_name ?? user.user_metadata?.display_name ?? "Learner";
  const cefrLevel =
    langProfileResult.data?.[0]?.cefr_level ??
    profile?.cefr_level ??
    "A1";

  // Filter initial messages by the user's active language.
  const initialMessages = (messagesResult.data ?? []).filter(
    (m) => m.language === language,
  );

  const currentUser = {
    id: user.id,
    displayName,
    cefrLevel,
  };

  return (
    <div className="flex h-screen flex-col bg-[#07070f]">
      {/* ── Page header ──────────────────────────────────────────────────── */}
      <header className="flex items-center justify-between border-b border-white/8 bg-gradient-to-r from-[#0d0d1e] to-[#12122a] px-6 py-4">
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard"
            className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-300 transition hover:bg-white/10 hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Dashboard
          </Link>

          <div className="flex items-center gap-2">
            <span className="text-2xl" aria-hidden="true">👥</span>
            <div>
              <h1 className="text-lg font-extrabold leading-none text-white">
                Language Chat Room
              </h1>
              <p className="text-xs text-slate-400">
                Live practice with other learners
              </p>
            </div>
          </div>
        </div>

        <div className="text-sm text-slate-400">
          Signed in as{" "}
          <span className="font-semibold text-emerald-400">{displayName}</span>
        </div>
      </header>

      {/* ── Chat UI fills remaining height ───────────────────────────────── */}
      <main className="min-h-0 flex-1">
        <ChatRoomUI
          language={language}
          currentUser={currentUser}
          initialMessages={initialMessages}
        />
      </main>
    </div>
  );
}
