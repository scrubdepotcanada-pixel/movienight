import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";

// Reverse the DB effects of a single swipe (one level — called right after
// /api/movies/watched or /api/movies/dislike for the same movie).
export async function POST(req: NextRequest) {
  const { memberId, movie, category = "general", contentType = "movie", direction } = await req.json();

  if (!memberId || !movie || (direction !== "left" && direction !== "right")) {
    return NextResponse.json({ error: "Missing memberId, movie, or direction" }, { status: 400 });
  }

  if (direction === "right") {
    await db.execute({
      sql: "DELETE FROM watched_movies WHERE member_id = ? AND tmdb_id = ? AND content_type = ?",
      args: [memberId, movie.id, contentType],
    });
    await db.execute({
      sql: "DELETE FROM liked_movies WHERE member_id = ? AND title = ? AND category = ? AND content_type = ?",
      args: [memberId, movie.title, category, contentType],
    });
  } else {
    await db.execute({
      sql: "DELETE FROM disliked_movies WHERE member_id = ? AND tmdb_id = ? AND category = ? AND content_type = ?",
      args: [memberId, movie.id, category, contentType],
    });
    await db.execute({
      sql: "DELETE FROM watched_movies WHERE member_id = ? AND tmdb_id = ? AND content_type = ?",
      args: [memberId, movie.id, contentType],
    });
  }

  await db.execute({
    sql: "UPDATE recommendations SET is_active = 1 WHERE member_id = ? AND tmdb_id = ? AND content_type = ?",
    args: [memberId, movie.id, contentType],
  });

  return NextResponse.json({ ok: true });
}
