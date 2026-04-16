import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";

export async function GET(req: NextRequest) {
  const memberId = req.nextUrl.searchParams.get("memberId");
  const category = req.nextUrl.searchParams.get("category");
  if (!memberId) {
    return NextResponse.json({ error: "Missing memberId" }, { status: 400 });
  }

  // If category provided, return category-specific data
  if (category) {
    const [activeRecs, dislikedRows, likedRows] = await Promise.all([
      db.execute({
        sql: "SELECT * FROM recommendations WHERE member_id = ? AND is_active = 1 AND category = ? ORDER BY created_at DESC",
        args: [memberId, category],
      }),
      db.execute({
        sql: "SELECT tmdb_id, title FROM disliked_movies WHERE member_id = ? AND category = ? ORDER BY created_at DESC",
        args: [memberId, category],
      }),
      db.execute({
        sql: "SELECT DISTINCT title FROM liked_movies WHERE member_id = ? AND category = ? ORDER BY created_at DESC",
        args: [memberId, category],
      }),
    ]);

    return NextResponse.json({
      hasHistory: activeRecs.rows.length > 0,
      activeRecommendations: activeRecs.rows,
      dislikedInCategory: dislikedRows.rows,
      likedInCategory: likedRows.rows,
    });
  }

  // General session state (no category filter)
  const [activeRecs, watchedCount] = await Promise.all([
    db.execute({
      sql: "SELECT * FROM recommendations WHERE member_id = ? AND is_active = 1 AND category = 'general' ORDER BY created_at DESC",
      args: [memberId],
    }),
    db.execute({
      sql: "SELECT COUNT(*) as count FROM watched_movies WHERE member_id = ?",
      args: [memberId],
    }),
  ]);

  return NextResponse.json({
    hasHistory: activeRecs.rows.length > 0 || Number(watchedCount.rows[0].count) > 0,
    activeRecommendations: activeRecs.rows,
    totalWatched: Number(watchedCount.rows[0].count),
  });
}
