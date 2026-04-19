import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getOrCreateFamily, isAdminEmail } from "@/lib/session";
import { getFamilyPremiumStatus, getMemberCount, FREE_MEMBER_LIMIT, PLANS } from "@/lib/premium";

export async function GET() {
  const familyId = await getOrCreateFamily();
  if (!familyId) {
    return NextResponse.json({ isPremium: false, plan: null, expiresAt: null, memberCount: 0, memberLimit: FREE_MEMBER_LIMIT, plans: PLANS, isAdmin: false });
  }

  const session = await auth();
  const isAdmin = isAdminEmail(session?.user?.email);

  const status = await getFamilyPremiumStatus(familyId);
  const memberCount = await getMemberCount(familyId);

  return NextResponse.json({
    ...status,
    memberCount,
    memberLimit: status.isPremium ? null : FREE_MEMBER_LIMIT,
    plans: PLANS,
    isAdmin,
  });
}
