import { NextRequest, NextResponse } from "next/server";
import stripe from "@/lib/stripe";
import db, { initDB } from "@/lib/db";
import Stripe from "stripe";

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature");

  if (!sig || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  await initDB();

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const familyId = session.metadata?.familyId;
      const plan = session.metadata?.plan;
      if (!familyId || !plan) break;

      if (plan === "lifetime") {
        await db.execute({
          sql: "UPDATE families SET premium_until = ?, subscription_plan = ? WHERE id = ?",
          args: ["2099-12-31T23:59:59Z", "lifetime", familyId],
        });
        await db.execute({
          sql: "INSERT INTO payments (family_id, plan, amount, currency, status, stripe_payment_id) VALUES (?, ?, ?, ?, ?, ?)",
          args: [familyId, "lifetime", 99.99, "usd", "active", session.payment_intent as string],
        });
      }
      break;
    }

    case "invoice.payment_succeeded": {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const invoice = event.data.object as any;
      const subscriptionId = typeof invoice.subscription === "string"
        ? invoice.subscription
        : invoice.subscription?.id;
      if (!subscriptionId) break;

      const sub = await stripe.subscriptions.retrieve(subscriptionId);
      const customerId = typeof sub.customer === "string" ? sub.customer : sub.customer.id;

      const familyRow = await db.execute({
        sql: "SELECT id FROM families WHERE stripe_customer_id = ?",
        args: [customerId],
      });
      if (familyRow.rows.length === 0) break;
      const familyId = String(familyRow.rows[0].id);

      const periodEnd = sub.items.data[0]?.current_period_end;
      const currentPeriodEnd = periodEnd ? new Date(periodEnd * 1000) : new Date(Date.now() + 30 * 86400000);
      const plan = sub.items.data[0]?.price?.recurring?.interval === "year" ? "yearly" : "monthly";
      const amount = plan === "yearly" ? 49.99 : 4.99;
      const paymentIntent = typeof invoice.payment_intent === "string"
        ? invoice.payment_intent
        : invoice.payment_intent?.id || null;

      await db.execute({
        sql: "UPDATE families SET premium_until = ?, subscription_plan = ? WHERE id = ?",
        args: [currentPeriodEnd.toISOString(), plan, familyId],
      });
      await db.execute({
        sql: "INSERT INTO payments (family_id, plan, amount, currency, status, stripe_payment_id) VALUES (?, ?, ?, ?, ?, ?)",
        args: [familyId, plan, amount, "usd", "active", paymentIntent],
      });
      break;
    }

    case "customer.subscription.deleted": {
      const sub = event.data.object as Stripe.Subscription;
      const customerId = typeof sub.customer === "string" ? sub.customer : sub.customer.id;

      const familyRow = await db.execute({
        sql: "SELECT id, subscription_plan FROM families WHERE stripe_customer_id = ?",
        args: [customerId],
      });
      if (familyRow.rows.length === 0) break;
      const familyId = String(familyRow.rows[0].id);
      const currentPlan = String(familyRow.rows[0].subscription_plan || "");

      if (currentPlan === "monthly" || currentPlan === "yearly") {
        await db.execute({
          sql: "UPDATE families SET premium_until = NULL, subscription_plan = NULL WHERE id = ?",
          args: [familyId],
        });
      }
      break;
    }
  }

  return NextResponse.json({ received: true });
}
