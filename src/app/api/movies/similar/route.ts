import { NextRequest, NextResponse } from "next/server";
import { getSimilarMovies, enrichWithCertifications } from "@/lib/tmdb";
import db from "@/lib/db";

export async function GET(req: NextRequest) {
  const movieId = req.nextUrl.searchParams.get("movieId");
  const memberId = req.nextUrl.searchParams.get("memberId");
  if (!movieId || !memberId) {
    return NextResponse.json({ error: "Missing movieId or memberId" }, { status: 400 });
  }

  // Get movies this member already watched
  const watchedRows = await db.execute({
    sql: "SELECT tmdb_id FROM watched_movies WHERE member_id = ?",
    args: [memberId],
  });
  const watchedIds = new Set(watchedRows.rows.map((r) => Number(r.tmdb_id)));

  const similar = await getSimilarMovies(Number(movieId));
  const filtered = similar.filter((m) => !watchedIds.has(m.id)).slice(0, 3);
  const enriched = await enrichWithCertifications(filtered);

  return NextResponse.json(enriched);
}
