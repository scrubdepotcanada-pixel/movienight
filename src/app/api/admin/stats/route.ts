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
    guestDetails,
    payingSubscribers,
    paymentHistory,
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
        (SELECT COUNT(*) FROM disliked_movies dm JOIN members m ON dm.member_id = m.id WHERE m.family_id = f.id) as disliked_count,
        (SELECT COUNT(*) FROM watchlist wl JOIN members m ON wl.member_id = m.id WHERE m.family_id = f.id) as watchlist_count,
        (SELECT COUNT(*) FROM recommendations r JOIN members m ON r.member_id = m.id WHERE m.family_id = f.id) as recs_count,
        (SELECT COUNT(*) FROM swipe_sessions ss WHERE ss.family_id = f.id) as swipe_count,
        (SELECT MAX(ts) FROM (
          SELECT MAX(lm.created_at) as ts FROM liked_movies lm JOIN members m ON lm.member_id = m.id WHERE m.family_id = f.id
          UNION ALL
          SELECT MAX(dm.created_at) as ts FROM disliked_movies dm JOIN members m ON dm.member_id = m.id WHERE m.family_id = f.id
          UNION ALL
          SELECT MAX(wl.added_at) as ts FROM watchlist wl JOIN members m ON wl.member_id = m.id WHERE m.family_id = f.id
          UNION ALL
          SELECT MAX(r.created_at) as ts FROM recommendations r JOIN members m ON r.member_id = m.id WHERE m.family_id = f.id
        )) as last_active
      FROM families f
      WHERE f.google_id IS NOT NULL
      ORDER BY f.created_at DESC
      LIMIT 50
    `),
    db.execute(`
      SELECT f.id, f.created_at, f.ip_address,
        (SELECT GROUP_CONCAT(m2.name, ', ') FROM members m2 WHERE m2.family_id = f.id) as member_names,
        (SELECT COUNT(*) FROM members WHERE family_id = f.id) as member_count,
        (SELECT COUNT(*) FROM liked_movies lm JOIN members m ON lm.member_id = m.id WHERE m.family_id = f.id) as liked_count,
        (SELECT COUNT(*) FROM disliked_movies dm JOIN members m ON dm.member_id = m.id WHERE m.family_id = f.id) as disliked_count,
        (SELECT COUNT(*) FROM recommendations r JOIN members m ON r.member_id = m.id WHERE m.family_id = f.id) as recs_count,
        (SELECT MAX(ts) FROM (
          SELECT MAX(lm.created_at) as ts FROM liked_movies lm JOIN members m ON lm.member_id = m.id WHERE m.family_id = f.id
          UNION ALL
          SELECT MAX(dm.created_at) as ts FROM disliked_movies dm JOIN members m ON dm.member_id = m.id WHERE m.family_id = f.id
          UNION ALL
          SELECT MAX(r.created_at) as ts FROM recommendations r JOIN members m ON r.member_id = m.id WHERE m.family_id = f.id
        )) as last_active
      FROM families f
      WHERE f.google_id IS NULL
      ORDER BY f.created_at DESC
      LIMIT 50
    `),
    db.execute(`
      SELECT f.id, f.email, f.name, f.subscription_plan, f.premium_until
      FROM families f
      WHERE f.subscription_plan IN ('monthly', 'yearly')
        AND f.premium_until > datetime('now')
      ORDER BY f.premium_until DESC
    `),
    db.execute(`
      SELECT p.id, p.family_id, p.plan, p.amount, p.currency, p.status, p.paid_at,
        f.email, f.name
      FROM payments p
      JOIN families f ON p.family_id = f.id
      ORDER BY p.paid_at DESC
      LIMIT 100
    `),
  ]);

  // Fetch categories for each guest family
  const guestFamilyIds = guestDetails.rows.map(r => String(r.id));
  let guestCategoryMap: Record<string, string[]> = {};
  if (guestFamilyIds.length > 0) {
    const guestCats = await db.execute({
      sql: `SELECT m.family_id, lm.category
            FROM liked_movies lm
            JOIN members m ON lm.member_id = m.id
            WHERE m.family_id IN (${guestFamilyIds.map(() => '?').join(',')})
            UNION
            SELECT m.family_id, dm.category
            FROM disliked_movies dm
            JOIN members m ON dm.member_id = m.id
            WHERE m.family_id IN (${guestFamilyIds.map(() => '?').join(',')})`,
      args: [...guestFamilyIds, ...guestFamilyIds],
    });
    for (const row of guestCats.rows) {
      const fid = String(row.family_id);
      const cat = String(row.category);
      if (!guestCategoryMap[fid]) guestCategoryMap[fid] = [];
      if (!guestCategoryMap[fid].includes(cat)) guestCategoryMap[fid].push(cat);
    }
  }

  // Revenue calculations from active paying subscribers
  const monthlyCount = payingSubscribers.rows.filter(r => r.subscription_plan === "monthly").length;
  const yearlyCount = payingSubscribers.rows.filter(r => r.subscription_plan === "yearly").length;
  const mrr = Number(((monthlyCount * 4.99) + (yearlyCount * 49.99 / 12)).toFixed(2));
  const arr = Number((mrr * 12).toFixed(2));

  // Total revenue from actual payment records
  const totalRevenue = Number(
    paymentHistory.rows
      .filter(r => r.status === "active")
      .reduce((sum, r) => sum + Number(r.amount), 0)
      .toFixed(2)
  );

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
    revenue: {
      mrr,
      arr,
      totalRevenue,
      monthlySubscribers: monthlyCount,
      yearlySubscribers: yearlyCount,
      payingSubscribers: payingSubscribers.rows.map(r => ({
        email: r.email,
        name: r.name,
        plan: r.subscription_plan,
        premiumUntil: r.premium_until,
      })),
      paymentHistory: paymentHistory.rows.map(r => ({
        email: r.email,
        name: r.name,
        plan: r.plan,
        amount: Number(r.amount),
        currency: r.currency,
        status: r.status,
        paidAt: r.paid_at,
      })),
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
      premiumUntil: r.premium_until ? String(r.premium_until) : null,
      plan: r.subscription_plan,
      members: Number(r.member_count),
      liked: Number(r.liked_count),
      disliked: Number(r.disliked_count),
      watchlist: Number(r.watchlist_count || 0),
      recs: Number(r.recs_count || 0),
      swipes: Number(r.swipe_count || 0),
      lastActive: r.last_active ? String(r.last_active) : null,
    })),
    guestDetails: guestDetails.rows.map(r => ({
      id: String(r.id),
      ip: r.ip_address ? String(r.ip_address) : null,
      memberNames: r.member_names ? String(r.member_names) : null,
      members: Number(r.member_count),
      liked: Number(r.liked_count),
      disliked: Number(r.disliked_count),
      recs: Number(r.recs_count || 0),
      categories: guestCategoryMap[String(r.id)] || [],
      createdAt: r.created_at ? String(r.created_at) : null,
      lastActive: r.last_active ? String(r.last_active) : null,
    })),
  });
}
