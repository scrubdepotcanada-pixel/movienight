import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";

// Like a movie — saves to liked_movies for the current category
export async function POST(req: NextRequest) {
  const { memberId, movie, category = "general" } = await req.json();

  if (!memberId || !movie) {
    return NextResponse.json({ error: "Missing memberId or movie" }, { status: 400 });
  }

  await db.execute({
    sql: "INSERT INTO liked_movies (member_id, title, category) VALUES (?, ?, ?)",
    args: [memberId, movie.title, category],
  });

  return NextResponse.json({ success: true });
}

// Unlike a movie
export async function DELETE(req: NextRequest) {
  const { memberId, movieTitle, category = "general" } = await req.json();

  if (!memberId || !movieTitle) {
    return NextResponse.json({ error: "Missing memberId or movieTitle" }, { status: 400 });
  }

  await db.execute({
    sql: "DELETE FROM liked_movies WHERE member_id = ? AND title = ? AND category = ?",
    args: [memberId, movieTitle, category],
  });

  return NextResponse.json({ success: true });
}
