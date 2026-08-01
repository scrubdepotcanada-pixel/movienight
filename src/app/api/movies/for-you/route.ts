import { NextRequest, NextResponse } from "next/server";
import { resolveAISuggestions, getWatchProviders, discoverMovies, getMovieCertification, conflictsWithAnimation, ANIMATION_GENRE_ID, type WatchProviders } from "@/lib/tmdb";
import { getForYouAI, type RatedMovie } from "@/lib/openai";
import { getMemberRestrictions } from "@/lib/member";
import { isMovieAllowed } from "@/lib/ageRating";
import db from "@/lib/db";

const DEFAULT_RATING = 5; // explicit picks with no star rating supplied are assumed loved

export async function POST(req: NextRequest) {
  const { movieTitles, moviePicks, memberId, category = "for-you", genreName, minDecade } = await req.json();

  const picks: RatedMovie[] = Array.isArray(moviePicks) && moviePicks.length > 0
    ? moviePicks.map((p: { title: string; rating?: number }) => ({
        title: String(p.title),
        rating: Math.min(5, Math.max(1, Number(p.rating) || DEFAULT_RATING)),
      }))
    : Array.isArray(movieTitles)
      ? movieTitles.map((t: string) => ({ title: t, rating: DEFAULT_RATING }))
      : [];

  if (picks.length < 3) {
    return NextResponse.json({ error: "Need at least 3 movie titles" }, { status: 400 });
  }

  const locale = req.cookies.get("locale")?.value;

  let maxRating = null;
  let watchedTitles: string[] = [];
  let dislikedTitles: string[] = [];
  const allLikedMovies: RatedMovie[] = [...picks];

  if (memberId) {
    const [restrictions, watchedRows, dislikedRows, likedRows] = await Promise.all([
      getMemberRestrictions(memberId),
      db.execute({ sql: "SELECT title FROM watched_movies WHERE member_id = ?", args: [memberId] }),
      db.execute({ sql: "SELECT title FROM disliked_movies WHERE member_id = ?", args: [memberId] }),
      db.execute({ sql: "SELECT DISTINCT title, rating FROM liked_movies WHERE member_id = ? ORDER BY created_at DESC", args: [memberId] }),
    ]);
    maxRating = restrictions.maxRating;
    watchedTitles = watchedRows.rows.map((r) => String(r.title));
    dislikedTitles = dislikedRows.rows.map((r) => String(r.title));
    const seen = new Set(picks.map((p) => p.title.toLowerCase()));
    for (const row of likedRows.rows) {
      const title = String(row.title);
      if (seen.has(title.toLowerCase())) continue;
      seen.add(title.toLowerCase());
      allLikedMovies.push({ title, rating: row.rating != null ? Number(row.rating) : 4 });
    }
  }

  const suggestions = await getForYouAI(allLikedMovies, watchedTitles, dislikedTitles, maxRating, genreName, minDecade);
  const allMovies = await resolveAISuggestions(suggestions, locale);
  const minYear = minDecade ? Number(minDecade) : null;
  const genreId = /^\d+$/.test(category) ? Number(category) : null;

  let movies = allMovies
    .filter((m) => isMovieAllowed(m.certification, maxRating))
    .filter((m) => !minYear || (m.release_date && parseInt(m.release_date.slice(0, 4)) >= minYear))
    .filter((m) => !genreId || (m.genre_ids || []).includes(genreId))
    .filter((m) => !conflictsWithAnimation(m.genre_ids, genreId));

  // AI ignored the genre/decade instructions and left us short — backfill from TMDB discover
  if ((genreId || minYear) && movies.length < 12) {
    const excludeTitles = new Set(
      [...allLikedMovies.map((m) => m.title), ...watchedTitles, ...dislikedTitles].map((t) => t.toLowerCase())
    );
    const seenIds = new Set(movies.map((m) => m.id));
    const backfill = await discoverMovies(
      {
        genre: genreId || undefined,
        excludeGenre: genreId && genreId !== ANIMATION_GENRE_ID ? ANIMATION_GENRE_ID : undefined,
        minYear: minYear || undefined,
        sortBy: "popularity.desc",
        minVoteCount: 500,
      },
      locale
    );
    for (const m of backfill) {
      if (movies.length >= 20) break;
      if (!m.poster_path || seenIds.has(m.id) || excludeTitles.has(m.title.toLowerCase())) continue;
      const cert = await getMovieCertification(m.id, locale);
      if (!isMovieAllowed(cert, maxRating)) continue;
      seenIds.add(m.id);
      movies.push({ ...m, certification: cert });
    }
  }

  movies = movies.slice(0, 20);

  const providers: Record<number, WatchProviders> = {};
  await Promise.all(
    movies.map(async (m) => {
      providers[m.id] = await getWatchProviders(m.id, "CA");
    })
  );

  if (memberId) {
    for (const pick of picks) {
      await db.execute({
        sql: "INSERT INTO liked_movies (member_id, title, category, rating) VALUES (?, ?, ?, ?)",
        args: [memberId, pick.title, category, pick.rating],
      });
    }

    await db.execute({
      sql: "UPDATE recommendations SET is_active = 0 WHERE member_id = ? AND category = ?",
      args: [memberId, category],
    });

    for (const movie of movies) {
      await db.execute({
        sql: `INSERT INTO recommendations (member_id, tmdb_id, title, poster_path, vote_average, certification, overview, release_date, category)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [memberId, movie.id, movie.title, movie.poster_path, movie.vote_average, movie.certification, movie.overview, movie.release_date || null, category],
      });
    }
  }

  return NextResponse.json({
    movies: movies.map((m) => ({
      ...m,
      providers: providers[m.id] || {},
    })),
  });
}
