import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";

export async function GET(req: NextRequest) {
  const memberId = req.nextUrl.searchParams.get("memberId");
  if (!memberId) {
    return NextResponse.json({ error: "Missing memberId" }, { status: 400 });
  }

  // Count activity (likes + dislikes) per category — persists even after swiping through all recs
  const rows = await db.execute({
    sql: `SELECT category, COUNT(*) as count
          FROM (
            SELECT category FROM liked_movies WHERE member_id = ? AND category != 'general'
            UNION ALL
            SELECT category FROM disliked_movies WHERE member_id = ? AND category != 'general'
          )
          GROUP BY category
          ORDER BY count DESC`,
    args: [memberId, memberId],
  });

  return NextResponse.json(rows.rows);
}

export async function DELETE(req: NextRequest) {
  const memberId = req.nextUrl.searchParams.get("memberId");
  const category = req.nextUrl.searchParams.get("category");
  if (!memberId || !category) {
    return NextResponse.json({ error: "Missing memberId or category" }, { status: 400 });
  }

  await Promise.all([
    db.execute({ sql: "DELETE FROM liked_movies WHERE member_id = ? AND category = ?", args: [memberId, category] }),
    db.execute({ sql: "DELETE FROM disliked_movies WHERE member_id = ? AND category = ?", args: [memberId, category] }),
    db.execute({ sql: "UPDATE recommendations SET is_active = 0 WHERE member_id = ? AND category = ?", args: [memberId, category] }),
  ]);

  return NextResponse.json({ ok: true });
}
