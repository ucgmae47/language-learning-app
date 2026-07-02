"use client";

import dynamic from "next/dynamic";
import type { Language, GrammarWeakness } from "@/lib/supabase/types";
import type { DrillQuestion } from "@/lib/drills/types";

// Dynamic import lives here (a Client Component) because Next.js 16 does not
// allow ssr: false inside Server Components.
const DrillSessionDynamic = dynamic(
  () => import("./drill-session").then((m) => m.DrillSession),
  {
    ssr: false,
    loading: () => (
      <div className="h-64 animate-pulse rounded-2xl bg-slate-100" />
    ),
  },
);

type Props = {
  language: Language;
  questions: DrillQuestion[];
  weaknesses: GrammarWeakness[];
};

export function DrillSessionClient(props: Props) {
  return <DrillSessionDynamic {...props} />;
}
