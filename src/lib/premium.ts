import db from "./db";

export interface PremiumStatus {
  isPremium: boolean;
  plan: "monthly" | "yearly" | null;
  expiresAt: string | null;
}

export const PLANS = {
  monthly: { price: 4.99, label: "$4.99/month" },
  yearly: { price: 49.99, label: "$49.99/year", savings: "Save 17%" },
  lifetime: { price: 99.99, label: "$99.99 one-time" },
} as const;

export const FREE_MEMBER_LIMIT = 2;

export async function getFamilyPremiumStatus(familyId: string): Promise<PremiumStatus> {
  const row = await db.execute({
    sql: "SELECT premium_until, subscription_plan FROM families WHERE id = ?",
    args: [familyId],
  });

  if (row.rows.length === 0) {
    return { isPremium: false, plan: null, expiresAt: null };
  }

  const premiumUntil = row.rows[0].premium_until as string | null;
  const plan = row.rows[0].subscription_plan as string | null;

  if (!premiumUntil) {
    return { isPremium: false, plan: null, expiresAt: null };
  }

  const isPremium = new Date(premiumUntil) > new Date();
  return {
    isPremium,
    plan: (plan === "monthly" || plan === "yearly") ? plan : null,
    expiresAt: premiumUntil,
  };
}

export async function getMemberCount(familyId: string): Promise<number> {
  const result = await db.execute({
    sql: "SELECT COUNT(*) as count FROM members WHERE family_id = ?",
    args: [familyId],
  });
  return Number(result.rows[0].count);
}
