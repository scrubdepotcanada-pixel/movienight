import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { getMemberRestrictions } from "@/lib/member";
import { isMovieAllowed } from "@/lib/ageRating";
import { getMovieGenreIds, getShowGenreIds, conflictsWithAnimation } from "@/lib/tmdb";

async function filterAndPruneRecs(
  memberId: string,
  rows: Record<string, unknown>[],
  maxRating: string | null,
  likedTitles: Set<string>,
  watchedIds: Set<number>,
  genreId: number | null = null,
  contentType: "movie" | "show" = "movie"
) {
  const allowed: Record<string, unknown>[] = [];
  const toDeactivate: number[] = [];
  const seenTmdbIds = new Set<number>();
  const seenTitles = new Set<string>();

  for (const rec of rows) {
    const tmdbId = Number(rec.tmdb_id);
    const title = String(rec.title);
    const cert = rec.certification ? String(rec.certification) : undefined;

    // Deduplicate by ID and title
    if (seenTmdbIds.has(tmdbId) || seenTitles.has(title)) {
      toDeactivate.push(Number(rec.id));
      continue;
    }
    seenTmdbIds.add(tmdbId);
    seenTitles.add(title);

    // Skip movies already liked (user already gave feedback)
    if (likedTitles.has(title)) {
      toDeactivate.push(Number(rec.id));
      continue;
    }

    // Skip movies already watched
    if (watchedIds.has(tmdbId)) {
      toDeactivate.push(Number(rec.id));
      continue;
    }

    // Filter by age rating
    if (maxRating && maxRating !== "ALL" && !isMovieAllowed(cert, maxRating as "G" | "PG" | "PG-13" | "R" | "NC-17")) {
      toDeactivate.push(Number(rec.id));
      continue;
    }

    allowed.push(rec);
  }

  // Re-validate genre against TMDB — catches stale rows saved before genre
  // enforcement existed, or rows saved without genre metadata (for-you/more-like)
  if (genreId && allowed.length > 0) {
    const getGenreIds = contentType === "show" ? getShowGenreIds : getMovieGenreIds;
    const genreChecks = await Promise.all(
      allowed.map(async (rec) => ({
        rec,
        genreIds: await getGenreIds(Number(rec.tmdb_id)).catch(() => null),
      }))
    );
    const genreValidated: Record<string, unknown>[] = [];
    for (const { rec, genreIds } of genreChecks) {
      // If the lookup fails, keep the row rather than punish the user for a flaky API call
      if (genreIds === null) {
        genreValidated.push(rec);
        continue;
      }
      if (!genreIds.includes(genreId) || conflictsWithAnimation(genreIds, genreId)) {
        toDeactivate.push(Number(rec.id));
      } else {
        genreValidated.push(rec);
      }
    }
    allowed.length = 0;
    allowed.push(...genreValidated);
  }

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
  const contentType = req.nextUrl.searchParams.get("contentType") === "show" ? "show" : "movie";
  if (!memberId) {
    return NextResponse.json({ error: "Missing memberId" }, { status: 400 });
  }

  const { maxRating } = await getMemberRestrictions(memberId);

  // Get watched movies/shows (shared across all categories, scoped by content type)
  const watchedRows = await db.execute({
    sql: "SELECT tmdb_id FROM watched_movies WHERE member_id = ? AND content_type = ?",
    args: [memberId, contentType],
  });
  const watchedIds = new Set(watchedRows.rows.map((r) => Number(r.tmdb_id)));

  if (category) {
    const [activeRecs, dislikedRows, likedRows] = await Promise.all([
      db.execute({
        sql: "SELECT * FROM recommendations WHERE member_id = ? AND is_active = 1 AND category = ? AND content_type = ? ORDER BY created_at DESC",
        args: [memberId, category, contentType],
      }),
      db.execute({
        sql: "SELECT tmdb_id, title FROM disliked_movies WHERE member_id = ? AND category = ? AND content_type = ? ORDER BY created_at DESC",
        args: [memberId, category, contentType],
      }),
      db.execute({
        sql: "SELECT DISTINCT title FROM liked_movies WHERE member_id = ? AND category = ? AND content_type = ? ORDER BY created_at DESC",
        args: [memberId, category, contentType],
      }),
    ]);

    const likedTitles = new Set(likedRows.rows.map((r) => String(r.title)));
    const genreId = /^\d+$/.test(category) ? Number(category) : null;
    const filteredRecs = await filterAndPruneRecs(memberId, activeRecs.rows, maxRating, likedTitles, watchedIds, genreId, contentType);

    return NextResponse.json({
      hasHistory: filteredRecs.length > 0 || likedRows.rows.length > 0 || dislikedRows.rows.length > 0,
      activeRecommendations: filteredRecs,
      dislikedInCategory: dislikedRows.rows,
      likedInCategory: likedRows.rows,
    });
  }

  // General session state
  const [activeRecs, likedRows, watchedCount] = await Promise.all([
    db.execute({
      sql: "SELECT * FROM recommendations WHERE member_id = ? AND is_active = 1 AND category = 'general' AND content_type = ? ORDER BY created_at DESC",
      args: [memberId, contentType],
    }),
    db.execute({
      sql: "SELECT DISTINCT title FROM liked_movies WHERE member_id = ? AND category = 'general' AND content_type = ?",
      args: [memberId, contentType],
    }),
    db.execute({
      sql: "SELECT COUNT(*) as count FROM watched_movies WHERE member_id = ? AND content_type = ?",
      args: [memberId, contentType],
    }),
  ]);

  const likedTitles = new Set(likedRows.rows.map((r) => String(r.title)));
  const filteredRecs = await filterAndPruneRecs(memberId, activeRecs.rows, maxRating, likedTitles, watchedIds, null, contentType);

  return NextResponse.json({
    hasHistory: filteredRecs.length > 0 || Number(watchedCount.rows[0].count) > 0,
    activeRecommendations: filteredRecs,
    totalWatched: Number(watchedCount.rows[0].count),
  });
}
