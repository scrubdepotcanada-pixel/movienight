import { NextResponse } from "next/server";
import { getOrCreateFamily } from "@/lib/session";

export async function GET() {
  try {
    const familyId = await getOrCreateFamily();
    if (!familyId) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }
    return NextResponse.json({ familyId });
  } catch (err) {
    console.error("Family ID fetch error:", err);
    return NextResponse.json({ error: "Failed to get family ID" }, { status: 500 });
  }
}
