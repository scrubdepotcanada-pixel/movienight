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
    const [realtime, last7, last30, todayVsYesterday, topPages, topCountries, devices, hourly] = await Promise.all([
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

      // Today vs yesterday comparison — two date ranges in one request
      client.runReport({
        property: `properties/${propertyId}`,
        dateRanges: [
          { startDate: "today", endDate: "today" },
          { startDate: "yesterday", endDate: "yesterday" },
        ],
        metrics: [
          { name: "activeUsers" },
          { name: "sessions" },
          { name: "screenPageViews" },
          { name: "newUsers" },
          { name: "averageSessionDuration" },
          { name: "bounceRate" },
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

      // Hourly breakdown for today
      client.runReport({
        property: `properties/${propertyId}`,
        dateRanges: [{ startDate: "today", endDate: "today" }],
        dimensions: [{ name: "hour" }],
        metrics: [{ name: "activeUsers" }, { name: "sessions" }],
        orderBys: [{ dimension: { dimensionName: "hour" } }],
      }),
    ]);

    const getMetric = (report: typeof last7, idx: number) =>
      report[0]?.rows?.[0]?.metricValues?.[idx]?.value || "0";

    // Multi-range report: rows[0] = today, rows[1] = yesterday
    const todayRows = todayVsYesterday[0]?.rows || [];
    const getTodayMetric = (rowIdx: number, metricIdx: number) =>
      Number(todayRows[rowIdx]?.metricValues?.[metricIdx]?.value || 0);

    const todayData = {
      users: getTodayMetric(0, 0),
      sessions: getTodayMetric(0, 1),
      pageViews: getTodayMetric(0, 2),
      newUsers: getTodayMetric(0, 3),
      avgSessionDuration: Number(getTodayMetric(0, 4).toFixed(0)),
      bounceRate: Number((getTodayMetric(0, 5) * 100).toFixed(1)),
    };
    const yesterdayData = {
      users: getTodayMetric(1, 0),
      sessions: getTodayMetric(1, 1),
      pageViews: getTodayMetric(1, 2),
      newUsers: getTodayMetric(1, 3),
      avgSessionDuration: Number(getTodayMetric(1, 4).toFixed(0)),
      bounceRate: Number((getTodayMetric(1, 5) * 100).toFixed(1)),
    };

    return NextResponse.json({
      realtime: {
        activeUsers: Number(realtime[0]?.rows?.[0]?.metricValues?.[0]?.value || 0),
      },
      today: todayData,
      yesterday: yesterdayData,
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
      hourlyToday: (hourly[0]?.rows || []).map(r => ({
        hour: Number(r.dimensionValues?.[0]?.value || 0),
        users: Number(r.metricValues?.[0]?.value || 0),
        sessions: Number(r.metricValues?.[1]?.value || 0),
      })),
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("GA4 API error:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
