import Link from "next/link";
import { BookOpen } from "lucide-react";
import type { ReactNode } from "react";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-4 py-12">
      <Link href="/" className="mb-8 flex items-center gap-2.5">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-sm">
          <BookOpen className="h-5 w-5" aria-hidden="true" />
        </span>
        <span className="text-lg font-semibold text-slate-900">LinguaPath</span>
      </Link>
      {children}
    </div>
  );
}
