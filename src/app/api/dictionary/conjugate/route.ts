import { NextRequest, NextResponse } from "next/server";
import { fetchConjugation } from "@/lib/dictionary/conjugate";
import type { Language } from "@/lib/supabase/types";
import { requireUser, isUnauthorized } from "@/lib/auth/require-user";

export async function GET(request: NextRequest) {
  const authed = await requireUser();
  if (isUnauthorized(authed)) return authed;

  try {
    const { searchParams } = new URL(request.url);
    const verb = (searchParams.get("verb") ?? "").trim();
    const language = (searchParams.get("language") ?? "es") as Language;

    if (!verb || verb.length > 60) {
      return NextResponse.json(
        { error: "Provide a verb (max 60 characters)." },
        { status: 400 },
      );
    }

    if (language !== "es" && language !== "fr") {
      return NextResponse.json({ error: "Unsupported language." }, { status: 400 });
    }

    const result = await fetchConjugation(verb, language);

    if (!result) {
      return NextResponse.json(
        { error: "Could not conjugate that verb. Try the infinitive form." },
        { status: 404 },
      );
    }

    return NextResponse.json(result, {
      headers: {
        "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=604800",
      },
    });
  } catch (err) {
    console.error("[dictionary/conjugate]", err);
    return NextResponse.json(
      { error: "Conjugation service unavailable." },
      { status: 503 },
    );
  }
}
