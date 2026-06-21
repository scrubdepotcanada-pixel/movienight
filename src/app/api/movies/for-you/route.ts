import { NextRequest, NextResponse } from "next/server";
import { resolveAISuggestions, getWatchProviders, type WatchProviders } from "@/lib/tmdb";
import { getForYouAI } from "@/lib/openai";
import { getMemberRestrictions } from "@/lib/member";
import { isMovieAllowed } from "@/lib/ageRating";
import db from "@/lib/db";

export async function POST(req: NextRequest) {
  const { movieTitles, memberId, category = "for-you", genreName } = await req.json();

  if (!Array.isArray(movieTitles) || movieTitles.length < 3) {
    return NextResponse.json({ error: "Need at least 3 movie titles" }, { status: 400 });
  }

  const locale = req.cookies.get("locale")?.value;

  let maxRating = null;
  let watchedTitles: string[] = [];
  let dislikedTitles: string[] = [];
  let allLikedTitles: string[] = [...movieTitles];

  if (memberId) {
    const [restrictions, watchedRows, dislikedRows, likedRows] = await Promise.all([
      getMemberRestrictions(memberId),
      db.execute({ sql: "SELECT title FROM watched_movies WHERE member_id = ?", args: [memberId] }),
      db.execute({ sql: "SELECT title FROM disliked_movies WHERE member_id = ?", args: [memberId] }),
      db.execute({ sql: "SELECT DISTINCT title FROM liked_movies WHERE member_id = ? ORDER BY created_at DESC", args: [memberId] }),
    ]);
    maxRating = restrictions.maxRating;
    watchedTitles = watchedRows.rows.map((r) => String(r.title));
    dislikedTitles = dislikedRows.rows.map((r) => String(r.title));
    const previousLiked = likedRows.rows.map((r) => String(r.title));
    const seen = new Set(movieTitles.map((t: string) => t.toLowerCase()));
    for (const t of previousLiked) {
      if (!seen.has(t.toLowerCase())) {
        allLikedTitles.push(t);
        seen.add(t.toLowerCase());
      }
    }
  }

  const suggestions = await getForYouAI(allLikedTitles, watchedTitles, dislikedTitles, maxRating, genreName);
  const allMovies = await resolveAISuggestions(suggestions, locale);
  const movies = allMovies
    .filter((m) => isMovieAllowed(m.certification, maxRating))
    .slice(0, 20);

  const providers: Record<number, WatchProviders> = {};
  await Promise.all(
    movies.map(async (m) => {
      providers[m.id] = await getWatchProviders(m.id, "CA");
    })
  );

  if (memberId) {
    for (const title of movieTitles) {
      await db.execute({
        sql: "INSERT INTO liked_movies (member_id, title, category) VALUES (?, ?, ?)",
        args: [memberId, title, category],
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
