import { NextRequest, NextResponse } from "next/server";
import { getOrCreateFamily } from "@/lib/session";
import { getFamilyPremiumStatus } from "@/lib/premium";
import { discoverMovies, enrichWithCertifications, getGenreId } from "@/lib/tmdb";

export async function GET(req: NextRequest) {
  const familyId = await getOrCreateFamily();
  if (!familyId) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const premium = await getFamilyPremiumStatus(familyId);
  if (!premium.isPremium) {
    return NextResponse.json({ error: "PREMIUM_REQUIRED", message: "Upgrade to use advanced filters" }, { status: 403 });
  }

  const locale = req.cookies.get("locale")?.value;
  const genreName = req.nextUrl.searchParams.get("genre") || undefined;
  const decade = req.nextUrl.searchParams.get("decade") || undefined;
  const minRating = req.nextUrl.searchParams.get("minRating");
  const maxRuntime = req.nextUrl.searchParams.get("maxRuntime");
  const providerId = req.nextUrl.searchParams.get("providerId");
  const personId = req.nextUrl.searchParams.get("personId");
  const watchRegion = req.nextUrl.searchParams.get("region") ||
    req.headers.get("x-vercel-ip-country") ||
    req.headers.get("cf-ipcountry") ||
    "US";

  const movies = await discoverMovies({
    genre: genreName ? getGenreId(genreName) : undefined,
    decade,
    minRating: minRating ? Number(minRating) : undefined,
    maxRuntime: maxRuntime ? Number(maxRuntime) : undefined,
    providerId: providerId ? Number(providerId) : undefined,
    personId: personId ? Number(personId) : undefined,
    watchRegion,
  }, locale);

  const enriched = await enrichWithCertifications(movies.slice(0, 12), locale);
  return NextResponse.json(enriched);
}
