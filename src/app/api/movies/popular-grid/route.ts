import { NextRequest, NextResponse } from "next/server";
import { discoverMovies } from "@/lib/tmdb";

export async function GET(req: NextRequest) {
  const locale = req.cookies.get("locale")?.value;
  const page = Number(req.nextUrl.searchParams.get("page") || "1");
  const genre = req.nextUrl.searchParams.get("genre");

  const movies = await discoverMovies({
    genre: genre ? Number(genre) : undefined,
    sortBy: "popularity.desc",
    minVoteCount: 1000,
  }, locale, page);

  const withPosters = movies.filter((m) => m.poster_path);
  return NextResponse.json({ movies: withPosters });
}
