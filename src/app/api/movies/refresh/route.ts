import { NextRequest, NextResponse } from "next/server";
import { getRecommendedMovies, getSimilarMovies, enrichWithCertifications } from "@/lib/tmdb";
import db from "@/lib/db";

export async function POST(req: NextRequest) {
  const { memberId, baseMovieId, count } = await req.json();

  if (!memberId || !baseMovieId || !count) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const [watchedRows, recsRows] = await Promise.all([
    db.execute({
      sql: "SELECT tmdb_id FROM watched_movies WHERE member_id = ?",
      args: [memberId],
    }),
    db.execute({
      sql: "SELECT tmdb_id FROM recommendations WHERE member_id = ? AND is_active = 1",
      args: [memberId],
    }),
  ]);

  const excludeIds = new Set([
    ...watchedRows.rows.map((r) => Number(r.tmdb_id)),
    ...recsRows.rows.map((r) => Number(r.tmdb_id)),
  ]);

  const [recommended, similar] = await Promise.all([
    getRecommendedMovies(Number(baseMovieId)),
    getSimilarMovies(Number(baseMovieId)),
  ]);

  const all = [...recommended, ...similar];
  const seen = new Set<number>();
  const unique = all.filter((m) => {
    if (seen.has(m.id) || excludeIds.has(m.id)) return false;
    seen.add(m.id);
    return true;
  });

  const replacements = unique.slice(0, count);
  const enriched = await enrichWithCertifications(replacements);

  for (const movie of enriched) {
    await db.execute({
      sql: `INSERT INTO recommendations (member_id, tmdb_id, title, poster_path, vote_average, certification, overview, base_movie_id)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [memberId, movie.id, movie.title, movie.poster_path, movie.vote_average, movie.certification, movie.overview, Number(baseMovieId)],
    });
  }

  return NextResponse.json(enriched);
}
