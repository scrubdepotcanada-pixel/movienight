import { NextRequest, NextResponse } from "next/server";

const TMDB_BASE = "https://api.themoviedb.org/3";

function headers() {
  return {
    Authorization: `Bearer ${process.env.TMDB_ACCESS_TOKEN}`,
    "Content-Type": "application/json",
  };
}

export async function GET(req: NextRequest) {
  const showId = req.nextUrl.searchParams.get("showId");
  if (!showId) return NextResponse.json({ error: "showId required" }, { status: 400 });

  const [detailsRes, creditsRes] = await Promise.all([
    fetch(`${TMDB_BASE}/tv/${showId}?language=en-US`, { headers: headers() }),
    fetch(`${TMDB_BASE}/tv/${showId}/credits`, { headers: headers() }),
  ]);

  const details = await detailsRes.json();
  const credits = await creditsRes.json();

  const creators = (details.created_by || []).map((c: Record<string, unknown>) => String(c.name));
  const cast = (credits.cast || []).slice(0, 5).map((c: Record<string, unknown>) => ({
    name: String(c.name),
    character: String(c.character || ""),
  }));
  const genres = (details.genres || []).map((g: Record<string, unknown>) => String(g.name));
  const runtimes: number[] = details.episode_run_time || [];
  const avgRuntime = runtimes.length > 0 ? Math.round(runtimes.reduce((a, b) => a + b, 0) / runtimes.length) : null;

  return NextResponse.json({
    runtime: avgRuntime,
    genres,
    director: creators.length > 0 ? creators.join(", ") : null,
    cast,
    tagline: details.tagline || null,
    seasons: details.number_of_seasons || null,
  });
}
