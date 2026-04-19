import { NextRequest, NextResponse } from "next/server";
import { resolveAIShowSuggestions } from "@/lib/tmdb";
import { getReplacementShowsAI } from "@/lib/openai";
import { getMemberRestrictions } from "@/lib/member";
import { isMovieAllowed } from "@/lib/ageRating";
import db from "@/lib/db";

export async function POST(req: NextRequest) {
  const { memberId, count, category = "general" } = await req.json();

  if (!memberId || !count) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const [{ maxRating }, likedRows, allLikedRows, watchedRows, dislikedRows, recsRows] = await Promise.all([
    getMemberRestrictions(memberId),
    db.execute({
      sql: "SELECT DISTINCT title FROM liked_movies WHERE member_id = ? AND category = ? ORDER BY created_at DESC LIMIT 2",
      args: [memberId, category],
    }),
    db.execute({
      sql: "SELECT DISTINCT title FROM liked_movies WHERE member_id = ? AND category = ?",
      args: [memberId, category],
    }),
    db.execute({
      sql: "SELECT tmdb_id, title FROM watched_movies WHERE member_id = ? AND content_type = 'show'",
      args: [memberId],
    }),
    db.execute({
      sql: "SELECT title FROM disliked_movies WHERE member_id = ? AND category = ?",
      args: [memberId, category],
    }),
    db.execute({
      sql: "SELECT tmdb_id, title FROM recommendations WHERE member_id = ? AND is_active = 1 AND category = ? AND content_type = 'show'",
      args: [memberId, category],
    }),
  ]);

  const likedTitles = likedRows.rows.map((r) => String(r.title));
  const watchedTitles = watchedRows.rows.map((r) => String(r.title));
  const dislikedTitles = dislikedRows.rows.map((r) => String(r.title));
  const currentRecTitles = recsRows.rows.map((r) => String(r.title));

  // Build full exclude set: all liked titles + watched titles + current recs
  const allLikedTitles = new Set(allLikedRows.rows.map((r) => String(r.title)));
  const watchedIds = new Set(watchedRows.rows.map((r) => Number(r.tmdb_id)));
  const activeIds = new Set(recsRows.rows.map((r) => Number(r.tmdb_id)));

  const context = category !== "general"
    ? { category }
    : { likedShow1: likedTitles[0], likedShow2: likedTitles[1] || undefined };

  if (category === "general" && likedTitles.length < 1) {
    return NextResponse.json([]);
  }

  // Ask for extra to account for filtering
  const fetchCount = count + 3;

  const suggestions = await getReplacementShowsAI(
    context,
    [...currentRecTitles, ...Array.from(allLikedTitles)],
    watchedTitles,
    dislikedTitles,
    fetchCount,
    maxRating
  );

  const locale = req.cookies.get("locale")?.value;

  const resolved = await resolveAIShowSuggestions(suggestions, locale);

  // Filter: age-appropriate, not already active, not watched, not liked, no dupes
  const watchedTitleSet = new Set(watchedTitles);
  const seenTitles = new Set<string>();
  const filtered = resolved.filter((m) => {
    if (!isMovieAllowed(m.certification, maxRating)) return false;
    if (activeIds.has(m.id) || watchedIds.has(m.id)) return false;
    if (allLikedTitles.has(m.title) || watchedTitleSet.has(m.title)) return false;
    if (seenTitles.has(m.title)) return false;
    seenTitles.add(m.title);
    return true;
  }).slice(0, count);

  for (const show of filtered) {
    await db.execute({
      sql: `INSERT INTO recommendations (member_id, tmdb_id, title, poster_path, vote_average, certification, overview, release_date, category, content_type)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'show')`,
      args: [memberId, show.id, show.title, show.poster_path, show.vote_average, show.certification, show.overview, show.release_date || null, category],
    });
  }

  return NextResponse.json(filtered);
}
