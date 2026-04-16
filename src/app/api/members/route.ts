import { NextRequest, NextResponse } from "next/server";
import { getOrCreateFamily } from "@/lib/session";
import db from "@/lib/db";

const VALID_RATINGS = ["G", "PG", "PG-13", "R", "NC-17", "ALL"];

function sanitizeMaxRating(value: unknown): string | null {
  if (typeof value !== "string") return null;
  return VALID_RATINGS.includes(value) ? value : null;
}

// Get all family members
export async function GET() {
  const familyId = await getOrCreateFamily();

  const rows = await db.execute({
    sql: "SELECT * FROM members WHERE family_id = ? ORDER BY created_at ASC",
    args: [familyId],
  });

  return NextResponse.json(rows.rows);
}

// Create a new family member
export async function POST(req: NextRequest) {
  const familyId = await getOrCreateFamily();
  const { name, avatar, age, maxRating } = await req.json();

  if (!name || !name.trim()) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }

  const ageValue = typeof age === "number" && age > 0 && age < 130 ? age : null;
  const maxRatingValue = sanitizeMaxRating(maxRating);

  const result = await db.execute({
    sql: "INSERT INTO members (family_id, name, avatar, age, max_rating) VALUES (?, ?, ?, ?, ?)",
    args: [familyId, name.trim(), avatar || "🎬", ageValue, maxRatingValue],
  });

  const member = await db.execute({
    sql: "SELECT * FROM members WHERE id = ?",
    args: [String(result.lastInsertRowid)],
  });

  return NextResponse.json(member.rows[0]);
}

// Update a family member (age, name, avatar, maxRating)
export async function PATCH(req: NextRequest) {
  const familyId = await getOrCreateFamily();
  const { memberId, name, avatar, age, maxRating } = await req.json();

  const existing = await db.execute({
    sql: "SELECT id FROM members WHERE id = ? AND family_id = ?",
    args: [memberId, familyId],
  });

  if (existing.rows.length === 0) {
    return NextResponse.json({ error: "Member not found" }, { status: 404 });
  }

  const updates: string[] = [];
  const args: (string | number | null)[] = [];
  if (typeof name === "string" && name.trim()) {
    updates.push("name = ?");
    args.push(name.trim());
  }
  if (typeof avatar === "string") {
    updates.push("avatar = ?");
    args.push(avatar);
  }
  if (age !== undefined) {
    updates.push("age = ?");
    args.push(typeof age === "number" && age > 0 && age < 130 ? age : null);
  }
  if (maxRating !== undefined) {
    updates.push("max_rating = ?");
    args.push(sanitizeMaxRating(maxRating));
  }

  if (updates.length === 0) {
    return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
  }

  args.push(memberId);
  await db.execute({
    sql: `UPDATE members SET ${updates.join(", ")} WHERE id = ?`,
    args,
  });

  const updated = await db.execute({
    sql: "SELECT * FROM members WHERE id = ?",
    args: [memberId],
  });

  return NextResponse.json(updated.rows[0]);
}

// Delete a family member
export async function DELETE(req: NextRequest) {
  const familyId = await getOrCreateFamily();
  const { memberId } = await req.json();

  const member = await db.execute({
    sql: "SELECT id FROM members WHERE id = ? AND family_id = ?",
    args: [memberId, familyId],
  });

  if (member.rows.length === 0) {
    return NextResponse.json({ error: "Member not found" }, { status: 404 });
  }

  await db.batch([
    { sql: "DELETE FROM recommendations WHERE member_id = ?", args: [memberId] },
    { sql: "DELETE FROM watched_movies WHERE member_id = ?", args: [memberId] },
    { sql: "DELETE FROM disliked_movies WHERE member_id = ?", args: [memberId] },
    { sql: "DELETE FROM liked_movies WHERE member_id = ?", args: [memberId] },
    { sql: "DELETE FROM members WHERE id = ?", args: [memberId] },
  ]);

  return NextResponse.json({ success: true });
}
