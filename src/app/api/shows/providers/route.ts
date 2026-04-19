import { NextRequest, NextResponse } from "next/server";
import { getTVWatchProviders } from "@/lib/tmdb";

export async function GET(req: NextRequest) {
  const showId = req.nextUrl.searchParams.get("showId");
  const region = req.nextUrl.searchParams.get("region") || "CA";

  if (!showId) {
    return NextResponse.json({ error: "Missing showId" }, { status: 400 });
  }

  const providers = await getTVWatchProviders(Number(showId), region);
  return NextResponse.json(providers);
}
