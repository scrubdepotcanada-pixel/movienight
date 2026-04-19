import { NextRequest, NextResponse } from "next/server";
import { searchTVShows, enrichTVShowsWithCertifications } from "@/lib/tmdb";

export async function GET(req: NextRequest) {
  const query = req.nextUrl.searchParams.get("q");
  if (!query) {
    return NextResponse.json({ error: "Missing query" }, { status: 400 });
  }

  const locale = req.cookies.get("locale")?.value;

  const results = await searchTVShows(query, locale);
  const top = results.slice(0, 8);
  const enriched = await enrichTVShowsWithCertifications(top, locale);

  return NextResponse.json(enriched);
}
