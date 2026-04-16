import { NextRequest, NextResponse } from "next/server";
import { getOrCreateFamily } from "@/lib/session";
import db from "@/lib/db";

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
  const { name, avatar } = await req.json();

  if (!name || !name.trim()) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }

  const result = await db.execute({
    sql: "INSERT INTO members (family_id, name, avatar) VALUES (?, ?, ?)",
    args: [familyId, name.trim(), avatar || "🎬"],
  });

  const member = await db.execute({
    sql: "SELECT * FROM members WHERE id = ?",
    args: [String(result.lastInsertRowid)],
  });

  return NextResponse.json(member.rows[0]);
}

// Delete a family member
export async function DELETE(req: NextRequest) {
  const familyId = await getOrCreateFamily();
  const { memberId } = await req.json();

  // Verify member belongs to this family
  const member = await db.execute({
    sql: "SELECT id FROM members WHERE id = ? AND family_id = ?",
    args: [memberId, familyId],
  });

  if (member.rows.length === 0) {
    return NextResponse.json({ error: "Member not found" }, { status: 404 });
  }

  // Delete all related data
  await db.batch([
    { sql: "DELETE FROM recommendations WHERE member_id = ?", args: [memberId] },
    { sql: "DELETE FROM watched_movies WHERE member_id = ?", args: [memberId] },
    { sql: "DELETE FROM members WHERE id = ?", args: [memberId] },
  ]);

  return NextResponse.json({ success: true });
}
