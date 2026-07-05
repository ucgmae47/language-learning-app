import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

function safeNext(raw: string | null): string {
  if (!raw) return "/login";
  if (raw.startsWith("/") && !raw.startsWith("//")) return raw;
  return "/login";
}

/**
 * Handles Supabase email-confirmation (and other OAuth) redirects.
 * Confirms the account, clears any auto-session, and sends the user to Sign in.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = safeNext(searchParams.get("next"));

  const redirectUrl = new URL(next, origin);
  redirectUrl.searchParams.set("confirmed", "1");

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      console.error("[auth/callback]", error.message);
      const errorUrl = new URL("/login", origin);
      errorUrl.searchParams.set("error", "confirmation_failed");
      return NextResponse.redirect(errorUrl);
    }

    // Email is confirmed — sign out so the user lands on Sign in, not the dashboard.
    await supabase.auth.signOut();
  }

  return NextResponse.redirect(redirectUrl);
}
