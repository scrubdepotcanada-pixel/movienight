import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { getMemberRestrictions } from "@/lib/member";
import { isMovieAllowed } from "@/lib/ageRating";

/**
 * Filter active recommendations by the member's current max_rating and
 * deactivate any that don't pass so they don't clog the pool next time.
 */
async function filterAndPruneRecs(
  memberId: string,
  rows: Record<string, unknown>[],
  maxRating: string | null
) {
  const allowed: Record<string, unknown>[] = [];
  const toDeactivate: number[] = [];
  const seenTmdbIds = new Set<number>();

  for (const rec of rows) {
    const tmdbId = Number(rec.tmdb_id);
    const cert = rec.certification ? String(rec.certification) : undefined;

    // Deduplicate by tmdb_id
    if (seenTmdbIds.has(tmdbId)) {
      toDeactivate.push(Number(rec.id));
      continue;
    }
    seenTmdbIds.add(tmdbId);

    // Filter by age rating
    if (maxRating && maxRating !== "ALL" && !isMovieAllowed(cert, maxRating as "G" | "PG" | "PG-13" | "R" | "NC-17")) {
      toDeactivate.push(Number(rec.id));
      continue;
    }

    allowed.push(rec);
  }

  // Deactivate filtered-out recs so future loads are clean
  for (const id of toDeactivate) {
    await db.execute({
      sql: "UPDATE recommendations SET is_active = 0 WHERE id = ?",
      args: [id],
    });
  }

  return allowed;
}

export async function GET(req: NextRequest) {
  const memberId = req.nextUrl.searchParams.get("memberId");
  const category = req.nextUrl.searchParams.get("category");
  if (!memberId) {
    return NextResponse.json({ error: "Missing memberId" }, { status: 400 });
  }

  const { maxRating } = await getMemberRestrictions(memberId);

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

    const filteredRecs = await filterAndPruneRecs(memberId, activeRecs.rows, maxRating);

    return NextResponse.json({
      hasHistory: filteredRecs.length > 0,
      activeRecommendations: filteredRecs,
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

  const filteredRecs = await filterAndPruneRecs(memberId, activeRecs.rows, maxRating);

  return NextResponse.json({
    hasHistory: filteredRecs.length > 0 || Number(watchedCount.rows[0].count) > 0,
    activeRecommendations: filteredRecs,
    totalWatched: Number(watchedCount.rows[0].count),
  });
}
