import { NextRequest, NextResponse } from "next/server";

const TMDB_BASE = "https://api.themoviedb.org/3";

function headers() {
  return {
    Authorization: `Bearer ${process.env.TMDB_ACCESS_TOKEN}`,
    "Content-Type": "application/json",
  };
}

export async function GET(req: NextRequest) {
  const movieId = req.nextUrl.searchParams.get("movieId");
  if (!movieId) return NextResponse.json({ error: "movieId required" }, { status: 400 });

  const [detailsRes, creditsRes] = await Promise.all([
    fetch(`${TMDB_BASE}/movie/${movieId}?language=en-US`, { headers: headers() }),
    fetch(`${TMDB_BASE}/movie/${movieId}/credits`, { headers: headers() }),
  ]);

  const details = await detailsRes.json();
  const credits = await creditsRes.json();

  const director = (credits.crew || []).find((c: Record<string, unknown>) => c.job === "Director");
  const cast = (credits.cast || []).slice(0, 5).map((c: Record<string, unknown>) => ({
    name: String(c.name),
    character: String(c.character || ""),
  }));
  const genres = (details.genres || []).map((g: Record<string, unknown>) => String(g.name));

  return NextResponse.json({
    runtime: details.runtime || null,
    genres,
    director: director ? String(director.name) : null,
    cast,
    tagline: details.tagline || null,
  });
}
