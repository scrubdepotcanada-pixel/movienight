import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";

export async function GET(req: NextRequest) {
  const memberId = req.nextUrl.searchParams.get("memberId");
  if (!memberId) {
    return NextResponse.json({ error: "Missing memberId" }, { status: 400 });
  }

  const rows = await db.execute({
    sql: `SELECT category, COUNT(*) as count
          FROM recommendations
          WHERE member_id = ? AND is_active = 1 AND category != 'general'
          GROUP BY category
          ORDER BY MAX(created_at) DESC`,
    args: [memberId],
  });

  return NextResponse.json(rows.rows);
}
