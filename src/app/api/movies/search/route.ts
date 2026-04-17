import { NextRequest, NextResponse } from "next/server";
import { searchMovies, enrichWithCertifications } from "@/lib/tmdb";

export async function GET(req: NextRequest) {
  const query = req.nextUrl.searchParams.get("q");
  if (!query) {
    return NextResponse.json({ error: "Missing query" }, { status: 400 });
  }

  const locale = req.cookies.get("locale")?.value;

  const results = await searchMovies(query, locale);
  const top = results.slice(0, 8);
  const enriched = await enrichWithCertifications(top, locale);

  return NextResponse.json(enriched);
}
