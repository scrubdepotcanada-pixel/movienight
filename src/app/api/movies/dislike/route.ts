import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";

const VALID_FEEDBACK_TYPES = new Set(["disliked", "less_like_this"]);

// Mark a movie or show as not interested (swipe left on Your Next Watch),
// a softer "Less like this" (feedbackType: "less_like_this"), or "Already
// watched" (action: "already_watched") — all three exclude the title from
// future recommendations, but only the first two are negative taste signals.
// "Already watched" is neutral: it's recorded in watched_movies only, never
// in disliked_movies, so it's never treated as something the user disliked.
export async function POST(req: NextRequest) {
  const { memberId, movie, category = "general", contentType = "movie", feedbackType = "disliked", action = "dislike" } = await req.json();

  if (!memberId || !movie) {
    return NextResponse.json({ error: "Missing memberId or movie" }, { status: 400 });
  }

  const isAlreadyWatched = action === "already_watched";

  if (!isAlreadyWatched) {
    const ft = VALID_FEEDBACK_TYPES.has(feedbackType) ? feedbackType : "disliked";
    await db.execute({
      sql: "INSERT OR IGNORE INTO disliked_movies (member_id, tmdb_id, title, category, content_type, feedback_type) VALUES (?, ?, ?, ?, ?, ?)",
      args: [memberId, movie.id, movie.title, category, contentType, ft],
    });
  }

  // Exclude from future recommendations either way
  await db.execute({
    sql: `INSERT OR IGNORE INTO watched_movies (member_id, tmdb_id, title, poster_path, vote_average, certification, content_type, feedback_type)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [memberId, movie.id, movie.title, movie.poster_path, movie.vote_average, movie.certification || "NR", contentType, isAlreadyWatched ? "already_watched" : "watched"],
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
