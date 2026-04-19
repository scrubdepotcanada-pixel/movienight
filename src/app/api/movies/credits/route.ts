import { NextRequest, NextResponse } from "next/server";
import { getMovieCredits } from "@/lib/tmdb";

export async function GET(req: NextRequest) {
  const movieId = req.nextUrl.searchParams.get("movieId");
  if (!movieId) return NextResponse.json({ error: "movieId required" }, { status: 400 });

  const credits = await getMovieCredits(Number(movieId));
  return NextResponse.json(credits);
}
