import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import stripe from "@/lib/stripe";
import db, { initDB } from "@/lib/db";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id || !session.user.email) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }

  const { plan } = await req.json();
  if (!["monthly", "yearly", "lifetime"].includes(plan)) {
    return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
  }

  await initDB();

  const familyRow = await db.execute({
    sql: "SELECT id, stripe_customer_id FROM families WHERE google_id = ?",
    args: [session.user.id],
  });
  if (familyRow.rows.length === 0) {
    return NextResponse.json({ error: "No account found" }, { status: 404 });
  }

  const familyId = String(familyRow.rows[0].id);
  let customerId = familyRow.rows[0].stripe_customer_id
    ? String(familyRow.rows[0].stripe_customer_id)
    : null;

  if (!customerId) {
    const customer = await stripe.customers.create({
      email: session.user.email,
      name: session.user.name || undefined,
      metadata: { familyId },
    });
    customerId = customer.id;
    await db.execute({
      sql: "UPDATE families SET stripe_customer_id = ? WHERE id = ?",
      args: [customerId, familyId],
    });
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://nextmovie.app";

  if (plan === "lifetime") {
    const priceId = process.env.STRIPE_LIFETIME_PRICE_ID;
    if (!priceId) {
      return NextResponse.json({ error: "Lifetime price not configured" }, { status: 500 });
    }
    const checkoutSession = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: "payment",
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${baseUrl}/?upgraded=true`,
      cancel_url: `${baseUrl}/premium`,
      metadata: { familyId, plan: "lifetime" },
    });
    return NextResponse.json({ url: checkoutSession.url });
  }

  const priceId =
    plan === "monthly"
      ? process.env.STRIPE_MONTHLY_PRICE_ID
      : process.env.STRIPE_YEARLY_PRICE_ID;

  if (!priceId) {
    return NextResponse.json({ error: "Price not configured" }, { status: 500 });
  }

  const checkoutSession = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: "subscription",
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${baseUrl}/?upgraded=true`,
    cancel_url: `${baseUrl}/premium`,
    metadata: { familyId, plan },
  });

  return NextResponse.json({ url: checkoutSession.url });
}
