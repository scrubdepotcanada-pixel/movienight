import { NextRequest, NextResponse } from "next/server";
import { getSimilarMovies, getRecommendedMovies, getMovieCertification, getWatchProviders, discoverMovies } from "@/lib/tmdb";
import { getMemberRestrictions } from "@/lib/member";
import { isMovieAllowed } from "@/lib/ageRating";
import db from "@/lib/db";

export async function POST(req: NextRequest) {
  const { memberId, category = "for-you" } = await req.json();

  if (!memberId) {
    return NextResponse.json({ error: "Missing memberId" }, { status: 400 });
  }

  const locale = req.cookies.get("locale")?.value;

  const [{ maxRating }, likedRows, watchedRows, dislikedRows, activeRecs] = await Promise.all([
    getMemberRestrictions(memberId),
    db.execute({
      sql: "SELECT DISTINCT tmdb_id FROM liked_movies lm JOIN recommendations r ON lm.member_id = r.member_id AND lm.title = r.title WHERE lm.member_id = ? AND lm.category = ? AND r.tmdb_id IS NOT NULL ORDER BY lm.created_at DESC LIMIT 5",
      args: [memberId, category],
    }),
    db.execute({ sql: "SELECT tmdb_id FROM watched_movies WHERE member_id = ?", args: [memberId] }),
    db.execute({ sql: "SELECT tmdb_id FROM disliked_movies WHERE member_id = ?", args: [memberId] }),
    db.execute({ sql: "SELECT tmdb_id FROM recommendations WHERE member_id = ? AND is_active = 1", args: [memberId] }),
  ]);

  const excludeIds = new Set([
    ...watchedRows.rows.map((r) => Number(r.tmdb_id)),
    ...dislikedRows.rows.map((r) => Number(r.tmdb_id)),
    ...activeRecs.rows.map((r) => Number(r.tmdb_id)),
  ]);

  const seedIds = likedRows.rows.map((r) => Number(r.tmdb_id)).filter((id) => id > 0);

  if (seedIds.length === 0) {
    return NextResponse.json({ movies: [] });
  }

  const allResults = await Promise.all(
    seedIds.slice(0, 3).flatMap((id) => [
      getSimilarMovies(id, locale),
      getRecommendedMovies(id, locale),
    ])
  );

  const seen = new Set<number>();
  const genreId = /^\d+$/.test(category) ? Number(category) : null;
  let candidates = allResults
    .flat()
    .filter((m) => {
      if (!m.poster_path || excludeIds.has(m.id) || seen.has(m.id)) return false;
      if (genreId && !(m.genre_ids || []).includes(genreId)) return false;
      seen.add(m.id);
      return true;
    })
    .sort((a, b) => b.vote_average - a.vote_average)
    .slice(0, 15);

  // Similar/recommended came up short on genre matches — backfill from discover
  if (genreId && candidates.length < 8) {
    const backfill = await discoverMovies(
      { genre: genreId, sortBy: "popularity.desc", minVoteCount: 500 },
      locale
    );
    for (const m of backfill) {
      if (candidates.length >= 15) break;
      if (!m.poster_path || excludeIds.has(m.id) || seen.has(m.id)) continue;
      seen.add(m.id);
      candidates.push(m);
    }
  }

  const movies = await Promise.all(
    candidates.map(async (m) => {
      const cert = await getMovieCertification(m.id, locale);
      if (!isMovieAllowed(cert, maxRating)) return null;
      const providers = await getWatchProviders(m.id, "CA");
      return { ...m, certification: cert, providers };
    })
  );

  const filtered = movies.filter((m): m is NonNullable<typeof m> => m !== null).slice(0, 10);

  for (const movie of filtered) {
    await db.execute({
      sql: `INSERT INTO recommendations (member_id, tmdb_id, title, poster_path, vote_average, certification, overview, release_date, category)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [memberId, movie.id, movie.title, movie.poster_path, movie.vote_average, movie.certification, movie.overview, movie.release_date || null, category],
    });
  }

  return NextResponse.json({ movies: filtered });
}
