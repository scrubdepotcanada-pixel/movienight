import { NextRequest, NextResponse } from "next/server";
import { getOrCreateFamily } from "@/lib/session";
import db from "@/lib/db";
import { getFamilyPremiumStatus } from "@/lib/premium";

export async function GET(req: NextRequest) {
  const familyId = await getOrCreateFamily();
  if (!familyId) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const premium = await getFamilyPremiumStatus(familyId);
  if (!premium.isPremium) {
    return NextResponse.json({ error: "PREMIUM_REQUIRED", message: "Upgrade to see your taste profile" }, { status: 403 });
  }

  const memberId = req.nextUrl.searchParams.get("memberId");
  if (!memberId) return NextResponse.json({ error: "memberId required" }, { status: 400 });

  const member = await db.execute({
    sql: "SELECT id FROM members WHERE id = ? AND family_id = ?",
    args: [memberId, familyId],
  });
  if (member.rows.length === 0) return NextResponse.json({ error: "Member not found" }, { status: 404 });

  const [liked, disliked, watched, watchlist] = await Promise.all([
    db.execute({ sql: "SELECT category, COUNT(*) as count FROM liked_movies WHERE member_id = ? GROUP BY category", args: [memberId] }),
    db.execute({ sql: "SELECT category, COUNT(*) as count FROM disliked_movies WHERE member_id = ? GROUP BY category", args: [memberId] }),
    db.execute({ sql: "SELECT content_type, COUNT(*) as count FROM watched_movies WHERE member_id = ? GROUP BY content_type", args: [memberId] }),
    db.execute({ sql: "SELECT COUNT(*) as count FROM watchlist WHERE member_id = ?", args: [memberId] }),
  ]);

  const totalLiked = liked.rows.reduce((s, r) => s + Number(r.count), 0);
  const totalDisliked = disliked.rows.reduce((s, r) => s + Number(r.count), 0);
  const totalWatched = watched.rows.reduce((s, r) => s + Number(r.count), 0);
  const totalWatchlist = Number(watchlist.rows[0]?.count || 0);

  const favoriteGenres = liked.rows
    .filter(r => String(r.category) !== "general")
    .sort((a, b) => Number(b.count) - Number(a.count))
    .slice(0, 5)
    .map(r => ({ genre: String(r.category), count: Number(r.count) }));

  const avoidedGenres = disliked.rows
    .filter(r => String(r.category) !== "general")
    .sort((a, b) => Number(b.count) - Number(a.count))
    .slice(0, 5)
    .map(r => ({ genre: String(r.category), count: Number(r.count) }));

  return NextResponse.json({
    totalLiked,
    totalDisliked,
    totalWatched,
    totalWatchlist,
    favoriteGenres,
    avoidedGenres,
    moviesWatched: Number(watched.rows.find(r => r.content_type === "movie")?.count || 0),
    showsWatched: Number(watched.rows.find(r => r.content_type === "show")?.count || 0),
  });
}
