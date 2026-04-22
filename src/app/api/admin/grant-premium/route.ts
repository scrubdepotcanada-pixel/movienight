import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { isAdminEmail } from "@/lib/session";
import db, { initDB } from "@/lib/db";
import { sendFreeMonthEmail } from "@/lib/email";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!isAdminEmail(session?.user?.email)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await initDB();

  const { email, action, months, sendEmail } = await req.json();
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

  // Auto-send email when granting (unless explicitly opted out)
  let emailSent = false;
  let emailError: string | null = null;
  if (sendEmail !== false && process.env.RESEND_API_KEY) {
    try {
      const result = await db.execute({
        sql: "SELECT name FROM families WHERE email = ?",
        args: [email],
      });
      const name = (result.rows[0]?.[0] as string | null) ?? null;
      await sendFreeMonthEmail(email, name);
      emailSent = true;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error("Email send failed:", msg);
      emailError = msg;
    }
  } else if (!process.env.RESEND_API_KEY) {
    emailError = "RESEND_API_KEY not set";
  }

  return NextResponse.json({ ok: true, action: "granted", until: premiumUntil, emailSent, emailError });
}
