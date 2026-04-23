import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import db, { initDB } from "@/lib/db";

function parseSignedRequest(signedRequest: string, secret: string): { user_id?: string } | null {
  const [encodedSig, payload] = signedRequest.split(".");
  if (!encodedSig || !payload) return null;

  const sig = Buffer.from(encodedSig.replace(/-/g, "+").replace(/_/g, "/"), "base64");
  const expected = crypto.createHmac("sha256", secret).update(payload).digest();

  if (!crypto.timingSafeEqual(sig, expected)) return null;

  try {
    return JSON.parse(Buffer.from(payload.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("utf8"));
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest) {
  const secret = process.env.AUTH_FACEBOOK_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "Not configured" }, { status: 500 });
  }

  let signedRequest: string | null = null;

  const contentType = req.headers.get("content-type") ?? "";
  if (contentType.includes("application/x-www-form-urlencoded")) {
    const text = await req.text();
    const params = new URLSearchParams(text);
    signedRequest = params.get("signed_request");
  } else {
    const body = await req.json().catch(() => ({}));
    signedRequest = body.signed_request ?? null;
  }

  if (!signedRequest) {
    return NextResponse.json({ error: "Missing signed_request" }, { status: 400 });
  }

  const data = parseSignedRequest(signedRequest, secret);
  if (!data?.user_id) {
    return NextResponse.json({ error: "Invalid signed_request" }, { status: 400 });
  }

  const facebookId = data.user_id;
  const confirmationCode = `del_fb_${facebookId}_${Date.now()}`;

  try {
    await initDB();
    await db.execute({
      sql: "DELETE FROM families WHERE google_id = ?",
      args: [facebookId],
    });
  } catch {
    // Best-effort; still return success so Facebook doesn't retry forever
  }

  return NextResponse.json({
    url: `https://nextmovie.app/privacy/data-deletion?code=${confirmationCode}`,
    confirmation_code: confirmationCode,
  });
}
