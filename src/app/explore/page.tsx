import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Globe } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { ExploreClient } from "@/components/explore/explore-client";
import { LANGUAGE_META } from "@/lib/explore/country-data";
import type { Language, Profile } from "@/lib/supabase/types";

export default async function ExplorePage() {
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
  const meta = LANGUAGE_META[language];

  return (
    <div className="flex h-screen flex-col bg-[#07070f]">
      {/* Header */}
      <header className="flex shrink-0 items-center justify-between border-b border-white/8 bg-gradient-to-r from-[#0d0d1e] to-[#12122a] px-6 py-3.5">
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard"
            className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-300 transition hover:bg-white/10 hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Dashboard
          </Link>

          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 shadow-lg shadow-amber-500/30">
              <Globe className="h-4 w-4 text-white" aria-hidden="true" />
            </div>
            <div>
              <h1 className="text-base font-extrabold leading-none text-white">
                {meta.flag} {meta.name}
              </h1>
              <p className="text-xs text-slate-400">
                Click a highlighted country to explore
              </p>
            </div>
          </div>
        </div>

        <div className="text-sm text-slate-400">
          Signed in as{" "}
          <span className="font-semibold text-amber-400">{displayName}</span>
        </div>
      </header>

      {/* Full-height map area */}
      <main className="min-h-0 flex-1">
        <ExploreClient language={language} />
      </main>
    </div>
  );
}
