import { NextRequest, NextResponse } from "next/server";
import { searchMovies, enrichWithCertifications } from "@/lib/tmdb";
import { isMovieAllowed, type MaxRating } from "@/lib/ageRating";

const VALID_RATINGS = new Set(["G", "PG", "PG-13", "R", "NC-17"]);

export async function GET(req: NextRequest) {
  const query = req.nextUrl.searchParams.get("q");
  if (!query) {
    return NextResponse.json({ error: "Missing query" }, { status: 400 });
  }

  const locale = req.cookies.get("locale")?.value;
  const maxRatingParam = req.nextUrl.searchParams.get("maxRating");
  const maxRating: MaxRating | null = maxRatingParam && VALID_RATINGS.has(maxRatingParam) ? (maxRatingParam as MaxRating) : null;

  const results = await searchMovies(query, locale);
  const top = results.slice(0, 8);
  const enriched = await enrichWithCertifications(top, locale);
  const allowed = enriched.filter((m) => isMovieAllowed(m.certification, maxRating));

  return NextResponse.json(allowed);
}
