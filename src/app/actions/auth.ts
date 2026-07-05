"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { CefrLevel, Language } from "@/lib/supabase/types";

export type AuthFormState = {
  error?: string;
  success?: string;
} | null;

/** Only allow redirects to internal paths to prevent open-redirect attacks. */
function safeNext(raw: string | null | undefined): string {
  if (!raw) return "/dashboard";
  const decoded = decodeURIComponent(raw);
  // Must start with / and not be a protocol-relative URL.
  if (decoded.startsWith("/") && !decoded.startsWith("//")) return decoded;
  return "/dashboard";
}

function appUrl(): string {
  return process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
}

async function applyPendingAssessment(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  assessmentRaw: string,
): Promise<void> {
  const [lang, level] = assessmentRaw.split(":");
  if (!lang || !level) return;

  const safeLanguage = (lang === "es" || lang === "fr" ? lang : "es") as Language;
  const safeLevel = (
    ["A1", "A2", "B1", "B2", "C1", "C2"].includes(level) ? level : "B1"
  ) as CefrLevel;

  await Promise.all([
    supabase.from("language_profiles").upsert(
      { user_id: userId, language: safeLanguage, cefr_level: safeLevel },
      { onConflict: "user_id,language" },
    ),
    supabase.from("profiles").update({
      language: safeLanguage,
      cefr_level: safeLevel,
      updated_at: new Date().toISOString(),
    }).eq("id", userId),
  ]);
}

export async function signup(
  _prev: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const displayName = formData.get("display_name") as string;
  // Encoded CEFR placement result: "lang:level" e.g. "es:B1"
  const assessmentRaw = (formData.get("assessment") as string | null) ?? "";
  const next = safeNext(formData.get("next") as string | null);

  if (!email || !password || !displayName) {
    return { error: "All fields are required." };
  }

  if (password.length < 8) {
    return { error: "Password must be at least 8 characters." };
  }

  const supabase = await createClient();

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        display_name: displayName,
        ...(assessmentRaw ? { pending_assessment: assessmentRaw } : {}),
      },
      emailRedirectTo: `${appUrl()}/auth/callback?next=/login`,
    },
  });

  if (error) {
    return { error: error.message };
  }

  // Email confirmation required — no session yet. Send user to Sign in with a
  // prompt to check their inbox; assessment data is applied after they confirm.
  if (!data.session) {
    redirect("/login?check_email=1");
  }

  // ── Apply the CEFR placement result from the pre-signup assessment ─────────
  // The result was encoded in the URL as ?assessment=es:B1 and carried through
  // as a hidden form field.  We save it now that the user has a session.
  if (assessmentRaw) {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await applyPendingAssessment(supabase, user.id, assessmentRaw);
    }
  }

  // New users always go to interests onboarding (unless a custom `next` was
  // explicitly set, e.g. from an admin link).
  const destination = next === "/dashboard" || !next ? "/onboarding/interests" : next;
  redirect(destination);
}

export async function login(
  _prev: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const next = safeNext(formData.get("next") as string | null);

  if (!email || !password) {
    return { error: "Email and password are required." };
  }

  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { error: error.message };
  }

  const { data: { user } } = await supabase.auth.getUser();
  const pendingAssessment = user?.user_metadata?.pending_assessment as string | undefined;
  if (user && pendingAssessment) {
    await applyPendingAssessment(supabase, user.id, pendingAssessment);
    await supabase.auth.updateUser({
      data: { pending_assessment: null },
    });
  }

  redirect(next);
}

export async function logout(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
