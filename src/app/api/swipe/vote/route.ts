import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";

export async function POST(req: NextRequest) {
  const { sessionId, memberId, tmdbId, vote } = await req.json();

  if (!sessionId || !memberId || !tmdbId || !vote) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  if (vote !== "yes" && vote !== "no") {
    return NextResponse.json({ error: "Vote must be 'yes' or 'no'" }, { status: 400 });
  }

  try {
    await db.execute({
      sql: `INSERT OR REPLACE INTO swipe_votes (session_id, member_id, tmdb_id, vote)
            VALUES (?, ?, ?, ?)`,
      args: [sessionId, memberId, tmdbId, vote],
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Swipe vote error:", err);
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
