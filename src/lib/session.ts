import { auth } from "@/auth";
import { cookies } from "next/headers";
import { v4 as uuidv4 } from "uuid";
import db, { initDB } from "./db";

export async function getOrCreateFamily(): Promise<string | null> {
  await initDB();

  // Check for authenticated user first
  const session = await auth();

  if (session?.user?.id) {
    const userId = session.user.id;
    const email = session.user.email ?? null;
    const name = session.user.name ?? null;
    const image = session.user.image ?? null;

    const byId = await db.execute({
      sql: "SELECT id FROM families WHERE google_id = ?",
      args: [userId],
    });

    if (byId.rows.length > 0) {
      return String(byId.rows[0].id);
    }

    if (email) {
      const byEmail = await db.execute({
        sql: "SELECT id FROM families WHERE email = ?",
        args: [email],
      });

      if (byEmail.rows.length > 0) {
        await db.execute({
          sql: "UPDATE families SET google_id = ?, name = ?, avatar = ? WHERE email = ?",
          args: [userId, name, image, email],
        });
        return String(byEmail.rows[0].id);
      }
    }

    await db.execute({
      sql: "INSERT INTO families (id, google_id, email, name, avatar) VALUES (?, ?, ?, ?, ?)",
      args: [userId, userId, email, name, image],
    });

    return userId;
  }

  // Guest mode: use a cookie-based session
  const cookieStore = await cookies();
  let guestId = cookieStore.get("guest_family_id")?.value;

  if (guestId) {
    const existing = await db.execute({
      sql: "SELECT id FROM families WHERE id = ?",
      args: [guestId],
    });
    if (existing.rows.length > 0) return guestId;
  }

  // Create new guest family
  guestId = `guest_${uuidv4()}`;
  await db.execute({
    sql: "INSERT INTO families (id, name) VALUES (?, ?)",
    args: [guestId, "Guest"],
  });

  cookieStore.set("guest_family_id", guestId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 365,
    path: "/",
  });

  return guestId;
}
