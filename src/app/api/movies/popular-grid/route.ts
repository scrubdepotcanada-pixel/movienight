import { NextRequest, NextResponse } from "next/server";
import { discoverMovies, ANIMATION_GENRE_ID, type Movie } from "@/lib/tmdb";

const TOP_RATED_MIN_YEAR = 2000;
const NEW_FILMS_MAX_AGE_YEARS = 2; // "new" = released in roughly the last 2 years

export async function GET(req: NextRequest) {
  const locale = req.cookies.get("locale")?.value;
  const page = Number(req.nextUrl.searchParams.get("page") || "1");
  const genre = req.nextUrl.searchParams.get("genre");
  const genreId = genre ? Number(genre) : undefined;
  const excludeGenre = genreId && genreId !== ANIMATION_GENRE_ID ? ANIMATION_GENRE_ID : undefined;

  const newFilmsMinYear = new Date().getFullYear() - NEW_FILMS_MAX_AGE_YEARS;

  // Two buckets fetched in parallel: recent releases (by popularity) and
  // all-time top-rated films from 2000 onward (by rating) — then interleaved
  // so the grid is a genuine mix, not front-loaded with just one or the other.
  const [newFilms, topRated] = await Promise.all([
    discoverMovies({
      genre: genreId,
      excludeGenre,
      sortBy: "popularity.desc",
      minVoteCount: 300,
      minYear: newFilmsMinYear,
    }, locale, page),
    discoverMovies({
      genre: genreId,
      excludeGenre,
      sortBy: "vote_average.desc",
      minVoteCount: 1000,
      minYear: TOP_RATED_MIN_YEAR,
    }, locale, page),
  ]);

  const seen = new Set<number>();
  const combined: Movie[] = [];
  const maxLen = Math.max(newFilms.length, topRated.length);
  for (let i = 0; i < maxLen; i++) {
    const nf = newFilms[i];
    if (nf && nf.poster_path && !seen.has(nf.id)) {
      seen.add(nf.id);
      combined.push(nf);
    }
    const tr = topRated[i];
    if (tr && tr.poster_path && !seen.has(tr.id)) {
      seen.add(tr.id);
      combined.push(tr);
    }
  }

  return NextResponse.json({ movies: combined });
}
