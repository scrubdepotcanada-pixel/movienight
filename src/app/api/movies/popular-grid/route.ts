import { NextRequest, NextResponse } from "next/server";
import { discoverMovies, ANIMATION_GENRE_ID } from "@/lib/tmdb";

export async function GET(req: NextRequest) {
  const locale = req.cookies.get("locale")?.value;
  const page = Number(req.nextUrl.searchParams.get("page") || "1");
  const genre = req.nextUrl.searchParams.get("genre");
  const genreId = genre ? Number(genre) : undefined;

  const movies = await discoverMovies({
    genre: genreId,
    excludeGenre: genreId && genreId !== ANIMATION_GENRE_ID ? ANIMATION_GENRE_ID : undefined,
    sortBy: "popularity.desc",
    minVoteCount: 1000,
  }, locale, page);

  const withPosters = movies.filter((m) => m.poster_path);
  return NextResponse.json({ movies: withPosters });
}
