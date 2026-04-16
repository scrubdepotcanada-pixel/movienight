import { NextRequest, NextResponse } from "next/server";
import { resolveAISuggestions } from "@/lib/tmdb";
import { getRecommendationsAI } from "@/lib/openai";
import { getMemberRestrictions } from "@/lib/member";
import { isMovieAllowed } from "@/lib/ageRating";
import db from "@/lib/db";

export async function GET(req: NextRequest) {
  const likedMovie1 = req.nextUrl.searchParams.get("likedMovie1");
  const likedMovie2 = req.nextUrl.searchParams.get("likedMovie2");
  const memberId = req.nextUrl.searchParams.get("memberId");
  const category = req.nextUrl.searchParams.get("category") || "general";
  if (!likedMovie1 || !likedMovie2 || !memberId) {
    return NextResponse.json({ error: "Missing required params" }, { status: 400 });
  }

  const [{ maxRating }, watchedRows, dislikedRows] = await Promise.all([
    getMemberRestrictions(memberId),
    db.execute({
      sql: "SELECT title FROM watched_movies WHERE member_id = ?",
      args: [memberId],
    }),
    db.execute({
      sql: "SELECT title FROM disliked_movies WHERE member_id = ? AND category = ?",
      args: [memberId, category],
    }),
  ]);

  const watchedTitles = watchedRows.rows.map((r) => String(r.title));
  const dislikedTitles = dislikedRows.rows.map((r) => String(r.title));

  const suggestions = await getRecommendationsAI(likedMovie1, likedMovie2, watchedTitles, dislikedTitles, maxRating);
  const allMovies = await resolveAISuggestions(suggestions);
  const movies = allMovies.filter((m) => isMovieAllowed(m.certification, maxRating)).slice(0, 5);

  for (const title of [likedMovie1, likedMovie2]) {
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
      sql: `INSERT INTO recommendations (member_id, tmdb_id, title, poster_path, vote_average, certification, overview, category)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [memberId, movie.id, movie.title, movie.poster_path, movie.vote_average, movie.certification, movie.overview, category],
    });
  }

  return NextResponse.json({ movies });
}
