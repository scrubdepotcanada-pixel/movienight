import { NextRequest, NextResponse } from "next/server";
import { resolveAISuggestions, resolveAIShowSuggestions } from "@/lib/tmdb";
import { getMoodRecommendationsAI } from "@/lib/openai";
import { getMemberRestrictions } from "@/lib/member";
import { isMovieAllowed } from "@/lib/ageRating";
import db from "@/lib/db";

export async function POST(req: NextRequest) {
  const { memberId, mood, category = "general", contentType = "movie" } = await req.json();

  if (!memberId || !mood) {
    return NextResponse.json({ error: "Missing memberId or mood" }, { status: 400 });
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
  const locale = req.cookies.get("locale")?.value;

  const suggestions = await getMoodRecommendationsAI(mood, contentType, watchedTitles, dislikedTitles, maxRating);

  const allResults = contentType === "show"
    ? await resolveAIShowSuggestions(suggestions, locale)
    : await resolveAISuggestions(suggestions, locale);

  const movies = allResults.filter((m) => isMovieAllowed(m.certification, maxRating)).slice(0, 6);

  // Save as liked with the mood as category context
  await db.execute({
    sql: "INSERT INTO liked_movies (member_id, title, category) VALUES (?, ?, ?)",
    args: [memberId, `mood: ${mood}`, category],
  });

  await db.execute({
    sql: "UPDATE recommendations SET is_active = 0 WHERE member_id = ? AND category = ?",
    args: [memberId, category],
  });

  for (const movie of movies) {
    await db.execute({
      sql: `INSERT INTO recommendations (member_id, tmdb_id, title, poster_path, vote_average, certification, overview, release_date, category, content_type)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [memberId, movie.id, movie.title, movie.poster_path, movie.vote_average, movie.certification, movie.overview, movie.release_date || null, category, contentType],
    });
  }

  return NextResponse.json({ movies });
}
