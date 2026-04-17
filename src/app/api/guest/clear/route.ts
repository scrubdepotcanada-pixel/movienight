import { NextResponse } from "next/server";
import { clearGuestSession } from "@/lib/session";

// Clear guest session — called when guest exits
export async function POST() {
  await clearGuestSession();
  return NextResponse.json({ success: true });
}
