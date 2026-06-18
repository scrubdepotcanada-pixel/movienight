import { NextRequest, NextResponse } from "next/server";
import { getPopularMovies, getTopRatedMovies, getTrendingMovies } from "@/lib/tmdb";

export async function GET(req: NextRequest) {
  const locale = req.cookies.get("locale")?.value;

  const [popular, topRated, trending] = await Promise.all([
    getPopularMovies(locale),
    getTopRatedMovies(locale),
    getTrendingMovies(locale),
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
