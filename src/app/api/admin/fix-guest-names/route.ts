import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { isAdminEmail } from "@/lib/session";
import db, { initDB } from "@/lib/db";

export async function POST() {
  const session = await auth();
  if (!isAdminEmail(session?.user?.email)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await initDB();

  // Get all guest families with an IP, ordered oldest first
  const rows = await db.execute(`
    SELECT f.id, f.ip_address, m.id as member_id, m.name
    FROM families f
    JOIN members m ON m.family_id = f.id
    WHERE f.google_id IS NULL AND f.ip_address IS NOT NULL
    ORDER BY f.created_at ASC
  `);

  // Build canonical name per IP (first session's name wins)
  const canonicalName: Record<string, string> = {};
  for (const row of rows.rows) {
    const ip = String(row.ip_address);
    if (!canonicalName[ip]) {
      canonicalName[ip] = String(row.name);
    }
  }

  // Update all guest members whose name doesn't match the canonical one
  let fixed = 0;
  for (const row of rows.rows) {
    const ip = String(row.ip_address);
    const canonical = canonicalName[ip];
    if (canonical && String(row.name) !== canonical) {
      await db.execute({
        sql: "UPDATE members SET name = ? WHERE id = ?",
        args: [canonical, row.member_id],
      });
      fixed++;
    }
  }

  return NextResponse.json({ fixed, ips: Object.keys(canonicalName).length });
}
