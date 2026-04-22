import { NextRequest, NextResponse } from "next/server";
import db, { initDB } from "@/lib/db";
import {
  sendFeedbackRequestEmail,
  sendExpiryThankYouEmail,
  sendExpiryFeedbackEmail,
} from "@/lib/email";

// Runs daily at 10am UTC via vercel.json cron config.
// Handles two scheduled emails for gifted premium users:
//   Day 7  — feedback request (if not already sent)
//   Day 30 — expiry email, thank-you if they left feedback, ask again if not
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await initDB();

  const results = {
    day7: { sent: [] as string[], failed: [] as { email: string; error: string }[] },
    day30: { sent: [] as string[], failed: [] as { email: string; error: string }[] },
  };

  // --- Day 7: feedback request ---
  const day7Result = await db.execute(`
    SELECT email, name
    FROM families
    WHERE subscription_plan = 'gifted'
      AND gifted_at IS NOT NULL
      AND feedback_email_sent_at IS NULL
      AND email IS NOT NULL
      AND datetime(gifted_at, '+7 days') <= datetime('now')
      AND (datetime(gifted_at, '+30 days') > datetime('now'))
  `);

  for (const r of day7Result.rows) {
    const email = String(r.email ?? r[0]);
    const name = r.name != null ? String(r.name) : r[1] != null ? String(r[1]) : null;
    try {
      await sendFeedbackRequestEmail(email, name);
      await db.execute({
        sql: "UPDATE families SET feedback_email_sent_at = datetime('now') WHERE email = ?",
        args: [email],
      });
      results.day7.sent.push(email);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`Day-7 email failed for ${email}:`, msg);
      results.day7.failed.push({ email, error: msg });
    }
  }

  // --- Day 30: expiry email ---
  const day30Result = await db.execute(`
    SELECT f.email, f.name,
      (SELECT COUNT(*) FROM feedback fb WHERE fb.email = f.email) as feedback_count
    FROM families f
    WHERE f.subscription_plan = 'gifted'
      AND f.gifted_at IS NOT NULL
      AND f.expiry_email_sent_at IS NULL
      AND f.email IS NOT NULL
      AND datetime(f.gifted_at, '+30 days') <= datetime('now')
  `);

  for (const r of day30Result.rows) {
    const email = String(r.email ?? r[0]);
    const name = r.name != null ? String(r.name) : r[1] != null ? String(r[1]) : null;
    const hasFeedback = Number(r.feedback_count ?? r[2] ?? 0) > 0;
    try {
      if (hasFeedback) {
        await sendExpiryThankYouEmail(email, name);
      } else {
        await sendExpiryFeedbackEmail(email, name);
      }
      await db.execute({
        sql: "UPDATE families SET expiry_email_sent_at = datetime('now') WHERE email = ?",
        args: [email],
      });
      results.day30.sent.push(email);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`Day-30 email failed for ${email}:`, msg);
      results.day30.failed.push({ email, error: msg });
    }
  }

  return NextResponse.json(results);
}
