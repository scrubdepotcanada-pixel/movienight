import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { isAdminEmail, mergeGuestIntoFamily } from "@/lib/session";
import db, { initDB } from "@/lib/db";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!isAdminEmail(session?.user?.email)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await initDB();

  const { guestId, targetEmail } = await req.json();
  if (!guestId || !targetEmail) {
    return NextResponse.json({ error: "Missing guestId or targetEmail" }, { status: 400 });
  }

  const guestFamily = await db.execute({
    sql: "SELECT id FROM families WHERE id = ? AND google_id IS NULL",
    args: [guestId],
  });
  if (guestFamily.rows.length === 0) {
    return NextResponse.json({ error: "Guest session not found (it may have already been merged)" }, { status: 404 });
  }

  const targetFamily = await db.execute({
    sql: "SELECT id FROM families WHERE email = ? AND google_id IS NOT NULL",
    args: [targetEmail],
  });
  if (targetFamily.rows.length === 0) {
    return NextResponse.json({ error: `No signed-in account found for ${targetEmail}` }, { status: 404 });
  }

  const targetFamilyId = String(targetFamily.rows[0].id);

  const memberCount = await db.execute({
    sql: "SELECT COUNT(*) as count FROM members WHERE family_id = ?",
    args: [guestId],
  });

  await mergeGuestIntoFamily(guestId, targetFamilyId);

  return NextResponse.json({
    ok: true,
    membersMoved: Number(memberCount.rows[0].count),
    targetFamilyId,
  });
}
