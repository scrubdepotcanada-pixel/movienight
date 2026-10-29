import { NextRequest, NextResponse } from "next/server";
import { discoverMovies, enrichWithCertifications, ANIMATION_GENRE_ID, type Movie } from "@/lib/tmdb";
import { isMovieAllowed, type MaxRating } from "@/lib/ageRating";

const TOP_RATED_MIN_YEAR = 2000;
const NEW_FILMS_MAX_AGE_YEARS = 2; // "new" = released in roughly the last 2 years
const VALID_RATINGS = new Set(["G", "PG", "PG-13", "R", "NC-17"]);

export async function GET(req: NextRequest) {
  const locale = req.cookies.get("locale")?.value;
  const page = Number(req.nextUrl.searchParams.get("page") || "1");
  const genre = req.nextUrl.searchParams.get("genre");
  const genreId = genre ? Number(genre) : undefined;
  const excludeGenre = genreId && genreId !== ANIMATION_GENRE_ID ? ANIMATION_GENRE_ID : undefined;
  const maxRatingParam = req.nextUrl.searchParams.get("maxRating");
  const maxRating: MaxRating | undefined = maxRatingParam && VALID_RATINGS.has(maxRatingParam) ? (maxRatingParam as MaxRating) : undefined;

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
      maxRating,
    }, locale, page),
    discoverMovies({
      genre: genreId,
      excludeGenre,
      sortBy: "vote_average.desc",
      minVoteCount: 1000,
      minYear: TOP_RATED_MIN_YEAR,
      maxRating,
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

  // TMDB's certification.lte discover filter is unreliable on its own — many
  // titles have no certification data for the queried country and slip
  // through (this is the exact gap that let an R-rated title appear under a
  // "Kids" cap). Re-check every result against the cap directly, same as
  // every recommendation route already does.
  if (!maxRating) {
    return NextResponse.json({ movies: combined });
  }
  const enriched = await enrichWithCertifications(combined, locale);
  const allowed = enriched.filter((m) => isMovieAllowed(m.certification, maxRating));
  return NextResponse.json({ movies: allowed });
}
