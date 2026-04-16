import { NextRequest, NextResponse } from "next/server";
import { resolveAISuggestions } from "@/lib/tmdb";
import { getReplacementMoviesAI } from "@/lib/openai";
import db from "@/lib/db";

export async function POST(req: NextRequest) {
  const { memberId, count, category = "general" } = await req.json();

  if (!memberId || !count) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const [likedRows, watchedRows, dislikedRows, recsRows] = await Promise.all([
    db.execute({
      sql: "SELECT DISTINCT title FROM liked_movies WHERE member_id = ? AND category = ? ORDER BY created_at DESC LIMIT 2",
      args: [memberId, category],
    }),
    db.execute({
      sql: "SELECT title FROM watched_movies WHERE member_id = ?",
      args: [memberId],
    }),
    db.execute({
      sql: "SELECT title FROM disliked_movies WHERE member_id = ? AND category = ?",
      args: [memberId, category],
    }),
    db.execute({
      sql: "SELECT title FROM recommendations WHERE member_id = ? AND is_active = 1 AND category = ?",
      args: [memberId, category],
    }),
  ]);

  const likedTitles = likedRows.rows.map((r) => String(r.title));
  const watchedTitles = watchedRows.rows.map((r) => String(r.title));
  const dislikedTitles = dislikedRows.rows.map((r) => String(r.title));
  const currentRecTitles = recsRows.rows.map((r) => String(r.title));

  const context = category !== "general"
    ? { category }
    : { likedMovie1: likedTitles[0], likedMovie2: likedTitles[1] };

  if (category === "general" && likedTitles.length < 2) {
    return NextResponse.json([]);
  }

  const suggestions = await getReplacementMoviesAI(
    context,
    currentRecTitles,
    watchedTitles,
    dislikedTitles,
    count
  );

  const movies = await resolveAISuggestions(suggestions);

  for (const movie of movies) {
    await db.execute({
      sql: `INSERT INTO recommendations (member_id, tmdb_id, title, poster_path, vote_average, certification, overview, category)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [memberId, movie.id, movie.title, movie.poster_path, movie.vote_average, movie.certification, movie.overview, category],
    });
  }

  return NextResponse.json(movies);
}
