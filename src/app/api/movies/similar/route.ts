import { NextRequest, NextResponse } from "next/server";
import { resolveAISuggestions } from "@/lib/tmdb";
import { getSimilarMoviesAI } from "@/lib/openai";
import db from "@/lib/db";

export async function GET(req: NextRequest) {
  const movieTitle = req.nextUrl.searchParams.get("movieTitle");
  const memberId = req.nextUrl.searchParams.get("memberId");
  if (!movieTitle || !memberId) {
    return NextResponse.json({ error: "Missing movieTitle or memberId" }, { status: 400 });
  }

  const [watchedRows, dislikedRows] = await Promise.all([
    db.execute({
      sql: "SELECT title FROM watched_movies WHERE member_id = ?",
      args: [memberId],
    }),
    db.execute({
      sql: "SELECT title FROM disliked_movies WHERE member_id = ?",
      args: [memberId],
    }),
  ]);

  const watchedTitles = watchedRows.rows.map((r) => String(r.title));
  const dislikedTitles = dislikedRows.rows.map((r) => String(r.title));

  const suggestions = await getSimilarMoviesAI(movieTitle, watchedTitles, dislikedTitles);
  const movies = await resolveAISuggestions(suggestions);

  return NextResponse.json(movies);
}
