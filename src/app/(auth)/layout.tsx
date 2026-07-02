import Link from "next/link";
import { Zap } from "lucide-react";
import type { ReactNode } from "react";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-[#07070f] px-4 py-12">
      {/* Background orbs */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/4 top-1/4 h-64 w-64 rounded-full bg-emerald-500/10 blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 h-64 w-64 rounded-full bg-violet-500/10 blur-3xl" />
      </div>

      <Link href="/" className="relative mb-10 flex items-center gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-400 to-emerald-600 shadow-lg shadow-emerald-500/40">
          <Zap className="h-6 w-6 text-white" aria-hidden="true" />
        </span>
        <div>
          <p className="text-lg font-black text-white">LinguaPath</p>
          <p className="text-xs text-emerald-400">Personalized Language Learning</p>
        </div>
      </Link>

      <div className="relative w-full max-w-sm">
        {children}
      </div>
    </div>
  );
}
