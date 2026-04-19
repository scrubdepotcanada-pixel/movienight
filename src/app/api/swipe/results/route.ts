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

    // Count total members in the family
    const memberRows = await db.execute({
      sql: "SELECT COUNT(*) as total FROM members WHERE family_id = ?",
      args: [familyId],
    });
    const totalMembers = Number(memberRows.rows[0].total);

    // Get all candidates for this session
    const candidateRows = await db.execute({
      sql: "SELECT tmdb_id, title, poster_path, vote_average, certification, overview, release_date FROM swipe_candidates WHERE session_id = ?",
      args: [sessionId],
    });

    const candidateMap = new Map<number, {
      tmdb_id: number;
      title: string;
      poster_path: string | null;
      vote_average: number | null;
      certification: string | null;
      overview: string | null;
      release_date: string | null;
    }>();

    for (const row of candidateRows.rows) {
      candidateMap.set(Number(row.tmdb_id), {
        tmdb_id: Number(row.tmdb_id),
        title: String(row.title),
        poster_path: row.poster_path ? String(row.poster_path) : null,
        vote_average: row.vote_average != null ? Number(row.vote_average) : null,
        certification: row.certification ? String(row.certification) : null,
        overview: row.overview ? String(row.overview) : null,
        release_date: row.release_date ? String(row.release_date) : null,
      });
    }

    // Get all "yes" votes grouped by tmdb_id
    const voteRows = await db.execute({
      sql: `SELECT tmdb_id, COUNT(*) as yes_count
            FROM swipe_votes
            WHERE session_id = ? AND vote = 'yes'
            GROUP BY tmdb_id
            ORDER BY yes_count DESC`,
      args: [sessionId],
    });

    interface CandidateInfo {
      tmdb_id: number;
      title: string;
      poster_path: string | null;
      vote_average: number | null;
      certification: string | null;
      overview: string | null;
      release_date: string | null;
    }

    const perfectMatches: CandidateInfo[] = [];
    const closeMatches: { movie: CandidateInfo; yesCount: number }[] = [];

    for (const row of voteRows.rows) {
      const tmdbId = Number(row.tmdb_id);
      const yesCount = Number(row.yes_count);
      const candidate = candidateMap.get(tmdbId);

      if (!candidate) continue;

      if (yesCount >= totalMembers) {
        perfectMatches.push(candidate);
      } else {
        closeMatches.push({ movie: candidate, yesCount });
      }
    }

    return NextResponse.json({
      perfectMatches,
      closeMatches: closeMatches.map((cm) => ({
        ...cm.movie,
        yesCount: cm.yesCount,
      })),
      totalMembers,
    });
  } catch (err) {
    console.error("Swipe results error:", err);
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
