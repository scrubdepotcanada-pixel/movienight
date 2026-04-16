import { NextRequest, NextResponse } from "next/server";
import { resolveAISuggestions } from "@/lib/tmdb";
import { getReplacementMoviesAI } from "@/lib/openai";
import { getMemberAge } from "@/lib/member";
import { isMovieAllowed } from "@/lib/ageRating";
import db from "@/lib/db";

// Mark a single movie as watched and return one replacement
export async function POST(req: NextRequest) {
  const { memberId, movie, category = "general" } = await req.json();

  if (!memberId || !movie) {
    return NextResponse.json({ error: "Missing memberId or movie" }, { status: 400 });
  }

  await db.execute({
    sql: `INSERT OR IGNORE INTO watched_movies (member_id, tmdb_id, title, poster_path, vote_average, certification)
          VALUES (?, ?, ?, ?, ?, ?)`,
    args: [memberId, movie.id, movie.title, movie.poster_path, movie.vote_average, movie.certification || "NR"],
  });

  await db.execute({
    sql: "UPDATE recommendations SET is_active = 0 WHERE member_id = ? AND tmdb_id = ?",
    args: [memberId, movie.id],
  });

  const [age, likedRows, watchedRows, dislikedRows, recsRows] = await Promise.all([
    getMemberAge(memberId),
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
    return NextResponse.json({ replacement: null });
  }

  const suggestions = await getReplacementMoviesAI(
    context,
    currentRecTitles,
    watchedTitles,
    dislikedTitles,
    1,
    age
  );

  const movies = await resolveAISuggestions(suggestions);
  const allowed = movies.filter((m) => isMovieAllowed(m.certification, age));
  const replacement = allowed[0] || null;

  if (replacement) {
    await db.execute({
      sql: `INSERT INTO recommendations (member_id, tmdb_id, title, poster_path, vote_average, certification, overview, category)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [memberId, replacement.id, replacement.title, replacement.poster_path, replacement.vote_average, replacement.certification, replacement.overview, category],
    });
  }

  return NextResponse.json({ replacement });
}

// Get watched movies for a member
export async function GET(req: NextRequest) {
  const memberId = req.nextUrl.searchParams.get("memberId");
  if (!memberId) {
    return NextResponse.json({ error: "Missing memberId" }, { status: 400 });
  }

  const rows = await db.execute({
    sql: "SELECT * FROM watched_movies WHERE member_id = ? ORDER BY watched_at DESC",
    args: [memberId],
  });

  return NextResponse.json(rows.rows);
}
