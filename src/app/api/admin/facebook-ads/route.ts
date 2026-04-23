import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { isAdminEmail } from "@/lib/session";

interface MetaInsightRow {
  spend?: string;
  impressions?: string;
  reach?: string;
  clicks?: string;
  ctr?: string;
  cpc?: string;
  frequency?: string;
  actions?: { action_type: string; value: string }[];
}

async function fetchInsights(accountId: string, token: string, datePreset: string): Promise<MetaInsightRow | null> {
  const fields = "spend,impressions,reach,clicks,ctr,cpc,frequency,actions";
  const url = `https://graph.facebook.com/v19.0/act_${accountId}/insights?fields=${fields}&date_preset=${datePreset}&access_token=${token}`;
  const res = await fetch(url);
  const json = await res.json() as { data?: MetaInsightRow[]; error?: { message: string } };
  if (json.error) throw new Error(json.error.message);
  return json.data?.[0] ?? null;
}

function parseRow(row: MetaInsightRow | null) {
  if (!row) return { spend: 0, impressions: 0, reach: 0, clicks: 0, ctr: 0, cpc: 0, frequency: 0, linkClicks: 0 };
  const linkClicks = row.actions?.find(a => a.action_type === "link_click")?.value;
  return {
    spend: Number(row.spend ?? 0),
    impressions: Number(row.impressions ?? 0),
    reach: Number(row.reach ?? 0),
    clicks: Number(row.clicks ?? 0),
    ctr: Number(Number(row.ctr ?? 0).toFixed(2)),
    cpc: Number(Number(row.cpc ?? 0).toFixed(2)),
    frequency: Number(Number(row.frequency ?? 0).toFixed(2)),
    linkClicks: Number(linkClicks ?? 0),
  };
}

export async function GET() {
  const session = await auth();
  if (!isAdminEmail(session?.user?.email)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const token = process.env.META_ACCESS_TOKEN;
  const accountId = process.env.META_AD_ACCOUNT_ID;

  if (!token || !accountId) {
    return NextResponse.json({ error: "META_ACCESS_TOKEN and META_AD_ACCOUNT_ID env vars required" }, { status: 500 });
  }

  try {
    const [today, yesterday, last7d, last30d] = await Promise.all([
      fetchInsights(accountId, token, "today"),
      fetchInsights(accountId, token, "yesterday"),
      fetchInsights(accountId, token, "last_7d"),
      fetchInsights(accountId, token, "last_30d"),
    ]);

    return NextResponse.json({
      today: parseRow(today),
      yesterday: parseRow(yesterday),
      last7d: parseRow(last7d),
      last30d: parseRow(last30d),
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
