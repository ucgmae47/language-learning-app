import { NextResponse, type NextRequest } from "next/server";
import { createProxyClient } from "@/lib/supabase/proxy-client";
import { isPathLockedInPreview } from "@/lib/features/preview-gate";

// /assessment is intentionally PUBLIC so new visitors can take the placement
// test before creating an account.  Auth is handled inside the page itself
// (isAuthenticated prop) so the quiz still works for returning users too.
const PROTECTED_PREFIXES = ["/dashboard", "/onboarding", "/stories", "/chat", "/crossword", "/drills", "/flashcards", "/settings", "/chat-room", "/journal", "/news", "/gameroom", "/sentence-builder", "/music", "/explore", "/vocabulary", "/phrasebook", "/recipes", "/pronunciation", "/calendar", "/dictionary", "/planner", "/progress", "/achievements", "/leaderboard"];
const AUTH_ROUTES = ["/login", "/signup"];

export async function proxy(request: NextRequest) {
  const response = NextResponse.next({ request });

  const supabase = createProxyClient(request, response);

  // Refresh the session so cookies are updated on every request.
  // getUser() is used (not getSession()) because it validates the JWT server-side.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  const isProtected = PROTECTED_PREFIXES.some((prefix) =>
    pathname.startsWith(prefix),
  );
  const isAuthRoute = AUTH_ROUTES.some((route) => pathname.startsWith(route));

  if (isProtected && !user) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isAuthRoute && user) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // Soft-launch: block gated feature pages (Stories remains open).
  if (user && isPathLockedInPreview(pathname)) {
    const dash = new URL("/dashboard", request.url);
    dash.searchParams.set("preview", "locked");
    return NextResponse.redirect(dash);
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|.*\\.png$|.*\\.svg$).*)",
  ],
};
