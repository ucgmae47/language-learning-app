import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthForm } from "@/components/auth/auth-form";
import { signup } from "@/app/actions/auth";

export const metadata: Metadata = {
  title: "Create account | LinguaPath",
};

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; assessment?: string }>;
}) {
  const { next, assessment } = await searchParams;

  // Accounts can only be created after completing the placement test.
  // Accessing /signup directly (without an assessment param) redirects home.
  if (!assessment) {
    redirect("/");
  }

  return <AuthForm mode="signup" action={signup} next={next} assessment={assessment} />;
}
