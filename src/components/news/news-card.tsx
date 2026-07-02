import Image from "next/image";
import { ExternalLink, Clock } from "lucide-react";
import type { SummarizedArticle } from "@/app/actions/news";

const CATEGORY_STYLES: Record<string, string> = {
  World:          "bg-blue-500/20 text-blue-300",
  Technology:     "bg-violet-500/20 text-violet-300",
  Science:        "bg-cyan-500/20 text-cyan-300",
  Business:       "bg-amber-500/20 text-amber-300",
  Sports:         "bg-emerald-500/20 text-emerald-300",
  Entertainment:  "bg-fuchsia-500/20 text-fuchsia-300",
  Health:         "bg-rose-500/20 text-rose-300",
  Politics:       "bg-orange-500/20 text-orange-300",
};

function relativeTime(iso: string): string {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 3600)  return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

type Props = { article: SummarizedArticle };

export function NewsCard({ article }: Props) {
  const categoryStyle =
    CATEGORY_STYLES[article.category] ?? "bg-slate-500/20 text-slate-300";

  return (
    <article className="group flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-white/5 transition hover:border-white/20 hover:bg-white/8">
      {/* Image */}
      {article.imageUrl ? (
        <div className="relative h-44 w-full overflow-hidden bg-white/5">
          <Image
            src={article.imageUrl}
            alt={article.title}
            fill
            sizes="(max-width: 768px) 100vw, 50vw"
            className="object-cover transition duration-300 group-hover:scale-105"
            unoptimized
          />
        </div>
      ) : (
        <div className="flex h-44 w-full items-center justify-center bg-white/5 text-4xl">
          🌍
        </div>
      )}

      {/* Body */}
      <div className="flex flex-1 flex-col gap-3 p-5">
        {/* Category + time */}
        <div className="flex items-center justify-between">
          <span className={`rounded-lg px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider ${categoryStyle}`}>
            {article.category}
          </span>
          <span className="flex items-center gap-1 text-xs text-slate-500">
            <Clock className="h-3 w-3" aria-hidden="true" />
            {relativeTime(article.publishedAt)}
          </span>
        </div>

        {/* Headline */}
        <h2 className="text-sm font-bold leading-6 text-white line-clamp-2">
          {article.title}
        </h2>

        {/* AI summary */}
        <p className="flex-1 text-sm leading-6 text-slate-300 line-clamp-4">
          {article.summary || (
            <span className="italic text-slate-500">Summary unavailable.</span>
          )}
        </p>

        {/* Footer */}
        <div className="flex items-center justify-between pt-1">
          <span className="text-xs text-slate-500">{article.sourceName}</span>
          <a
            href={article.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-slate-300 transition hover:bg-white/10 hover:text-white"
          >
            Original
            <ExternalLink className="h-3 w-3" aria-hidden="true" />
          </a>
        </div>
      </div>
    </article>
  );
}
