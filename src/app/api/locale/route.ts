import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

/**
 * GET /api/locale — returns the current locale preference from a cookie.
 */
export async function GET() {
  const cookieStore = await cookies();
  const locale = cookieStore.get("locale")?.value || "en";
  return NextResponse.json({ locale });
}

/**
 * POST /api/locale — sets the locale preference in a cookie.
 * Body: { locale: "en" | "he" }
 */
export async function POST(req: NextRequest) {
  const body = await req.json();
  const locale = body.locale === "he" ? "he" : "en";

  const cookieStore = await cookies();
  cookieStore.set("locale", locale, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365, // 1 year
    sameSite: "lax",
  });

  return NextResponse.json({ locale });
}
