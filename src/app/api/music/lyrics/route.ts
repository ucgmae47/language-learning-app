import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const artist = searchParams.get("artist");
  const title = searchParams.get("title");

  if (!artist || !title) {
    return NextResponse.json({ lyrics: null });
  }

  try {
    const url = `https://api.lyrics.ovh/v1/${encodeURIComponent(artist)}/${encodeURIComponent(title)}`;
    const res = await fetch(url, {
      next: { revalidate: 86400 }, // cache for 24 hours
      signal: AbortSignal.timeout(6000),
    });

    if (!res.ok) return NextResponse.json({ lyrics: null });

    const data = await res.json() as { lyrics?: string };
    return NextResponse.json({ lyrics: data.lyrics ?? null });
  } catch {
    return NextResponse.json({ lyrics: null });
  }
}
