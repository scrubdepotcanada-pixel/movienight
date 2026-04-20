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

  const dupes = await db.execute(`
    SELECT email, COUNT(*) as cnt
    FROM families
    WHERE email IS NOT NULL
    GROUP BY email
    HAVING cnt > 1
  `);

  let removed = 0;

  for (const row of dupes.rows) {
    const email = String(row.email);

    const all = await db.execute({
      sql: `SELECT f.id,
              (SELECT COUNT(*) FROM members WHERE family_id = f.id) as member_count
            FROM families f
            WHERE f.email = ?
            ORDER BY member_count DESC, f.created_at ASC`,
      args: [email],
    });

    for (let i = 1; i < all.rows.length; i++) {
      const famId = String(all.rows[i].id);
      const memberCount = Number(all.rows[i].member_count);

      if (memberCount === 0) {
        await db.execute({ sql: "DELETE FROM families WHERE id = ?", args: [famId] });
        removed++;
      }
    }
  }

  return NextResponse.json({ removed });
}
