import { NextRequest, NextResponse } from "next/server";
import db, { initDB } from "@/lib/db";
import { sendFeedbackRequestEmail } from "@/lib/email";

// Vercel calls this daily via vercel.json cron config.
// Finds gifted users whose premium was granted 7+ days ago
// and haven't received a feedback email yet.
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await initDB();

  const result = await db.execute(`
    SELECT email, name
    FROM families
    WHERE subscription_plan = 'gifted'
      AND gifted_at IS NOT NULL
      AND feedback_email_sent_at IS NULL
      AND email IS NOT NULL
      AND datetime(gifted_at, '+7 days') <= datetime('now')
  `);

  const users = result.rows.map(r => ({
    email: String(r.email ?? r[0]),
    name: r.name != null ? String(r.name) : r[1] != null ? String(r[1]) : null,
  }));
  const sent: string[] = [];
  const failed: { email: string; error: string }[] = [];

  for (const user of users) {
    try {
      await sendFeedbackRequestEmail(user.email, user.name);
      await db.execute({
        sql: "UPDATE families SET feedback_email_sent_at = datetime('now') WHERE email = ?",
        args: [user.email],
      });
      sent.push(user.email);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`Feedback email failed for ${user.email}:`, msg);
      failed.push({ email: user.email, error: msg });
    }
  }

  return NextResponse.json({ sent, failed, total: users.length });
}
