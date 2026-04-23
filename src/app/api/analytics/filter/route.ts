import { NextRequest, NextResponse } from "next/server";
import { getOrCreateFamily } from "@/lib/session";
import db, { initDB } from "@/lib/db";

export async function POST(req: NextRequest) {
  const { filterName, filterValue } = await req.json();
  if (!filterName) return NextResponse.json({ ok: false }, { status: 400 });

  await initDB();

  const familyId = await getOrCreateFamily();
  const isGuest = !familyId ? 1 : 0;

  await db.execute({
    sql: `INSERT INTO filter_events (family_id, filter_name, filter_value, is_guest)
          VALUES (?, ?, ?, ?)`,
    args: [familyId ?? null, filterName, filterValue ?? null, isGuest],
  });

  return NextResponse.json({ ok: true });
}
