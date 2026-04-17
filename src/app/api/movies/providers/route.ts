import { NextRequest, NextResponse } from "next/server";
import { getWatchProviders } from "@/lib/tmdb";

export async function GET(req: NextRequest) {
  const movieId = req.nextUrl.searchParams.get("movieId");
  const region = req.nextUrl.searchParams.get("region") || "CA";

  if (!movieId) {
    return NextResponse.json({ error: "Missing movieId" }, { status: 400 });
  }

  const providers = await getWatchProviders(Number(movieId), region);
  return NextResponse.json(providers);
}
