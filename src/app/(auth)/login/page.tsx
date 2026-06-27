import type { Metadata } from "next";
import { AuthForm } from "@/components/auth/auth-form";
import { login } from "@/app/actions/auth";

export const metadata: Metadata = {
  title: "Sign in | LinguaPath",
};

export default function LoginPage() {
  return <AuthForm mode="login" action={login} />;
}
