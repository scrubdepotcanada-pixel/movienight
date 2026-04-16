import { NextRequest, NextResponse } from "next/server";
import { searchMovies, enrichWithCertifications } from "@/lib/tmdb";

export async function GET(req: NextRequest) {
  const query = req.nextUrl.searchParams.get("q");
  if (!query) {
    return NextResponse.json({ error: "Missing query" }, { status: 400 });
  }

  const results = await searchMovies(query);
  const top = results.slice(0, 8);
  const enriched = await enrichWithCertifications(top);

  return NextResponse.json(enriched);
}
