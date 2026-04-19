import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";

export async function GET(req: NextRequest) {
  const sessionId = req.nextUrl.searchParams.get("sessionId");

  if (!sessionId) {
    return NextResponse.json({ error: "Missing sessionId" }, { status: 400 });
  }

  try {
    // Get the session to find the family
    const sessionRows = await db.execute({
      sql: "SELECT family_id FROM swipe_sessions WHERE id = ?",
      args: [sessionId],
    });

    if (sessionRows.rows.length === 0) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    const familyId = String(sessionRows.rows[0].family_id);

    // Get total candidates for this session
    const candidateRows = await db.execute({
      sql: "SELECT COUNT(*) as total FROM swipe_candidates WHERE session_id = ?",
      args: [sessionId],
    });
    const total = Number(candidateRows.rows[0].total);

    // Get all family members
    const memberRows = await db.execute({
      sql: "SELECT id, name, avatar FROM members WHERE family_id = ? ORDER BY created_at ASC",
      args: [familyId],
    });

    // Get vote counts per member for this session
    const voteRows = await db.execute({
      sql: "SELECT member_id, COUNT(*) as voted_count FROM swipe_votes WHERE session_id = ? GROUP BY member_id",
      args: [sessionId],
    });

    const voteCounts = new Map<string, number>();
    for (const row of voteRows.rows) {
      voteCounts.set(String(row.member_id), Number(row.voted_count));
    }

    const members = memberRows.rows.map((m) => ({
      id: m.id,
      name: m.name,
      avatar: m.avatar,
      votedCount: voteCounts.get(String(m.id)) || 0,
      total,
    }));

    const allDone = members.every((m) => m.votedCount >= total);

    return NextResponse.json({ members, allDone });
  } catch (err) {
    console.error("Swipe status error:", err);
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
