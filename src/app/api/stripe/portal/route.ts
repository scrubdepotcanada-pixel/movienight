import { NextResponse } from "next/server";
import { auth } from "@/auth";
import stripe from "@/lib/stripe";
import db, { initDB } from "@/lib/db";

export async function POST() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }

  await initDB();

  const familyRow = await db.execute({
    sql: "SELECT stripe_customer_id FROM families WHERE google_id = ?",
    args: [session.user.id],
  });

  const customerId = familyRow.rows[0]?.stripe_customer_id
    ? String(familyRow.rows[0].stripe_customer_id)
    : null;

  if (!customerId) {
    return NextResponse.json({ error: "No billing account" }, { status: 404 });
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://nextmovie.app";
  const portalSession = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: `${baseUrl}/premium`,
  });

  return NextResponse.json({ url: portalSession.url });
}
