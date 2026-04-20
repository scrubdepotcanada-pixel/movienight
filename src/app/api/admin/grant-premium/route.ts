import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { isAdminEmail } from "@/lib/session";
import db, { initDB } from "@/lib/db";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!isAdminEmail(session?.user?.email)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await initDB();

  const { email, action, months } = await req.json();
  if (!email) return NextResponse.json({ error: "Missing email" }, { status: 400 });

  if (action === "revoke") {
    await db.execute({
      sql: "UPDATE families SET premium_until = NULL, subscription_plan = NULL WHERE email = ? AND subscription_plan != 'admin'",
      args: [email],
    });
    return NextResponse.json({ ok: true, action: "revoked" });
  }

  // Grant: default 12 months, or lifetime (999 months)
  const m = Number(months) || 12;
  const until = new Date();
  until.setMonth(until.getMonth() + m);
  const premiumUntil = m >= 999 ? "2099-12-31T23:59:59Z" : until.toISOString();

  await db.execute({
    sql: "UPDATE families SET premium_until = ?, subscription_plan = 'gifted' WHERE email = ?",
    args: [premiumUntil, email],
  });

  return NextResponse.json({ ok: true, action: "granted", until: premiumUntil });
}
