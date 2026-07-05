import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { RoomBrowser } from "@/components/chat-room/room-browser";
import { getActiveRooms } from "@/app/actions/chat-room";
import type { Language, Profile } from "@/lib/supabase/types";

export default async function ChatRoomPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single<Profile>();

  const language: Language = profile?.language ?? "es";
  const displayName =
    profile?.display_name ?? user.user_metadata?.display_name ?? "Learner";

  const initialRooms = await getActiveRooms(language);

  return (
    <div className="flex min-h-screen flex-col bg-[#07070f]">
      {/* Page header */}
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
            <span className="text-2xl" aria-hidden="true">💬</span>
            <div>
              <h1 className="text-lg font-extrabold leading-none text-white">
                Chat Rooms
              </h1>
              <p className="text-xs text-slate-400">
                Live language practice with other learners
              </p>
            </div>
          </div>
        </div>

        <div className="text-sm text-slate-400">
          Signed in as{" "}
          <span className="font-semibold text-emerald-400">{displayName}</span>
        </div>
      </header>

      <main className="flex-1">
        <RoomBrowser
          language={language}
          initialRooms={initialRooms}
          displayName={displayName}
        />
      </main>
    </div>
  );
}
