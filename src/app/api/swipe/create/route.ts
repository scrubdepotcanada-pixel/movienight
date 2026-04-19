import { NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import db from "@/lib/db";
import { getFamilySwipeMoviesAI } from "@/lib/openai";
import { resolveAISuggestions, resolveAIShowSuggestions } from "@/lib/tmdb";
import { isMovieAllowed, defaultMaxRatingForAge, type MaxRating } from "@/lib/ageRating";

const RATING_STRICTNESS = ["G", "PG", "PG-13", "R", "NC-17"] as const;

function getStrictestRating(members: { max_rating: unknown; age: unknown }[]): MaxRating | null {
  let strictestIdx: number | null = null;

  for (const m of members) {
    const explicit = m.max_rating ? (String(m.max_rating) as MaxRating) : null;
    const age = typeof m.age === "number" ? m.age : m.age ? Number(m.age) : null;
    const rating = explicit || (age != null ? defaultMaxRatingForAge(age) : null);

    if (!rating || rating === "ALL") continue;

    const idx = RATING_STRICTNESS.indexOf(rating as typeof RATING_STRICTNESS[number]);
    if (idx === -1) continue;

    if (strictestIdx === null || idx < strictestIdx) {
      strictestIdx = idx;
    }
  }

  if (strictestIdx === null) return null;
  return RATING_STRICTNESS[strictestIdx] as MaxRating;
}

export async function POST(req: NextRequest) {
  const { familyId, category, contentType } = await req.json();

  if (!familyId) {
    return NextResponse.json({ error: "Missing familyId" }, { status: 400 });
  }

  try {
    const memberRows = await db.execute({
      sql: "SELECT * FROM members WHERE family_id = ? ORDER BY created_at ASC",
      args: [familyId],
    });

    const members = memberRows.rows;
    if (members.length === 0) {
      return NextResponse.json({ error: "No members found for this family" }, { status: 400 });
    }

    const strictestRating = getStrictestRating(
      members.map((m) => ({ max_rating: m.max_rating, age: m.age }))
    );

    const effectiveCategory = category || "general";
    const effectiveContentType = contentType || "movie";

    // Gather watched titles across all members to exclude
    const watchedRows = await db.execute({
      sql: `SELECT DISTINCT title FROM watched_movies WHERE member_id IN (${members.map(() => "?").join(",")})`,
      args: members.map((m) => m.id),
    });
    const watchedTitles = watchedRows.rows.map((r) => String(r.title));

    const suggestions = await getFamilySwipeMoviesAI(
      effectiveCategory === "general" ? null : effectiveCategory,
      effectiveContentType as "movie" | "show",
      watchedTitles,
      strictestRating
    );

    const locale = req.cookies.get("locale")?.value;

    const resolved = effectiveContentType === "show"
      ? await resolveAIShowSuggestions(suggestions, locale)
      : await resolveAISuggestions(suggestions, locale);

    const candidates = resolved
      .filter((m) => isMovieAllowed(m.certification, strictestRating))
      .slice(0, 15);

    const sessionId = uuidv4();

    await db.execute({
      sql: "INSERT INTO swipe_sessions (id, family_id, category, content_type, status) VALUES (?, ?, ?, ?, 'active')",
      args: [sessionId, familyId, effectiveCategory, effectiveContentType],
    });

    for (const movie of candidates) {
      await db.execute({
        sql: `INSERT INTO swipe_candidates (session_id, tmdb_id, title, poster_path, vote_average, certification, overview, release_date)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [
          sessionId,
          movie.id,
          movie.title,
          movie.poster_path,
          movie.vote_average,
          movie.certification,
          movie.overview,
          movie.release_date || null,
        ],
      });
    }

    return NextResponse.json({
      sessionId,
      candidates: candidates.map((m) => ({
        tmdb_id: m.id,
        title: m.title,
        poster_path: m.poster_path,
        vote_average: m.vote_average,
        certification: m.certification,
        overview: m.overview,
        release_date: m.release_date,
      })),
      members: members.map((m) => ({
        id: m.id,
        name: m.name,
        avatar: m.avatar,
      })),
    });
  } catch (err) {
    console.error("Swipe session creation error:", err);
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
