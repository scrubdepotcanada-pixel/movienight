import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";

// Mark a movie or show as not interested (swipe left on Your Next Watch)
export async function POST(req: NextRequest) {
  const { memberId, movie, category = "general", contentType = "movie" } = await req.json();

  if (!memberId || !movie) {
    return NextResponse.json({ error: "Missing memberId or movie" }, { status: 400 });
  }

  await db.execute({
    sql: "INSERT OR IGNORE INTO disliked_movies (member_id, tmdb_id, title, category, content_type) VALUES (?, ?, ?, ?, ?)",
    args: [memberId, movie.id, movie.title, category, contentType],
  });

  // Not interested = exclude from future recommendations
  await db.execute({
    sql: `INSERT OR IGNORE INTO watched_movies (member_id, tmdb_id, title, poster_path, vote_average, certification, content_type)
          VALUES (?, ?, ?, ?, ?, ?, ?)`,
    args: [memberId, movie.id, movie.title, movie.poster_path, movie.vote_average, movie.certification || "NR", contentType],
  });

  await db.execute({
    sql: "UPDATE recommendations SET is_active = 0 WHERE member_id = ? AND tmdb_id = ? AND content_type = ?",
    args: [memberId, movie.id, contentType],
  });

  return NextResponse.json({ ok: true });
}

// Remove a dislike
export async function DELETE(req: NextRequest) {
  const { memberId, tmdbId, category = "general" } = await req.json();

  if (!memberId || !tmdbId) {
    return NextResponse.json({ error: "Missing memberId or tmdbId" }, { status: 400 });
  }

  await db.execute({
    sql: "DELETE FROM disliked_movies WHERE member_id = ? AND tmdb_id = ? AND category = ?",
    args: [memberId, tmdbId, category],
  });

  return NextResponse.json({ success: true });
}
