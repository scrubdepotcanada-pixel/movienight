import { NextRequest, NextResponse } from "next/server";
import { resolveAISuggestions } from "@/lib/tmdb";
import { getRecommendationsAI } from "@/lib/openai";
import db from "@/lib/db";

export async function GET(req: NextRequest) {
  const likedMovie1 = req.nextUrl.searchParams.get("likedMovie1");
  const likedMovie2 = req.nextUrl.searchParams.get("likedMovie2");
  const memberId = req.nextUrl.searchParams.get("memberId");
  if (!likedMovie1 || !likedMovie2 || !memberId) {
    return NextResponse.json({ error: "Missing required params" }, { status: 400 });
  }

  // Get movies this member already watched
  const watchedRows = await db.execute({
    sql: "SELECT title FROM watched_movies WHERE member_id = ?",
    args: [memberId],
  });
  const watchedTitles = watchedRows.rows.map((r) => String(r.title));

  // Ask OpenAI for recommendations
  const suggestions = await getRecommendationsAI(likedMovie1, likedMovie2, watchedTitles);

  // Resolve via TMDB for posters, ratings, certifications
  const movies = await resolveAISuggestions(suggestions);

  // Save the liked movies for future context
  for (const title of [likedMovie1, likedMovie2]) {
    await db.execute({
      sql: "INSERT INTO liked_movies (member_id, title) VALUES (?, ?)",
      args: [memberId, title],
    });
  }

  // Clear old active recommendations and save new ones
  await db.execute({
    sql: "UPDATE recommendations SET is_active = 0 WHERE member_id = ?",
    args: [memberId],
  });

  for (const movie of movies) {
    await db.execute({
      sql: `INSERT INTO recommendations (member_id, tmdb_id, title, poster_path, vote_average, certification, overview)
            VALUES (?, ?, ?, ?, ?, ?, ?)`,
      args: [memberId, movie.id, movie.title, movie.poster_path, movie.vote_average, movie.certification, movie.overview],
    });
  }

  return NextResponse.json({ movies });
}
