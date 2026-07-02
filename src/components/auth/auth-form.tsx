"use client";

import { useActionState } from "react";
import Link from "next/link";
import type { AuthFormState } from "@/app/actions/auth";

type AuthFormProps = {
  mode: "login" | "signup";
  action: (prev: AuthFormState, formData: FormData) => Promise<AuthFormState>;
  next?: string;
};

export function AuthForm({ mode, action, next }: AuthFormProps) {
  const [state, formAction, pending] = useActionState(action, null);
  const isSignup = mode === "signup";

  return (
    <div className="w-full">
      <div className="rounded-3xl border border-white/10 bg-white/5 p-8 shadow-2xl backdrop-blur-md">
        <h1 className="text-2xl font-black text-white">
          {isSignup ? "Create your account" : "Welcome back"}
        </h1>
        <p className="mt-1 text-sm text-slate-400">
          {isSignup
            ? "Start your language learning journey."
            : "Sign in to continue learning."}
        </p>

        <form action={formAction} className="mt-7 flex flex-col gap-4">
          {next && <input type="hidden" name="next" value={next} />}

          {isSignup && (
            <div className="flex flex-col gap-2">
              <label htmlFor="display_name" className="text-sm font-semibold text-slate-300">
                Display name
              </label>
              <input
                id="display_name"
                name="display_name"
                type="text"
                autoComplete="name"
                required
                placeholder="e.g. María"
                className="rounded-xl border border-white/10 bg-white/8 px-4 py-3 text-sm text-white placeholder-slate-500 outline-none transition focus:border-emerald-500/60 focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>
          )}

          <div className="flex flex-col gap-2">
            <label htmlFor="email" className="text-sm font-semibold text-slate-300">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              placeholder="you@example.com"
              className="rounded-xl border border-white/10 bg-white/8 px-4 py-3 text-sm text-white placeholder-slate-500 outline-none transition focus:border-emerald-500/60 focus:ring-2 focus:ring-emerald-500/20"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="password" className="text-sm font-semibold text-slate-300">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete={isSignup ? "new-password" : "current-password"}
              required
              minLength={8}
              placeholder={isSignup ? "At least 8 characters" : "••••••••"}
              className="rounded-xl border border-white/10 bg-white/8 px-4 py-3 text-sm text-white placeholder-slate-500 outline-none transition focus:border-emerald-500/60 focus:ring-2 focus:ring-emerald-500/20"
            />
          </div>

          {state?.error && (
            <p role="alert" className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-2.5 text-sm text-red-400">
              {state.error}
            </p>
          )}

          <button
            type="submit"
            disabled={pending}
            className="mt-2 rounded-2xl bg-gradient-to-r from-emerald-500 to-emerald-600 py-3.5 text-sm font-bold text-white shadow-lg shadow-emerald-500/30 transition hover:from-emerald-400 hover:to-emerald-500 hover:shadow-emerald-400/40 disabled:opacity-50"
          >
            {pending
              ? "Please wait…"
              : isSignup
                ? "Create account →"
                : "Sign in →"}
          </button>
        </form>
      </div>

      <p className="mt-5 text-center text-sm text-slate-500">
        {isSignup ? (
          <>
            Already have an account?{" "}
            <Link
              href={next ? `/login?next=${encodeURIComponent(next)}` : "/login"}
              className="font-semibold text-emerald-400 hover:text-emerald-300 hover:underline"
            >
              Sign in
            </Link>
          </>
        ) : (
          <>
            Don&apos;t have an account?{" "}
            <Link
              href={next ? `/signup?next=${encodeURIComponent(next)}` : "/signup"}
              className="font-semibold text-emerald-400 hover:text-emerald-300 hover:underline"
            >
              Create one
            </Link>
          </>
        )}
      </p>
    </div>
  );
}
