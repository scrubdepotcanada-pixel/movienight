import { NextRequest, NextResponse } from "next/server";
import { getPopularMovies, getTopRatedMovies, getTrendingMovies, discoverMovies } from "@/lib/tmdb";

export async function GET(req: NextRequest) {
  const locale = req.cookies.get("locale")?.value;
  const page = Number(req.nextUrl.searchParams.get("page") || "1");
  const genre = req.nextUrl.searchParams.get("genre");

  if (genre) {
    const movies = await discoverMovies({
      genre: Number(genre),
      sortBy: "popularity.desc",
    }, locale, page);

    const withPosters = movies.filter((m) => m.poster_path);
    return NextResponse.json({ movies: withPosters });
  }

  const [popular, topRated, trending] = await Promise.all([
    getPopularMovies(page, locale),
    getTopRatedMovies(page, locale),
    getTrendingMovies(page, locale),
  ]);

  const seen = new Set<number>();
  const combined: typeof popular = [];

  for (const movie of [...trending, ...popular, ...topRated]) {
    if (!seen.has(movie.id) && movie.poster_path) {
      seen.add(movie.id);
      combined.push(movie);
    }
  }

  const shuffled = combined.sort(() => Math.random() - 0.5).slice(0, 30);
  return NextResponse.json({ movies: shuffled });
}
