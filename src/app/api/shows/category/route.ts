import { NextRequest, NextResponse } from "next/server";
import { resolveAIShowSuggestions } from "@/lib/tmdb";
import { getCategoryShowsAI } from "@/lib/openai";
import { getMemberRestrictions } from "@/lib/member";
import { isMovieAllowed } from "@/lib/ageRating";
import db from "@/lib/db";

export async function GET(req: NextRequest) {
  const category = req.nextUrl.searchParams.get("category");
  const memberId = req.nextUrl.searchParams.get("memberId");
  if (!category || !memberId) {
    return NextResponse.json({ error: "Missing category or memberId" }, { status: 400 });
  }

  try {
    const [{ maxRating }, watchedRows, dislikedRows] = await Promise.all([
      getMemberRestrictions(memberId),
      db.execute({
        sql: "SELECT title FROM watched_movies WHERE member_id = ? AND content_type = 'show'",
        args: [memberId],
      }),
      db.execute({
        sql: "SELECT title FROM disliked_movies WHERE member_id = ? AND category = ?",
        args: [memberId, category],
      }),
    ]);

    const watchedTitles = watchedRows.rows.map((r) => String(r.title));
    const dislikedTitles = dislikedRows.rows.map((r) => String(r.title));

    const locale = req.cookies.get("locale")?.value;

    const suggestions = await getCategoryShowsAI(category, watchedTitles, dislikedTitles, maxRating);
    const allShows = await resolveAIShowSuggestions(suggestions, locale);
    const shows = allShows.filter((m) => isMovieAllowed(m.certification, maxRating)).slice(0, 6);

    await db.execute({
      sql: "UPDATE recommendations SET is_active = 0 WHERE member_id = ? AND category = ? AND content_type = 'show'",
      args: [memberId, category],
    });

    for (const show of shows) {
      await db.execute({
        sql: `INSERT INTO recommendations (member_id, tmdb_id, title, poster_path, vote_average, certification, overview, release_date, category, content_type)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'show')`,
        args: [memberId, show.id, show.title, show.poster_path, show.vote_average, show.certification, show.overview, show.release_date || null, category],
      });
    }

    return NextResponse.json({ movies: shows });
  } catch (err) {
    console.error("Category show recommendation error:", err);
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
