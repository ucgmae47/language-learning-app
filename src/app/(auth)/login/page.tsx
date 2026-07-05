import type { Metadata } from "next";
import { AuthForm } from "@/components/auth/auth-form";
import { login } from "@/app/actions/auth";

export const metadata: Metadata = {
  title: "Sign in | LinguaPath",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; confirmed?: string; check_email?: string; error?: string }>;
}) {
  const { next, confirmed, check_email, error } = await searchParams;
  return (
    <AuthForm
      mode="login"
      action={login}
      next={next}
      confirmed={confirmed === "1"}
      checkEmail={check_email === "1"}
      authError={error}
    />
  );
}
