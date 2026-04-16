import { NextRequest, NextResponse } from "next/server";
import { resolveAISuggestions } from "@/lib/tmdb";
import { getReplacementMoviesAI } from "@/lib/openai";
import db from "@/lib/db";

// Dislike a movie: save to disliked list, deactivate it, and get a replacement
export async function POST(req: NextRequest) {
  const { memberId, movie } = await req.json();

  if (!memberId || !movie) {
    return NextResponse.json({ error: "Missing memberId or movie" }, { status: 400 });
  }

  // Save to disliked_movies
  await db.execute({
    sql: "INSERT OR IGNORE INTO disliked_movies (member_id, tmdb_id, title) VALUES (?, ?, ?)",
    args: [memberId, movie.id, movie.title],
  });

  // Deactivate from recommendations
  await db.execute({
    sql: "UPDATE recommendations SET is_active = 0 WHERE member_id = ? AND tmdb_id = ?",
    args: [memberId, movie.id],
  });

  // Get context for replacement
  const [likedRows, watchedRows, dislikedRows, recsRows] = await Promise.all([
    db.execute({
      sql: "SELECT DISTINCT title FROM liked_movies WHERE member_id = ? ORDER BY created_at DESC LIMIT 2",
      args: [memberId],
    }),
    db.execute({
      sql: "SELECT title FROM watched_movies WHERE member_id = ?",
      args: [memberId],
    }),
    db.execute({
      sql: "SELECT title FROM disliked_movies WHERE member_id = ?",
      args: [memberId],
    }),
    db.execute({
      sql: "SELECT title FROM recommendations WHERE member_id = ? AND is_active = 1",
      args: [memberId],
    }),
  ]);

  const likedTitles = likedRows.rows.map((r) => String(r.title));
  if (likedTitles.length < 2) {
    return NextResponse.json({ replacement: null });
  }

  const watchedTitles = watchedRows.rows.map((r) => String(r.title));
  const dislikedTitles = dislikedRows.rows.map((r) => String(r.title));
  const currentRecTitles = recsRows.rows.map((r) => String(r.title));

  // Get 1 replacement, passing disliked movies for context
  const suggestions = await getReplacementMoviesAI(
    likedTitles[0],
    likedTitles[1],
    currentRecTitles,
    watchedTitles,
    dislikedTitles,
    1
  );

  const movies = await resolveAISuggestions(suggestions);
  const replacement = movies[0] || null;

  // Save replacement to recommendations
  if (replacement) {
    await db.execute({
      sql: `INSERT INTO recommendations (member_id, tmdb_id, title, poster_path, vote_average, certification, overview)
            VALUES (?, ?, ?, ?, ?, ?, ?)`,
      args: [memberId, replacement.id, replacement.title, replacement.poster_path, replacement.vote_average, replacement.certification, replacement.overview],
    });
  }

  return NextResponse.json({ replacement });
}
