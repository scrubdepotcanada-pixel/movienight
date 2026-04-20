import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  // Vercel/Cloudflare set these headers automatically
  const country =
    req.headers.get("x-vercel-ip-country") ||
    req.headers.get("cf-ipcountry") ||
    "US";

  return NextResponse.json({ country: country.toUpperCase() });
}
