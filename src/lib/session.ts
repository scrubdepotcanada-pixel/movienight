import { auth } from "@/auth";
import { cookies, headers } from "next/headers";
import { v4 as uuidv4 } from "uuid";
import db, { initDB } from "./db";

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || "oreekoblentz@gmail.com,scrubdepotcanada@gmail.com")
  .split(",")
  .map((e) => e.trim().toLowerCase());

export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return ADMIN_EMAILS.includes(email.toLowerCase());
}

// Reassign every row belonging to a guest family over to a real family,
// preserving member ids (and therefore all their liked/disliked/watched/
// recommendation history, which is keyed by member_id, not family_id).
async function mergeGuestIntoFamily(guestId: string, familyId: string) {
  await db.execute({
    sql: "UPDATE members SET family_id = ? WHERE family_id = ?",
    args: [familyId, guestId],
  });
  await db.execute({
    sql: "UPDATE swipe_sessions SET family_id = ? WHERE family_id = ?",
    args: [familyId, guestId],
  });
  await db.execute({
    sql: "UPDATE filter_events SET family_id = ? WHERE family_id = ?",
    args: [familyId, guestId],
  });
  await db.execute({
    sql: "DELETE FROM families WHERE id = ?",
    args: [guestId],
  });
}

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
      const familyId = String(byId.rows[0].id);

      if (isAdminEmail(email)) {
        await db.execute({
          sql: "UPDATE families SET premium_until = ?, subscription_plan = ? WHERE id = ?",
          args: ["2099-12-31T23:59:59Z", "admin", familyId],
        });
      }

      // Catch-up for accounts created before guest migration existed: if this
      // account has no members yet and a guest session cookie is still
      // sitting in the browser, pull that guest's data in now.
      const cookieStore = await cookies();
      const guestId = cookieStore.get("guest_family_id")?.value;
      if (guestId && guestId !== familyId) {
        const memberCount = await db.execute({
          sql: "SELECT COUNT(*) as count FROM members WHERE family_id = ?",
          args: [familyId],
        });
        if (Number(memberCount.rows[0].count) === 0) {
          const guestFamily = await db.execute({
            sql: "SELECT id FROM families WHERE id = ? AND google_id IS NULL",
            args: [guestId],
          });
          if (guestFamily.rows.length > 0) {
            await mergeGuestIntoFamily(guestId, familyId);
            cookieStore.delete("guest_family_id");
          }
        }
      }

      return familyId;
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

    // First-ever sign-in for this account. If they were already using the
    // app as a guest, upgrade that guest family in place instead of starting
    // from scratch — this keeps the same family id, so every member/like/
    // dislike/recommendation row already tied to it carries over untouched.
    const cookieStore = await cookies();
    const guestId = cookieStore.get("guest_family_id")?.value;
    if (guestId) {
      const guestFamily = await db.execute({
        sql: "SELECT id FROM families WHERE id = ? AND google_id IS NULL",
        args: [guestId],
      });
      if (guestFamily.rows.length > 0) {
        const premiumUntil = isAdminEmail(email) ? "2099-12-31T23:59:59Z" : null;
        const plan = isAdminEmail(email) ? "admin" : null;
        await db.execute({
          sql: `UPDATE families
                SET google_id = ?, email = ?, name = ?, avatar = ?, ip_address = NULL,
                    premium_until = COALESCE(premium_until, ?), subscription_plan = COALESCE(subscription_plan, ?)
                WHERE id = ?`,
          args: [userId, email, name, image, premiumUntil, plan, guestId],
        });
        cookieStore.delete("guest_family_id");
        return guestId;
      }
    }

    const premiumUntil = isAdminEmail(email) ? "2099-12-31T23:59:59Z" : null;
    const plan = isAdminEmail(email) ? "admin" : null;
    await db.execute({
      sql: "INSERT INTO families (id, google_id, email, name, avatar, premium_until, subscription_plan) VALUES (?, ?, ?, ?, ?, ?, ?)",
      args: [userId, userId, email, name, image, premiumUntil, plan],
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
  const hdrs = await headers();
  const ip = hdrs.get("x-forwarded-for")?.split(",")[0]?.trim() || hdrs.get("cf-connecting-ip") || null;
  await db.execute({
    sql: "INSERT INTO families (id, name, ip_address) VALUES (?, ?, ?)",
    args: [newGuestId, "Guest", ip],
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
