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

  // Guest mode: always create a fresh session (no persistence)
  const cookieStore = await cookies();

  // Check for existing guest session within the same browser session
  const guestId = cookieStore.get("guest_family_id")?.value;
  if (guestId) {
    const existing = await db.execute({
      sql: "SELECT id FROM families WHERE id = ?",
      args: [guestId],
    });
    if (existing.rows.length > 0) return guestId;
  }

  // Create new guest family
  const newGuestId = `guest_${uuidv4()}`;
  await db.execute({
    sql: "INSERT INTO families (id, name) VALUES (?, ?)",
    args: [newGuestId, "Guest"],
  });

  // Session cookie — expires when browser closes (no maxAge)
  cookieStore.set("guest_family_id", newGuestId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
  });

  return newGuestId;
}

// Clear guest session so next visit is fresh
export async function clearGuestSession() {
  const cookieStore = await cookies();
  cookieStore.delete("guest_family_id");
}
