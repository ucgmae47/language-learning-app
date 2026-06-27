import Link from "next/link";
import { BookOpen, Menu } from "lucide-react";

const navLinks = [
  { href: "#features", label: "Features" },
  { href: "#daily", label: "Daily Practice" },
  { href: "#stories", label: "Stories" },
] as const;

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-emerald-100/80 bg-white/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-sm">
            <BookOpen className="h-5 w-5" aria-hidden="true" />
          </span>
          <div className="leading-tight">
            <p className="text-sm font-semibold text-slate-900">LinguaPath</p>
            <p className="text-xs text-emerald-700">Spanish MVP</p>
          </div>
        </Link>

        <nav
          aria-label="Primary"
          className="hidden items-center gap-8 md:flex"
        >
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-slate-600 transition-colors hover:text-emerald-700"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <Link
            href="#assessment"
            className="hidden rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 sm:inline-flex"
          >
            Start assessment
          </Link>
          <button
            type="button"
            aria-label="Open menu"
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 text-slate-700 md:hidden"
          >
            <Menu className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>
      </div>
    </header>
  );
}
