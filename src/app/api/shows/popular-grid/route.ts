import { NextRequest, NextResponse } from "next/server";
import { discoverTVShows, ANIMATION_GENRE_ID, type Movie } from "@/lib/tmdb";

const TOP_RATED_MIN_YEAR = 2000;
const NEW_SHOWS_MAX_AGE_YEARS = 2; // "new" = first aired in roughly the last 2 years

export async function GET(req: NextRequest) {
  const locale = req.cookies.get("locale")?.value;
  const page = Number(req.nextUrl.searchParams.get("page") || "1");
  const genre = req.nextUrl.searchParams.get("genre");
  const genreId = genre ? Number(genre) : undefined;
  const excludeGenre = genreId && genreId !== ANIMATION_GENRE_ID ? ANIMATION_GENRE_ID : undefined;

  const newShowsMinYear = new Date().getFullYear() - NEW_SHOWS_MAX_AGE_YEARS;

  // Two buckets fetched in parallel: recent shows (by popularity) and
  // all-time top-rated shows from 2000 onward (by rating) — then interleaved
  // so the grid is a genuine mix, not front-loaded with just one or the other.
  const [newShows, topRated] = await Promise.all([
    discoverTVShows({
      genre: genreId,
      excludeGenre,
      sortBy: "popularity.desc",
      minVoteCount: 300,
      minYear: newShowsMinYear,
    }, locale, page),
    discoverTVShows({
      genre: genreId,
      excludeGenre,
      sortBy: "vote_average.desc",
      minVoteCount: 1000,
      minYear: TOP_RATED_MIN_YEAR,
    }, locale, page),
  ]);

  const seen = new Set<number>();
  const combined: Movie[] = [];
  const maxLen = Math.max(newShows.length, topRated.length);
  for (let i = 0; i < maxLen; i++) {
    const ns = newShows[i];
    if (ns && ns.poster_path && !seen.has(ns.id)) {
      seen.add(ns.id);
      combined.push(ns);
    }
    const tr = topRated[i];
    if (tr && tr.poster_path && !seen.has(tr.id)) {
      seen.add(tr.id);
      combined.push(tr);
    }
  }

  return NextResponse.json({ movies: combined });
}
