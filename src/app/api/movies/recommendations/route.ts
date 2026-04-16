import { NextRequest, NextResponse } from "next/server";
import { getRecommendedMovies, getSimilarMovies, enrichWithCertifications } from "@/lib/tmdb";
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

  const [recommended, similar] = await Promise.all([
    getRecommendedMovies(Number(movieId)),
    getSimilarMovies(Number(movieId)),
  ]);

  const all = [...recommended, ...similar];
  const seen = new Set<number>();
  const unique = all.filter((m) => {
    if (seen.has(m.id) || watchedIds.has(m.id)) return false;
    seen.add(m.id);
    return true;
  });

  const top5 = unique.slice(0, 5);
  const enriched = await enrichWithCertifications(top5);

  // Clear old active recommendations and save new ones
  await db.execute({
    sql: "UPDATE recommendations SET is_active = 0 WHERE member_id = ?",
    args: [memberId],
  });

  for (const movie of enriched) {
    await db.execute({
      sql: `INSERT INTO recommendations (member_id, tmdb_id, title, poster_path, vote_average, certification, overview, base_movie_id)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [memberId, movie.id, movie.title, movie.poster_path, movie.vote_average, movie.certification, movie.overview, Number(movieId)],
    });
  }

  return NextResponse.json({ movies: enriched, baseMovieId: Number(movieId) });
}
