import { NextRequest, NextResponse } from "next/server";
import { resolveAISuggestions, resolveAIShowSuggestions, getWatchProviders, getTVWatchProviders, type WatchProviders } from "@/lib/tmdb";
import { getMoodRecommendationsAI } from "@/lib/openai";
import { getMemberRestrictions } from "@/lib/member";
import { isMovieAllowed, type MaxRating } from "@/lib/ageRating";
import db from "@/lib/db";

const VALID_RATINGS = new Set(["G", "PG", "PG-13", "R", "NC-17"]);

export async function POST(req: NextRequest) {
  const { memberId, mood, category = "mood", contentType = "movie", guestMaxRating } = await req.json();

  if (!mood || typeof mood !== "string" || mood.trim().length === 0) {
    return NextResponse.json({ error: "Missing mood" }, { status: 400 });
  }

  const ct = contentType === "show" ? "show" : "movie";
  const locale = req.cookies.get("locale")?.value;

  let maxRating: MaxRating | null = VALID_RATINGS.has(guestMaxRating) ? guestMaxRating : null;
  let watchedTitles: string[] = [];
  let dislikedTitles: string[] = [];
  let excludeIds = new Set<number>();

  if (memberId) {
    const [restrictions, watchedRows, dislikedRows] = await Promise.all([
      getMemberRestrictions(memberId),
      db.execute({ sql: "SELECT tmdb_id, title FROM watched_movies WHERE member_id = ? AND content_type = ?", args: [memberId, ct] }),
      db.execute({ sql: "SELECT tmdb_id, title FROM disliked_movies WHERE member_id = ? AND content_type = ?", args: [memberId, ct] }),
    ]);
    maxRating = restrictions.maxRating;
    watchedTitles = watchedRows.rows.map((r) => String(r.title));
    dislikedTitles = dislikedRows.rows.map((r) => String(r.title));
    excludeIds = new Set([
      ...watchedRows.rows.map((r) => Number(r.tmdb_id)),
      ...dislikedRows.rows.map((r) => Number(r.tmdb_id)),
    ]);
  }

  const suggestions = await getMoodRecommendationsAI(mood, ct, watchedTitles, dislikedTitles, maxRating);

  const allResults = ct === "show"
    ? await resolveAIShowSuggestions(suggestions, locale)
    : await resolveAISuggestions(suggestions, locale);

  // Hard exclusion backstop, same pattern as /api/movies/for-you — the AI
  // prompt's "don't suggest these" instruction is soft and can be ignored.
  const excludeTitles = new Set([...watchedTitles, ...dislikedTitles].map((t) => t.toLowerCase()));

  const results = allResults
    .filter((m) => !excludeIds.has(m.id) && !excludeTitles.has(m.title.toLowerCase()))
    .filter((m) => isMovieAllowed(m.certification, maxRating))
    .slice(0, 20)
    .map((m) => ({ ...m, reason: m.reason || `Matches your mood: "${mood}"` }));

  const providers: Record<number, WatchProviders> = {};
  await Promise.all(
    results.map(async (m) => {
      providers[m.id] = ct === "show" ? await getTVWatchProviders(m.id, "CA") : await getWatchProviders(m.id, "CA");
    })
  );

  if (memberId) {
    await db.execute({
      sql: "UPDATE recommendations SET is_active = 0 WHERE member_id = ? AND category = ? AND content_type = ?",
      args: [memberId, category, ct],
    });

    for (const movie of results) {
      await db.execute({
        sql: `INSERT INTO recommendations (member_id, tmdb_id, title, poster_path, vote_average, certification, overview, release_date, category, content_type, reason)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [memberId, movie.id, movie.title, movie.poster_path, movie.vote_average, movie.certification, movie.overview, movie.release_date || null, category, ct, movie.reason || null],
      });
    }
  }

  return NextResponse.json({
    movies: results.map((m) => ({ ...m, providers: providers[m.id] || {} })),
  });
}
