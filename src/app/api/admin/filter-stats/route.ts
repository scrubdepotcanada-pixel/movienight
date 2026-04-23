import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { isAdminEmail } from "@/lib/session";
import db, { initDB } from "@/lib/db";

export async function GET(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get("key");
  const session = await auth();
  if (!isAdminEmail(session?.user?.email) && secret !== process.env.ADMIN_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await initDB();

  const [total7d, total30d, totalAll, byFilter, topValues, guestSplit] = await Promise.all([
    db.execute("SELECT COUNT(*) as count FROM filter_events WHERE created_at >= datetime('now', '-7 days')"),
    db.execute("SELECT COUNT(*) as count FROM filter_events WHERE created_at >= datetime('now', '-30 days')"),
    db.execute("SELECT COUNT(*) as count FROM filter_events"),
    db.execute(`
      SELECT
        filter_name,
        COUNT(*) as allTime,
        SUM(CASE WHEN created_at >= datetime('now', '-7 days') THEN 1 ELSE 0 END) as last7d,
        SUM(CASE WHEN created_at >= datetime('now', '-30 days') THEN 1 ELSE 0 END) as last30d,
        SUM(CASE WHEN filter_value LIKE 'locked:%' THEN 1 ELSE 0 END) as lockedClicks,
        SUM(CASE WHEN filter_value NOT LIKE 'locked:%' THEN 1 ELSE 0 END) as realUses
      FROM filter_events
      GROUP BY filter_name
      ORDER BY allTime DESC
    `),
    db.execute(`
      SELECT filter_name, filter_value, COUNT(*) as count
      FROM filter_events
      WHERE filter_value IS NOT NULL AND filter_value NOT LIKE 'locked:%'
      GROUP BY filter_name, filter_value
      ORDER BY count DESC
      LIMIT 40
    `),
    db.execute(`
      SELECT is_guest, COUNT(*) as count
      FROM filter_events
      GROUP BY is_guest
    `),
  ]);

  const byFilterRows = byFilter.rows.map(r => ({
    name: String(r.filter_name),
    allTime: Number(r.allTime),
    last7d: Number(r.last7d),
    last30d: Number(r.last30d),
    lockedClicks: Number(r.lockedClicks),
    realUses: Number(r.realUses),
  }));

  const topValuesRows = topValues.rows.map(r => ({
    filterName: String(r.filter_name),
    value: String(r.filter_value),
    count: Number(r.count),
  }));

  const guestCount = guestSplit.rows.find(r => Number(r.is_guest) === 1);
  const signedCount = guestSplit.rows.find(r => Number(r.is_guest) === 0);

  return NextResponse.json({
    total: {
      last7d: Number(total7d.rows[0]?.count ?? 0),
      last30d: Number(total30d.rows[0]?.count ?? 0),
      allTime: Number(totalAll.rows[0]?.count ?? 0),
    },
    byFilter: byFilterRows,
    topValues: topValuesRows,
    guestVsSigned: {
      guest: Number(guestCount?.count ?? 0),
      signed: Number(signedCount?.count ?? 0),
    },
  });
}
