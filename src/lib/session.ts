import { auth } from "@/auth";
import db, { initDB } from "./db";

export async function getOrCreateFamily(): Promise<string> {
  await initDB();

  const session = await auth();

  if (!session?.user?.id) {
    throw new Error("Not authenticated");
  }

  // The family is created in the signIn callback, so it should exist
  const existing = await db.execute({
    sql: "SELECT id FROM families WHERE google_id = ?",
    args: [session.user.id],
  });

  if (existing.rows.length > 0) {
    return String(existing.rows[0].id);
  }

  // Fallback: create family if somehow missing
  await db.execute({
    sql: "INSERT OR IGNORE INTO families (id, google_id, email, name) VALUES (?, ?, ?, ?)",
    args: [session.user.id, session.user.id, session.user.email ?? null, session.user.name ?? null],
  });

  return session.user.id;
}
