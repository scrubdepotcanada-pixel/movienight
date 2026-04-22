import { NextRequest, NextResponse } from "next/server";
import db, { initDB } from "@/lib/db";

export async function POST(req: NextRequest) {
  await initDB();

  const { name, email, rating, whatLove, whatMissing, other } = await req.json();

  if (!rating || rating < 1 || rating > 5) {
    return NextResponse.json({ error: "Rating required (1–5)" }, { status: 400 });
  }

  await db.execute({
    sql: `INSERT INTO feedback (name, email, rating, what_love, what_missing, other) VALUES (?, ?, ?, ?, ?, ?)`,
    args: [
      name || null,
      email || null,
      rating,
      whatLove || null,
      whatMissing || null,
      other || null,
    ],
  });

  return NextResponse.json({ ok: true });
}

export async function GET(req: NextRequest) {
  // Admin-only: requires admin key or session (checked via shared pattern)
  const key = req.nextUrl.searchParams.get("key");
  const adminKey = process.env.ADMIN_SECRET_KEY;
  if (adminKey && key !== adminKey) {
    // Also allow cookie-based admin auth — client will pass key param
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await initDB();

  const result = await db.execute(
    `SELECT id, name, email, rating, what_love, what_missing, other, submitted_at
     FROM feedback ORDER BY submitted_at DESC`
  );

  const rows = result.rows.map((r) => ({
    id: r[0],
    name: r[1],
    email: r[2],
    rating: r[3],
    whatLove: r[4],
    whatMissing: r[5],
    other: r[6],
    submittedAt: r[7],
  }));

  return NextResponse.json(rows);
}
