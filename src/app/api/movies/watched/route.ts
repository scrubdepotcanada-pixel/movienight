import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";

// Mark a movie or show as watched/liked (swipe right on Your Next Watch)
export async function POST(req: NextRequest) {
  const { memberId, movie, category = "general", contentType = "movie" } = await req.json();

  if (!memberId || !movie) {
    return NextResponse.json({ error: "Missing memberId or movie" }, { status: 400 });
  }

  await db.execute({
    sql: `INSERT OR IGNORE INTO watched_movies (member_id, tmdb_id, title, poster_path, vote_average, certification, content_type)
          VALUES (?, ?, ?, ?, ?, ?, ?)`,
    args: [memberId, movie.id, movie.title, movie.poster_path, movie.vote_average, movie.certification || "NR", contentType],
  });

  await db.execute({
    sql: "INSERT INTO liked_movies (member_id, title, category, content_type) VALUES (?, ?, ?, ?)",
    args: [memberId, movie.title, category, contentType],
  });

  await db.execute({
    sql: "UPDATE recommendations SET is_active = 0 WHERE member_id = ? AND tmdb_id = ? AND content_type = ?",
    args: [memberId, movie.id, contentType],
  });

  return NextResponse.json({ ok: true });
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
