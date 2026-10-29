import { NextRequest, NextResponse } from "next/server";
import { getOrCreateFamily } from "@/lib/session";
import { getFamilyPremiumStatus } from "@/lib/premium";
import { discoverMovies, enrichWithCertifications, getGenreId, getWatchProviders, type WatchProviders } from "@/lib/tmdb";
import { getMemberRestrictions } from "@/lib/member";
import { isMovieAllowed, type MaxRating } from "@/lib/ageRating";

const VALID_RATINGS = new Set(["G", "PG", "PG-13", "R", "NC-17"]);

export async function GET(req: NextRequest) {
  const familyId = await getOrCreateFamily();
  if (!familyId) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const locale = req.cookies.get("locale")?.value;
  const genreName = req.nextUrl.searchParams.get("genre") || undefined;
  const decade = req.nextUrl.searchParams.get("decade") || undefined;
  const minRating = req.nextUrl.searchParams.get("minRating");
  const maxRuntime = req.nextUrl.searchParams.get("maxRuntime");
  const providerId = req.nextUrl.searchParams.get("providerId");
  const providerName = req.nextUrl.searchParams.get("providerName") || undefined;
  const personId = req.nextUrl.searchParams.get("personId");
  const language = req.nextUrl.searchParams.get("language") || undefined;
  const languageName = req.nextUrl.searchParams.get("languageName") || undefined;

  // Platform filter is free for signed-in users; all other filters require premium
  const hasPremiumFilter = decade || minRating || maxRuntime || personId || language;
  const premium = await getFamilyPremiumStatus(familyId);
  if (hasPremiumFilter && !premium.isPremium) {
    return NextResponse.json({ error: "PREMIUM_REQUIRED", message: "Upgrade to use advanced filters" }, { status: 403 });
  }
  const watchRegion = req.nextUrl.searchParams.get("region") ||
    req.headers.get("x-vercel-ip-country") ||
    req.headers.get("cf-ipcountry") ||
    "US";

  // Rating caps win over every filter, same as every other recommendation
  // route — a filter can never surface a title above a member's cap.
  const memberId = req.nextUrl.searchParams.get("memberId");
  const guestMaxRatingParam = req.nextUrl.searchParams.get("guestMaxRating");
  let maxRating: MaxRating | null = VALID_RATINGS.has(guestMaxRatingParam || "") ? (guestMaxRatingParam as MaxRating) : null;
  if (memberId) {
    const restrictions = await getMemberRestrictions(memberId);
    maxRating = restrictions.maxRating;
  }

  const movies = await discoverMovies({
    genre: genreName ? getGenreId(genreName) : undefined,
    decade,
    minRating: minRating ? Number(minRating) : undefined,
    maxRuntime: maxRuntime ? Number(maxRuntime) : undefined,
    providerId: providerId ? Number(providerId) : undefined,
    personId: personId ? Number(personId) : undefined,
    language,
    watchRegion,
    maxRating: maxRating || undefined,
  }, locale);

  const enriched = await enrichWithCertifications(movies.slice(0, 20), locale);
  // Defense in depth — TMDB's certification filter can be incomplete, so
  // re-check every result against the cap rather than trusting it alone.
  const allowed = enriched.filter((m) => isMovieAllowed(m.certification, maxRating)).slice(0, 12);

  const reason = providerName
    ? `Available on ${providerName}`
    : languageName
      ? `${languageName}-language pick`
      : minRating
        ? `Rated ${minRating}+ and matches your filters`
        : maxRuntime
          ? `Under ${maxRuntime} minutes and matches your filters`
          : "Matches your filters";

  const providers: Record<number, WatchProviders> = {};
  await Promise.all(
    allowed.map(async (m) => {
      providers[m.id] = await getWatchProviders(m.id, watchRegion);
    })
  );

  return NextResponse.json({
    movies: allowed.map((m) => ({ ...m, reason, providers: providers[m.id] || {} })),
  });
}
