import type { Metadata } from "next";
import { AuthForm } from "@/components/auth/auth-form";
import { signup } from "@/app/actions/auth";

export const metadata: Metadata = {
  title: "Create account | LinguaPath",
};

export default function SignupPage() {
  return <AuthForm mode="signup" action={signup} />;
}
