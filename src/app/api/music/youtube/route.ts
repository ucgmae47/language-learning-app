import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ videoId: null });
  }

  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q");
  if (!q) return NextResponse.json({ videoId: null });

  try {
    const url = new URL("https://www.googleapis.com/youtube/v3/search");
    url.searchParams.set("part", "snippet");
    url.searchParams.set("q", q);
    url.searchParams.set("type", "video");
    url.searchParams.set("videoCategoryId", "10"); // Music category
    url.searchParams.set("maxResults", "1");
    url.searchParams.set("key", apiKey);

    const res = await fetch(url.toString(), { next: { revalidate: 3600 } });
    if (!res.ok) {
      console.error("[music/youtube] YouTube API error:", res.status);
      return NextResponse.json({ videoId: null });
    }

    const data = await res.json() as {
      items?: { id?: { videoId?: string } }[];
    };
    const videoId = data.items?.[0]?.id?.videoId ?? null;
    return NextResponse.json({ videoId });
  } catch (err) {
    console.error("[music/youtube]", err);
    return NextResponse.json({ videoId: null });
  }
}
