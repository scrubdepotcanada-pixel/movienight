import { auth } from "@/auth";
import db, { initDB } from "./db";

export async function getOrCreateFamily(): Promise<string | null> {
  await initDB();

  const session = await auth();

  if (!session?.user?.id) {
    return null;
  }

  const userId = session.user.id;
  const email = session.user.email ?? null;
  const name = session.user.name ?? null;
  const image = session.user.image ?? null;

  // Try to find by google_id first
  const byId = await db.execute({
    sql: "SELECT id FROM families WHERE google_id = ?",
    args: [userId],
  });

  if (byId.rows.length > 0) {
    return String(byId.rows[0].id);
  }

  // Fallback: try to find by email (in case google_id changed between sessions)
  if (email) {
    const byEmail = await db.execute({
      sql: "SELECT id FROM families WHERE email = ?",
      args: [email],
    });

    if (byEmail.rows.length > 0) {
      // Update google_id to current one
      await db.execute({
        sql: "UPDATE families SET google_id = ?, name = ?, avatar = ? WHERE email = ?",
        args: [userId, name, image, email],
      });
      return String(byEmail.rows[0].id);
    }
  }

  // Create family on first sign-in
  await db.execute({
    sql: "INSERT INTO families (id, google_id, email, name, avatar) VALUES (?, ?, ?, ?, ?)",
    args: [userId, userId, email, name, image],
  });

  return userId;
}
