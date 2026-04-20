import { NextRequest, NextResponse } from "next/server";

const TMDB_BASE = "https://api.themoviedb.org/3";

export async function GET(req: NextRequest) {
  const query = req.nextUrl.searchParams.get("q");
  if (!query || query.trim().length < 2) {
    return NextResponse.json([]);
  }

  const res = await fetch(
    `${TMDB_BASE}/search/person?query=${encodeURIComponent(query)}&include_adult=false&page=1`,
    {
      headers: {
        Authorization: `Bearer ${process.env.TMDB_ACCESS_TOKEN}`,
        "Content-Type": "application/json",
      },
    }
  );
  const data = await res.json();
  const results = (data.results || []).slice(0, 6).map((p: Record<string, unknown>) => ({
    id: Number(p.id),
    name: String(p.name || ""),
    known_for_department: String(p.known_for_department || ""),
    profile_path: p.profile_path ? String(p.profile_path) : null,
  }));
  return NextResponse.json(results);
}
