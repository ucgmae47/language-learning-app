import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { InterestPicker } from "@/components/onboarding/interest-picker";

export const metadata: Metadata = {
  title: "Choose Your Interests | LinguaPath",
};

export default async function InterestsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // If the user already has interests saved, skip the onboarding step.
  const { data: existing } = await supabase
    .from("user_interests")
    .select("topic")
    .eq("user_id", user.id)
    .limit(1);

  if (existing && existing.length > 0) {
    redirect("/dashboard");
  }

  const displayName: string =
    user.user_metadata?.display_name ?? user.email?.split("@")[0] ?? "there";

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-4 py-16">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="mb-10 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100">
            <span className="text-2xl" role="img" aria-label="wave">
              👋
            </span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900">
            Welcome aboard, {displayName}!
          </h1>
          <p className="mt-2 text-slate-500">
            Pick the topics you enjoy. We&apos;ll use them to personalise your
            stories, chat practice, and daily words.
          </p>
        </div>

        <InterestPicker />
      </div>
    </div>
  );
}
