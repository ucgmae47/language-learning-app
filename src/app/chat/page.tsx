import { redirect } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { ArrowLeft, Wifi } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { ChatInterface } from "@/components/chat/chat-interface";
import { generateChatStarters } from "@/lib/chat/generate-starters";
import type { CefrLevel, InterestTopic } from "@/lib/supabase/types";

export const metadata: Metadata = {
  title: "Chat Practice | LinguaPath",
  description: "Practice conversational Spanish with your AI tutor Lucía.",
};

export default async function ChatPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const [profileResult, interestsResult] = await Promise.all([
    supabase
      .from("profiles")
      .select("display_name, cefr_level")
      .eq("id", user.id)
      .single(),
    supabase
      .from("user_interests")
      .select("topic")
      .eq("user_id", user.id)
      .order("weight", { ascending: false })
      .limit(3),
  ]);

  const cefrLevel: CefrLevel = profileResult.data?.cefr_level ?? "B1";
  const displayName: string =
    profileResult.data?.display_name ??
    user.user_metadata?.display_name ??
    "Estudiante";
  const interests: string[] =
    interestsResult.data?.map(
      (r: { topic: InterestTopic }) => r.topic,
    ) ?? [];

  const starters = await generateChatStarters(displayName, cefrLevel, interests);

  return (
    <div className="flex h-screen flex-col bg-slate-50">
      {/* Header */}
      <header className="flex-none border-b border-slate-200 bg-white">
        <div className="mx-auto flex h-16 max-w-4xl items-center gap-4 px-4 sm:px-6">
          <Link
            href="/dashboard"
            className="flex items-center gap-1.5 text-sm text-slate-500 transition hover:text-slate-800"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Dashboard
          </Link>

          <div className="flex flex-1 items-center justify-center gap-3">
            <div className="flex flex-col items-center">
              <p className="text-sm font-semibold text-slate-900">Lucía</p>
              <div className="flex items-center gap-1">
                <Wifi className="h-3 w-3 text-emerald-500" aria-hidden="true" />
                <span className="text-xs text-emerald-600">Online</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-800">
              {cefrLevel}
            </span>
            {interests.length > 0 && (
              <span className="hidden text-xs text-slate-400 sm:block">
                {interests.slice(0, 2).join(", ")}
              </span>
            )}
          </div>
        </div>
      </header>

      {/* Chat fills remaining height */}
      <div className="flex-1 overflow-hidden">
        <ChatInterface displayName={displayName} cefrLevel={cefrLevel} starters={starters} />
      </div>
    </div>
  );
}
