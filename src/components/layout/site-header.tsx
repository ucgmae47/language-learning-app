import Link from "next/link";
import { Zap } from "lucide-react";

const navLinks = [
  { href: "#features", label: "Features" },
  { href: "#languages", label: "Languages" },
] as const;

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-white/8 bg-[#07070f]/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 shadow-lg shadow-emerald-500/30">
            <Zap className="h-5 w-5 text-white" aria-hidden="true" />
          </span>
          <div className="leading-tight">
            <p className="text-sm font-bold text-white">LinguaPath</p>
            <p className="text-xs text-emerald-400">Personalized Learning</p>
          </div>
        </Link>

        <nav aria-label="Primary" className="hidden items-center gap-8 md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-slate-400 transition hover:text-white"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="hidden text-sm font-medium text-slate-400 transition hover:text-white sm:inline-flex"
          >
            Sign in
          </Link>
          <Link
            href="/assessment"
            className="rounded-full bg-gradient-to-r from-emerald-500 to-emerald-600 px-5 py-2 text-sm font-bold text-white shadow-lg shadow-emerald-500/30 transition hover:from-emerald-400 hover:to-emerald-500 hover:shadow-emerald-400/40"
          >
            Get started →
          </Link>
        </div>
      </div>
    </header>
  );
}
