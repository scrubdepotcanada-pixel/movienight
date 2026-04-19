import { NextRequest, NextResponse } from "next/server";
import { getOrCreateFamily } from "@/lib/session";
import db from "@/lib/db";
import { getFamilyPremiumStatus } from "@/lib/premium";

export async function GET(req: NextRequest) {
  const familyId = await getOrCreateFamily();
  if (!familyId) return NextResponse.json([]);

  const memberId = req.nextUrl.searchParams.get("memberId");
  if (!memberId) return NextResponse.json({ error: "memberId required" }, { status: 400 });

  const rows = await db.execute({
    sql: "SELECT * FROM watchlist WHERE member_id = ? ORDER BY added_at DESC",
    args: [memberId],
  });

  return NextResponse.json(rows.rows);
}

export async function POST(req: NextRequest) {
  const familyId = await getOrCreateFamily();
  if (!familyId) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const premium = await getFamilyPremiumStatus(familyId);
  if (!premium.isPremium) {
    return NextResponse.json({ error: "PREMIUM_REQUIRED", message: "Upgrade to use the watchlist" }, { status: 403 });
  }

  const { memberId, tmdbId, title, posterPath, voteAverage, certification, overview, releaseDate, contentType } = await req.json();

  const member = await db.execute({
    sql: "SELECT id FROM members WHERE id = ? AND family_id = ?",
    args: [memberId, familyId],
  });
  if (member.rows.length === 0) return NextResponse.json({ error: "Member not found" }, { status: 404 });

  try {
    await db.execute({
      sql: "INSERT INTO watchlist (member_id, tmdb_id, title, poster_path, vote_average, certification, overview, release_date, content_type) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
      args: [memberId, tmdbId, title, posterPath || null, voteAverage || null, certification || null, overview || null, releaseDate || null, contentType || "movie"],
    });
  } catch {
    return NextResponse.json({ error: "Already in watchlist" }, { status: 409 });
  }

  return NextResponse.json({ success: true });
}

export async function DELETE(req: NextRequest) {
  const familyId = await getOrCreateFamily();
  if (!familyId) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { memberId, tmdbId } = await req.json();

  await db.execute({
    sql: "DELETE FROM watchlist WHERE member_id = ? AND tmdb_id = ?",
    args: [memberId, tmdbId],
  });

  return NextResponse.json({ success: true });
}
