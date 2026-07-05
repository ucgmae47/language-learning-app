import { after } from "next/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { ArrowLeft, Wifi } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { ChatInterface } from "@/components/chat/chat-interface";
import { generateChatStarters } from "@/lib/chat/generate-starters";
import { generateAndQueueStarters } from "@/lib/chat/queue";
import { getChatSessions, getSessionMessages } from "@/app/actions/chat-history";
import type { CefrLevel, InterestTopic, Language, QueuedChatStarters, TutorMessage } from "@/lib/supabase/types";

export const metadata: Metadata = {
  title: "Chat Practice | LinguaPath",
  description: "Practice conversational language skills with your AI tutor.",
};

const TUTOR_NAMES: Record<Language, string> = { es: "Lucía", fr: "Sophie" };

export default async function ChatPage({
  searchParams,
}: {
  searchParams: Promise<{ session?: string }>;
}) {
  const { session: sessionParam } = await searchParams;

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const [profileResult, interestsResult, queuedResult] = await Promise.all([
    supabase
      .from("profiles")
      .select("display_name, cefr_level, language")
      .eq("id", user.id)
      .single(),
    supabase
      .from("user_interests")
      .select("topic")
      .eq("user_id", user.id)
      .order("weight", { ascending: false })
      .limit(3),
    supabase
      .from("queued_chat_starters")
      .select("starters")
      .eq("user_id", user.id)
      .maybeSingle<Pick<QueuedChatStarters, "starters">>(),
  ]);

  const cefrLevel: CefrLevel = profileResult.data?.cefr_level ?? "B1";
  const language: Language = profileResult.data?.language ?? "es";
  const displayName: string =
    profileResult.data?.display_name ??
    user.user_metadata?.display_name ??
    "Learner";
  const interests: string[] =
    interestsResult.data?.map(
      (r: { topic: InterestTopic }) => r.topic,
    ) ?? [];

  // ── Fast-path: serve pre-queued starters (zero AI latency) ───────────────
  // We verify the language matches since the initial query above fetches by
  // user_id only and we now know the active language.
  let starters: string[];

  const queued = queuedResult.data;

  if (queued && Array.isArray(queued.starters) && queued.starters.length > 0) {
    // Serve the pre-generated starters immediately.
    starters = queued.starters as string[];

    // Delete the consumed row so the next visit generates a fresh set.
    // Fire-and-forget — non-blocking.
    void supabase
      .from("queued_chat_starters")
      .delete()
      .eq("user_id", user.id)
      .eq("language", language);
  } else {
    // No queued starters — generate on demand (falls back to static if quota hit).
    starters = await generateChatStarters(
      displayName,
      cefrLevel,
      interests,
      language,
    );
  }

  // ── Fetch sessions list + (optionally) load a saved session ─────────────
  const [sessions, sessionMessages] = await Promise.all([
    getChatSessions(language),
    sessionParam ? getSessionMessages(sessionParam) : Promise.resolve([] as TutorMessage[]),
  ]);

  const activeSessionId = sessionParam ?? null;

  // ── After response: pre-generate the next set silently ───────────────────
  const capturedUserId = user.id;
  const capturedLanguage = language;
  const capturedLevel = cefrLevel;
  const capturedName = displayName;

  after(async () => {
    await generateAndQueueStarters(
      capturedUserId,
      capturedLanguage,
      capturedLevel,
      capturedName,
    );
  });

  const tutorName = TUTOR_NAMES[language];

  return (
    <div className="flex h-screen flex-col bg-[#07070f]">
      {/* Header */}
      <header className="flex-none border-b border-white/8 bg-[#07070f]/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-4xl items-center gap-4 px-4 sm:px-6">
          <Link
            href="/dashboard"
            className="flex items-center gap-1.5 text-sm text-slate-400 transition hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Dashboard
          </Link>

          <div className="flex flex-1 items-center justify-center gap-3">
            <div className="flex flex-col items-center">
              <p className="text-sm font-bold text-white">{tutorName}</p>
              <div className="flex items-center gap-1">
                <Wifi className="h-3 w-3 text-emerald-400" aria-hidden="true" />
                <span className="text-xs text-emerald-400">Online</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="rounded-xl bg-cyan-500/20 px-2.5 py-0.5 text-xs font-bold text-cyan-300">
              {cefrLevel}
            </span>
            {interests.length > 0 && (
              <span className="hidden text-xs text-slate-500 sm:block">
                {interests.slice(0, 2).join(", ")}
              </span>
            )}
          </div>
        </div>
      </header>

      {/* Chat fills remaining height */}
      <div className="flex-1 overflow-hidden">
        <ChatInterface
          displayName={displayName}
          tutorName={tutorName}
          cefrLevel={cefrLevel}
          language={language}
          starters={starters}
          initialSessions={sessions}
          initialMessages={sessionMessages.length > 0 ? sessionMessages : undefined}
          initialSessionId={activeSessionId}
        />
      </div>
    </div>
  );
}
