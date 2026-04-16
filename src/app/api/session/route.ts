import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";

// Get session state for a specific member
export async function GET(req: NextRequest) {
  const memberId = req.nextUrl.searchParams.get("memberId");
  if (!memberId) {
    return NextResponse.json({ error: "Missing memberId" }, { status: 400 });
  }

  const [activeRecs, watchedCount] = await Promise.all([
    db.execute({
      sql: "SELECT * FROM recommendations WHERE member_id = ? AND is_active = 1 ORDER BY created_at DESC",
      args: [memberId],
    }),
    db.execute({
      sql: "SELECT COUNT(*) as count FROM watched_movies WHERE member_id = ?",
      args: [memberId],
    }),
  ]);

  // Get the base movie id for refreshing
  let baseMovieId = null;
  if (activeRecs.rows.length > 0) {
    baseMovieId = activeRecs.rows[0].base_movie_id;
  }

  return NextResponse.json({
    hasHistory: activeRecs.rows.length > 0 || Number(watchedCount.rows[0].count) > 0,
    activeRecommendations: activeRecs.rows,
    totalWatched: Number(watchedCount.rows[0].count),
    baseMovieId,
  });
}
