import { cookies } from "next/headers";
import { v4 as uuidv4 } from "uuid";
import db, { initDB } from "./db";

export async function getOrCreateFamily(): Promise<string> {
  await initDB();

  const cookieStore = await cookies();
  let familyId = cookieStore.get("movienight_family")?.value;

  if (familyId) {
    const existing = await db.execute({
      sql: "SELECT id FROM families WHERE id = ?",
      args: [familyId],
    });
    if (existing.rows.length > 0) return familyId;
  }

  familyId = uuidv4();
  await db.execute({
    sql: "INSERT INTO families (id) VALUES (?)",
    args: [familyId],
  });

  cookieStore.set("movienight_family", familyId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 365,
    path: "/",
  });

  return familyId;
}
