import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { User } from "@supabase/supabase-js";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";

type Authed = {
  user: User;
  supabase: SupabaseClient<Database>;
};

/**
 * Require a logged-in Supabase user for expensive /api routes.
 * Returns a 401 NextResponse when unauthenticated.
 */
export async function requireUser(): Promise<Authed | NextResponse> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return { user, supabase };
}

export function isUnauthorized(
  result: Authed | NextResponse,
): result is NextResponse {
  return result instanceof NextResponse;
}
