import { NextRequest, NextResponse } from "next/server";
import { resolveAISuggestions } from "@/lib/tmdb";
import { getReplacementMoviesAI } from "@/lib/openai";
import db from "@/lib/db";

export async function POST(req: NextRequest) {
  const { memberId, count } = await req.json();

  if (!memberId || !count) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  // Get the member's liked movies for context
  const likedRows = await db.execute({
    sql: "SELECT DISTINCT title FROM liked_movies WHERE member_id = ? ORDER BY created_at DESC LIMIT 2",
    args: [memberId],
  });
  const likedTitles = likedRows.rows.map((r) => String(r.title));

  if (likedTitles.length < 2) {
    return NextResponse.json([]);
  }

  // Get all watched movie titles
  const watchedRows = await db.execute({
    sql: "SELECT title FROM watched_movies WHERE member_id = ?",
    args: [memberId],
  });
  const watchedTitles = watchedRows.rows.map((r) => String(r.title));

  // Get current active recommendation titles
  const recsRows = await db.execute({
    sql: "SELECT title FROM recommendations WHERE member_id = ? AND is_active = 1",
    args: [memberId],
  });
  const currentRecTitles = recsRows.rows.map((r) => String(r.title));

  // Ask OpenAI for replacements
  const suggestions = await getReplacementMoviesAI(
    likedTitles[0],
    likedTitles[1],
    currentRecTitles,
    watchedTitles,
    count
  );

  // Resolve via TMDB
  const movies = await resolveAISuggestions(suggestions);

  // Save new recommendations
  for (const movie of movies) {
    await db.execute({
      sql: `INSERT INTO recommendations (member_id, tmdb_id, title, poster_path, vote_average, certification, overview)
            VALUES (?, ?, ?, ?, ?, ?, ?)`,
      args: [memberId, movie.id, movie.title, movie.poster_path, movie.vote_average, movie.certification, movie.overview],
    });
  }

  return NextResponse.json(movies);
}
