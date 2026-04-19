import { NextRequest, NextResponse } from "next/server";
import { getOrCreateFamily } from "@/lib/session";
import { getFamilyPremiumStatus } from "@/lib/premium";
import { getPersonMovies, enrichWithCertifications } from "@/lib/tmdb";

export async function GET(req: NextRequest) {
  const familyId = await getOrCreateFamily();
  if (!familyId) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const premium = await getFamilyPremiumStatus(familyId);
  if (!premium.isPremium) {
    return NextResponse.json({ error: "PREMIUM_REQUIRED", message: "Upgrade to explore filmographies" }, { status: 403 });
  }

  const personId = req.nextUrl.searchParams.get("personId");
  if (!personId) return NextResponse.json({ error: "personId required" }, { status: 400 });

  const locale = req.cookies.get("locale")?.value;
  const movies = await getPersonMovies(Number(personId), locale);
  const enriched = await enrichWithCertifications(movies.slice(0, 12), locale);

  return NextResponse.json(enriched);
}
