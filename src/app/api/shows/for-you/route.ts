import { NextRequest, NextResponse } from "next/server";
import { resolveAIShowSuggestions, getTVWatchProviders, discoverTVShows, getTVShowCertification, conflictsWithAnimation, ANIMATION_GENRE_ID, type WatchProviders } from "@/lib/tmdb";
import { getForYouShowsAI, type RatedMovie } from "@/lib/openai";
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
    return NextResponse.json({ error: "Need at least 3 show titles" }, { status: 400 });
  }

  const locale = req.cookies.get("locale")?.value;

  let maxRating = null;
  let watchedTitles: string[] = [];
  let dislikedTitles: string[] = [];
  let excludeIds = new Set<number>();
  const allLikedShows: RatedMovie[] = [...picks];

  if (memberId) {
    const [restrictions, watchedRows, dislikedRows, likedRows] = await Promise.all([
      getMemberRestrictions(memberId),
      db.execute({ sql: "SELECT tmdb_id, title FROM watched_movies WHERE member_id = ? AND content_type = 'show'", args: [memberId] }),
      db.execute({ sql: "SELECT tmdb_id, title FROM disliked_movies WHERE member_id = ? AND content_type = 'show'", args: [memberId] }),
      db.execute({ sql: "SELECT DISTINCT title, rating FROM liked_movies WHERE member_id = ? AND content_type = 'show' ORDER BY created_at DESC", args: [memberId] }),
    ]);
    maxRating = restrictions.maxRating;
    watchedTitles = watchedRows.rows.map((r) => String(r.title));
    dislikedTitles = dislikedRows.rows.map((r) => String(r.title));
    excludeIds = new Set([
      ...watchedRows.rows.map((r) => Number(r.tmdb_id)),
      ...dislikedRows.rows.map((r) => Number(r.tmdb_id)),
    ]);
    const seen = new Set(picks.map((p) => p.title.toLowerCase()));
    for (const row of likedRows.rows) {
      const title = String(row.title);
      if (seen.has(title.toLowerCase())) continue;
      seen.add(title.toLowerCase());
      allLikedShows.push({ title, rating: row.rating != null ? Number(row.rating) : 4 });
    }
  }

  const suggestions = await getForYouShowsAI(allLikedShows, watchedTitles, dislikedTitles, maxRating, genreName, minDecade);
  const allShows = await resolveAIShowSuggestions(suggestions, locale);
  const minYear = minDecade ? Number(minDecade) : null;
  const genreId = /^\d+$/.test(category) ? Number(category) : null;

  // Hard exclusion backstop — the AI prompt asks it not to repeat watched/
  // disliked/already-picked titles, but that's a soft instruction it can
  // (and over a long session, will) eventually ignore. Enforce it for real.
  const excludeTitles = new Set(
    [...allLikedShows.map((m) => m.title), ...watchedTitles, ...dislikedTitles].map((t) => t.toLowerCase())
  );

  let shows = allShows
    .filter((m) => !excludeIds.has(m.id) && !excludeTitles.has(m.title.toLowerCase()))
    .filter((m) => isMovieAllowed(m.certification, maxRating))
    .filter((m) => !minYear || (m.release_date && parseInt(m.release_date.slice(0, 4)) >= minYear))
    .filter((m) => !genreId || (m.genre_ids || []).includes(genreId))
    .filter((m) => !conflictsWithAnimation(m.genre_ids, genreId));

  // AI ignored the genre/decade instructions (or ran out of fresh ideas after
  // exclusion) and left us short — backfill from TMDB discover
  if (shows.length < 12) {
    const seenIds = new Set(shows.map((m) => m.id));
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
      if (shows.length >= 20) break;
      if (!m.poster_path || seenIds.has(m.id) || excludeIds.has(m.id) || excludeTitles.has(m.title.toLowerCase())) continue;
      const cert = await getTVShowCertification(m.id);
      if (!isMovieAllowed(cert, maxRating)) continue;
      seenIds.add(m.id);
      shows.push({ ...m, certification: cert });
    }
  }

  shows = shows.slice(0, 20);

  const providers: Record<number, WatchProviders> = {};
  await Promise.all(
    shows.map(async (m) => {
      providers[m.id] = await getTVWatchProviders(m.id, "CA");
    })
  );

  if (memberId) {
    for (const pick of picks) {
      await db.execute({
        sql: "INSERT INTO liked_movies (member_id, title, category, rating, content_type) VALUES (?, ?, ?, ?, 'show')",
        args: [memberId, pick.title, category, pick.rating],
      });
    }

    await db.execute({
      sql: "UPDATE recommendations SET is_active = 0 WHERE member_id = ? AND category = ? AND content_type = 'show'",
      args: [memberId, category],
    });

    for (const show of shows) {
      await db.execute({
        sql: `INSERT INTO recommendations (member_id, tmdb_id, title, poster_path, vote_average, certification, overview, release_date, category, content_type)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'show')`,
        args: [memberId, show.id, show.title, show.poster_path, show.vote_average, show.certification, show.overview, show.release_date || null, category],
      });
    }
  }

  return NextResponse.json({
    movies: shows.map((m) => ({
      ...m,
      providers: providers[m.id] || {},
    })),
  });
}
