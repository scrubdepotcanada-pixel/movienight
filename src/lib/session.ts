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

  // Check if this Google user already has a family
  const existing = await db.execute({
    sql: "SELECT id FROM families WHERE google_id = ?",
    args: [userId],
  });

  if (existing.rows.length > 0) {
    return String(existing.rows[0].id);
  }

  // Create family on first API call after sign-in
  await db.execute({
    sql: "INSERT INTO families (id, google_id, email, name, avatar) VALUES (?, ?, ?, ?, ?)",
    args: [userId, userId, email, name, image],
  });

  return userId;
}
