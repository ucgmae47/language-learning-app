import { after } from "next/server";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { ChatPageShell } from "@/components/chat/chat-page-shell";
import { STARTER_SUGGESTIONS } from "@/lib/chat/system-prompt";
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

  const profileResult = await supabase
    .from("profiles")
    .select("display_name, cefr_level, language")
    .eq("id", user.id)
    .single();

  const cefrLevel: CefrLevel = profileResult.data?.cefr_level ?? "B1";
  const language: Language = profileResult.data?.language ?? "es";

  const [interestsResult, queuedResult] = await Promise.all([
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
      .eq("language", language)
      .maybeSingle<Pick<QueuedChatStarters, "starters">>(),
  ]);

  if (queuedResult.error) {
    console.error(
      "[chat] queued starters fetch failed:",
      queuedResult.error.message,
    );
  }
  const displayName: string =
    profileResult.data?.display_name ??
    user.user_metadata?.display_name ??
    "Learner";
  const interests: string[] =
    interestsResult.data?.map(
      (r: { topic: InterestTopic }) => r.topic,
    ) ?? [];

  // ── Fast-path: serve pre-queued starters (zero AI latency) ───────────────
  let starters: string[];

  const queued = queuedResult.error ? null : queuedResult.data;

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
    // Instant static starters — AI pre-queues the next set in after() below.
    starters =
      STARTER_SUGGESTIONS[language][cefrLevel] ?? STARTER_SUGGESTIONS.es.B1;
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
    <ChatPageShell
      tutorName={tutorName}
      cefrLevel={cefrLevel}
      interests={interests}
      displayName={displayName}
      language={language}
      starters={starters}
      sessions={sessions}
      initialMessages={sessionMessages.length > 0 ? sessionMessages : undefined}
      initialSessionId={activeSessionId}
    />
  );
}
