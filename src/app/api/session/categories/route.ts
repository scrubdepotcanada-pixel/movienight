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
