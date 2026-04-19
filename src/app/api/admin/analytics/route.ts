import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { isAdminEmail } from "@/lib/session";
import { BetaAnalyticsDataClient } from "@google-analytics/data";

function getAnalyticsClient(): BetaAnalyticsDataClient | null {
  const credentials = process.env.GA4_CREDENTIALS;
  if (!credentials) return null;
  try {
    const parsed = JSON.parse(credentials);
    return new BetaAnalyticsDataClient({ credentials: parsed });
  } catch {
    return null;
  }
}

export async function GET() {
  const session = await auth();
  if (!isAdminEmail(session?.user?.email)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const propertyId = process.env.GA4_PROPERTY_ID;
  if (!propertyId) {
    return NextResponse.json({ error: "GA4_PROPERTY_ID not set" }, { status: 500 });
  }

  const client = getAnalyticsClient();
  if (!client) {
    return NextResponse.json({ error: "GA4_CREDENTIALS not set" }, { status: 500 });
  }

  try {
    const [realtime, last7, last30, topPages, topCountries, devices] = await Promise.all([
      client.runRealtimeReport({
        property: `properties/${propertyId}`,
        metrics: [{ name: "activeUsers" }],
      }),

      client.runReport({
        property: `properties/${propertyId}`,
        dateRanges: [{ startDate: "7daysAgo", endDate: "today" }],
        metrics: [
          { name: "activeUsers" },
          { name: "sessions" },
          { name: "screenPageViews" },
          { name: "averageSessionDuration" },
          { name: "bounceRate" },
          { name: "newUsers" },
        ],
      }),

      client.runReport({
        property: `properties/${propertyId}`,
        dateRanges: [{ startDate: "30daysAgo", endDate: "today" }],
        metrics: [
          { name: "activeUsers" },
          { name: "sessions" },
          { name: "screenPageViews" },
          { name: "newUsers" },
        ],
      }),

      client.runReport({
        property: `properties/${propertyId}`,
        dateRanges: [{ startDate: "7daysAgo", endDate: "today" }],
        dimensions: [{ name: "pagePath" }],
        metrics: [{ name: "screenPageViews" }],
        orderBys: [{ metric: { metricName: "screenPageViews" }, desc: true }],
        limit: 10,
      }),

      client.runReport({
        property: `properties/${propertyId}`,
        dateRanges: [{ startDate: "30daysAgo", endDate: "today" }],
        dimensions: [{ name: "country" }],
        metrics: [{ name: "activeUsers" }],
        orderBys: [{ metric: { metricName: "activeUsers" }, desc: true }],
        limit: 10,
      }),

      client.runReport({
        property: `properties/${propertyId}`,
        dateRanges: [{ startDate: "30daysAgo", endDate: "today" }],
        dimensions: [{ name: "deviceCategory" }],
        metrics: [{ name: "activeUsers" }],
        orderBys: [{ metric: { metricName: "activeUsers" }, desc: true }],
      }),
    ]);

    const getMetric = (report: typeof last7, idx: number) =>
      report[0]?.rows?.[0]?.metricValues?.[idx]?.value || "0";

    return NextResponse.json({
      realtime: {
        activeUsers: Number(realtime[0]?.rows?.[0]?.metricValues?.[0]?.value || 0),
      },
      last7Days: {
        users: Number(getMetric(last7, 0)),
        sessions: Number(getMetric(last7, 1)),
        pageViews: Number(getMetric(last7, 2)),
        avgSessionDuration: Number(Number(getMetric(last7, 3)).toFixed(0)),
        bounceRate: Number((Number(getMetric(last7, 4)) * 100).toFixed(1)),
        newUsers: Number(getMetric(last7, 5)),
      },
      last30Days: {
        users: Number(getMetric(last30, 0)),
        sessions: Number(getMetric(last30, 1)),
        pageViews: Number(getMetric(last30, 2)),
        newUsers: Number(getMetric(last30, 3)),
      },
      topPages: (topPages[0]?.rows || []).map(r => ({
        path: r.dimensionValues?.[0]?.value || "",
        views: Number(r.metricValues?.[0]?.value || 0),
      })),
      topCountries: (topCountries[0]?.rows || []).map(r => ({
        country: r.dimensionValues?.[0]?.value || "",
        users: Number(r.metricValues?.[0]?.value || 0),
      })),
      devices: (devices[0]?.rows || []).map(r => ({
        device: r.dimensionValues?.[0]?.value || "",
        users: Number(r.metricValues?.[0]?.value || 0),
      })),
    });
  } catch (err) {
    console.error("GA4 API error:", err);
    return NextResponse.json({ error: "Failed to fetch analytics" }, { status: 500 });
  }
}
