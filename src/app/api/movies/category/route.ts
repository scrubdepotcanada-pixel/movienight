import { NextRequest, NextResponse } from "next/server";
import { resolveAISuggestions } from "@/lib/tmdb";
import { getCategoryRecommendationsAI } from "@/lib/openai";
import { getMemberAge } from "@/lib/member";
import { isMovieAllowed } from "@/lib/ageRating";
import db from "@/lib/db";

export async function GET(req: NextRequest) {
  const category = req.nextUrl.searchParams.get("category");
  const memberId = req.nextUrl.searchParams.get("memberId");
  if (!category || !memberId) {
    return NextResponse.json({ error: "Missing category or memberId" }, { status: 400 });
  }

  try {
    const [age, watchedRows, dislikedRows] = await Promise.all([
      getMemberAge(memberId),
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

    const suggestions = await getCategoryRecommendationsAI(category, watchedTitles, dislikedTitles, age);
    const allMovies = await resolveAISuggestions(suggestions);
    const movies = allMovies.filter((m) => isMovieAllowed(m.certification, age)).slice(0, 5);

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
  } catch (err) {
    console.error("Category recommendation error:", err);
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
