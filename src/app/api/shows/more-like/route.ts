import { NextRequest, NextResponse } from "next/server";
import { getSimilarTVShows, getRecommendedTVShows, getTVShowCertification, getTVWatchProviders, discoverTVShows, conflictsWithAnimation, ANIMATION_GENRE_ID } from "@/lib/tmdb";
import { getMemberRestrictions } from "@/lib/member";
import { isMovieAllowed } from "@/lib/ageRating";
import db from "@/lib/db";

export async function POST(req: NextRequest) {
  const { memberId, category = "for-you", minDecade } = await req.json();

  if (!memberId) {
    return NextResponse.json({ error: "Missing memberId" }, { status: 400 });
  }

  const locale = req.cookies.get("locale")?.value;

  const [{ maxRating }, likedRows, watchedRows, dislikedRows, activeRecs] = await Promise.all([
    getMemberRestrictions(memberId),
    db.execute({
      sql: "SELECT DISTINCT tmdb_id FROM liked_movies lm JOIN recommendations r ON lm.member_id = r.member_id AND lm.title = r.title WHERE lm.member_id = ? AND lm.category = ? AND lm.content_type = 'show' AND r.tmdb_id IS NOT NULL AND r.content_type = 'show' ORDER BY lm.created_at DESC LIMIT 5",
      args: [memberId, category],
    }),
    db.execute({ sql: "SELECT tmdb_id FROM watched_movies WHERE member_id = ? AND content_type = 'show'", args: [memberId] }),
    db.execute({ sql: "SELECT tmdb_id FROM disliked_movies WHERE member_id = ? AND content_type = 'show'", args: [memberId] }),
    db.execute({ sql: "SELECT tmdb_id FROM recommendations WHERE member_id = ? AND is_active = 1 AND content_type = 'show'", args: [memberId] }),
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
      getSimilarTVShows(id, locale),
      getRecommendedTVShows(id, locale),
    ])
  );

  const seen = new Set<number>();
  const genreId = /^\d+$/.test(category) ? Number(category) : null;
  const minYear: number | null = minDecade ? Number(minDecade) : null;

  const passesFilters = (m: { poster_path: string | null; id: number; genre_ids?: number[]; release_date?: string }) => {
    if (!m.poster_path || excludeIds.has(m.id) || seen.has(m.id)) return false;
    if (genreId && !(m.genre_ids || []).includes(genreId)) return false;
    if (conflictsWithAnimation(m.genre_ids, genreId)) return false;
    if (minYear) {
      const year = m.release_date ? parseInt(m.release_date.slice(0, 4)) : 0;
      if (!year || year < minYear) return false;
    }
    return true;
  };

  let candidates = allResults
    .flat()
    .filter((m) => {
      if (!passesFilters(m)) return false;
      seen.add(m.id);
      return true;
    })
    .sort((a, b) => b.vote_average - a.vote_average)
    .slice(0, 15);

  // Similar/recommended came up short — backfill from discover
  if (candidates.length < 8) {
    const backfill = await discoverTVShows(
      {
        genre: genreId || undefined,
        excludeGenre: genreId && genreId !== ANIMATION_GENRE_ID ? ANIMATION_GENRE_ID : undefined,
        minYear: minYear || undefined,
        sortBy: genreId || minYear ? "popularity.desc" : "vote_average.desc",
        minVoteCount: 500,
      },
      locale
    );
    for (const m of backfill) {
      if (candidates.length >= 15) break;
      if (!passesFilters(m)) continue;
      seen.add(m.id);
      candidates.push(m);
    }
  }

  const shows = await Promise.all(
    candidates.map(async (m) => {
      const cert = await getTVShowCertification(m.id);
      if (!isMovieAllowed(cert, maxRating)) return null;
      const providers = await getTVWatchProviders(m.id, "CA");
      return { ...m, certification: cert, providers };
    })
  );

  const filtered = shows.filter((m): m is NonNullable<typeof m> => m !== null).slice(0, 10);

  for (const show of filtered) {
    await db.execute({
      sql: `INSERT INTO recommendations (member_id, tmdb_id, title, poster_path, vote_average, certification, overview, release_date, category, content_type)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'show')`,
      args: [memberId, show.id, show.title, show.poster_path, show.vote_average, show.certification, show.overview, show.release_date || null, category],
    });
  }

  return NextResponse.json({ movies: filtered });
}
