import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { isAdminEmail } from "@/lib/session";
import db, { initDB } from "@/lib/db";

export async function GET(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get("key");
  const session = await auth();
  const isAdmin = isAdminEmail(session?.user?.email);

  if (!isAdmin && secret !== process.env.ADMIN_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await initDB();

  const [
    googleUsers,
    guestSessions,
    totalMembers,
    premiumUsers,
    totalLiked,
    totalDisliked,
    totalWatched,
    totalWatchlist,
    totalSwipeSessions,
    recentSignups,
    userDetails,
  ] = await Promise.all([
    db.execute("SELECT COUNT(*) as count FROM families WHERE google_id IS NOT NULL"),
    db.execute("SELECT COUNT(*) as count FROM families WHERE google_id IS NULL"),
    db.execute("SELECT COUNT(*) as count FROM members"),
    db.execute("SELECT COUNT(*) as count FROM families WHERE premium_until IS NOT NULL AND premium_until > datetime('now')"),
    db.execute("SELECT COUNT(*) as count FROM liked_movies"),
    db.execute("SELECT COUNT(*) as count FROM disliked_movies"),
    db.execute("SELECT COUNT(*) as count FROM watched_movies"),
    db.execute("SELECT COUNT(*) as count FROM watchlist"),
    db.execute("SELECT COUNT(*) as count FROM swipe_sessions"),
    db.execute("SELECT id, email, name, created_at FROM families WHERE google_id IS NOT NULL ORDER BY created_at DESC LIMIT 20"),
    db.execute(`
      SELECT f.id, f.email, f.name, f.created_at, f.premium_until, f.subscription_plan,
        (SELECT COUNT(*) FROM members WHERE family_id = f.id) as member_count,
        (SELECT COUNT(*) FROM liked_movies lm JOIN members m ON lm.member_id = m.id WHERE m.family_id = f.id) as liked_count,
        (SELECT COUNT(*) FROM disliked_movies dm JOIN members m ON dm.member_id = m.id WHERE m.family_id = f.id) as disliked_count
      FROM families f
      WHERE f.google_id IS NOT NULL
      ORDER BY f.created_at DESC
      LIMIT 50
    `),
  ]);

  return NextResponse.json({
    users: {
      googleSignIns: Number(googleUsers.rows[0].count),
      guestSessions: Number(guestSessions.rows[0].count),
      totalMembers: Number(totalMembers.rows[0].count),
      premiumUsers: Number(premiumUsers.rows[0].count),
    },
    activity: {
      totalLiked: Number(totalLiked.rows[0].count),
      totalDisliked: Number(totalDisliked.rows[0].count),
      totalWatched: Number(totalWatched.rows[0].count),
      totalWatchlist: Number(totalWatchlist.rows[0].count),
      totalSwipeSessions: Number(totalSwipeSessions.rows[0].count),
    },
    recentSignups: recentSignups.rows.map(r => ({
      email: r.email,
      name: r.name,
      signedUp: r.created_at,
    })),
    userDetails: userDetails.rows.map(r => ({
      email: r.email,
      name: r.name,
      signedUp: r.created_at,
      isPremium: r.premium_until ? new Date(String(r.premium_until)) > new Date() : false,
      plan: r.subscription_plan,
      members: Number(r.member_count),
      liked: Number(r.liked_count),
      disliked: Number(r.disliked_count),
    })),
  });
}
