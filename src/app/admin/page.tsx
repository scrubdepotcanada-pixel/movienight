"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";

interface Stats {
  users: {
    googleSignIns: number;
    guestSessions: number;
    totalMembers: number;
    premiumUsers: number;
  };
  activity: {
    totalLiked: number;
    totalDisliked: number;
    totalWatched: number;
    totalWatchlist: number;
    totalSwipeSessions: number;
  };
  revenue: {
    mrr: number;
    arr: number;
    totalRevenue: number;
    monthlySubscribers: number;
    yearlySubscribers: number;
    payingSubscribers: { email: string; name: string; plan: string; premiumUntil: string }[];
    paymentHistory: { email: string; name: string; plan: string; amount: number; currency: string; status: string; paidAt: string }[];
  };
  recentSignups: { email: string; name: string; signedUp: string }[];
  userDetails: {
    email: string;
    name: string;
    signedUp: string;
    isPremium: boolean;
    plan: string | null;
    members: number;
    liked: number;
    disliked: number;
  }[];
}

interface Analytics {
  realtime: { activeUsers: number };
  last7Days: {
    users: number;
    sessions: number;
    pageViews: number;
    avgSessionDuration: number;
    bounceRate: number;
    newUsers: number;
  };
  last30Days: {
    users: number;
    sessions: number;
    pageViews: number;
    newUsers: number;
  };
  topPages: { path: string; views: number }[];
  topCountries: { country: string; users: number }[];
  devices: { device: string; users: number }[];
}

export default function AdminPage() {
  const { status } = useSession();
  const [stats, setStats] = useState<Stats | null>(null);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [analyticsError, setAnalyticsError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [authed, setAuthed] = useState(false);
  const [tab, setTab] = useState<"overview" | "users" | "revenue" | "analytics">("overview");

  useEffect(() => {
    if (status !== "authenticated") return;
    fetch("/api/premium")
      .then(r => r.json())
      .then(d => {
        if (d.isAdmin) {
          setAuthed(true);
          loadAll();
        } else {
          setLoading(false);
        }
      })
      .catch(() => setLoading(false));
  }, [status]);

  const loadAll = () => {
    setLoading(true);
    Promise.all([
      fetch("/api/admin/stats").then(r => r.ok ? r.json() : null),
      fetch("/api/admin/analytics").then(r => r.ok ? r.json() : null).catch(() => null),
    ]).then(([s, a]) => {
      if (s) setStats(s);
      if (a && !a.error) {
        setAnalytics(a);
        setAnalyticsError(null);
      } else if (a?.error) {
        setAnalyticsError(a.error);
      }
      setLoading(false);
    }).catch(() => setLoading(false));
  };

  const handlePasswordLogin = () => {
    fetch(`/api/admin/stats?key=${encodeURIComponent(password)}`)
      .then(r => {
        if (!r.ok) throw new Error("Wrong password");
        return r.json();
      })
      .then(d => { setStats(d); setAuthed(true); setError(null); setLoading(false); })
      .catch(() => setError("Wrong password"));
  };

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center">
        <div className="w-12 h-12 rounded-full border-4 border-gray-700 border-t-purple-500 animate-spin" />
      </div>
    );
  }

  if (!authed) {
    return (
      <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center px-4">
        <div className="max-w-sm w-full bg-gray-900 border border-gray-700/50 rounded-2xl p-6">
          <h1 className="text-xl font-bold text-center mb-4">Admin Access</h1>
          {error && <p className="text-red-400 text-sm text-center mb-3">{error}</p>}
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handlePasswordLogin()}
            placeholder="Admin password"
            className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white mb-3 focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
          <button
            onClick={handlePasswordLogin}
            className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3 rounded-xl font-bold transition-colors"
          >
            Enter
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            Admin Dashboard
          </h1>
          <div className="flex items-center gap-3">
            <button onClick={loadAll} className="text-gray-400 hover:text-white text-sm transition-colors">Refresh</button>
            <a href="/" className="text-gray-400 hover:text-white text-sm">Back to app</a>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-gray-900 rounded-xl p-1 mb-8 max-w-lg">
          {(["overview", "users", "revenue", "analytics"] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all capitalize ${
                tab === t ? "bg-purple-600 text-white" : "text-gray-400 hover:text-white"
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {/* OVERVIEW TAB */}
        {tab === "overview" && stats && (
          <>
            {/* Realtime */}
            {analytics && (
              <div className="mb-6 bg-green-950/30 border border-green-800/30 rounded-2xl p-4 flex items-center gap-4">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
                <div>
                  <span className="text-green-400 text-2xl font-bold">{analytics.realtime.activeUsers}</span>
                  <span className="text-gray-400 text-sm ml-2">active right now</span>
                </div>
              </div>
            )}

            {/* Key metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
              <MetricCard label="Google Sign-ins" value={stats.users.googleSignIns} color="text-purple-400" />
              <MetricCard label="Guest Sessions" value={stats.users.guestSessions} color="text-gray-400" />
              <MetricCard label="Total Members" value={stats.users.totalMembers} color="text-blue-400" />
              <MetricCard label="Premium Users" value={stats.users.premiumUsers} color="text-green-400" />
            </div>

            {/* Revenue summary */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
              <div className="bg-gray-900 border border-green-800/20 rounded-xl p-4 text-center">
                <p className="text-green-400 text-2xl font-bold">${stats.revenue.mrr.toFixed(2)}</p>
                <p className="text-gray-500 text-xs mt-1">MRR</p>
              </div>
              <div className="bg-gray-900 border border-blue-800/20 rounded-xl p-4 text-center">
                <p className="text-blue-400 text-2xl font-bold">${stats.revenue.arr.toFixed(2)}</p>
                <p className="text-gray-500 text-xs mt-1">ARR</p>
              </div>
              <div className="bg-gray-900 border border-gray-700/40 rounded-xl p-4 text-center col-span-2 sm:col-span-1 cursor-pointer hover:border-purple-700/40 transition-colors" onClick={() => setTab("revenue")}>
                <p className="text-white text-2xl font-bold">{stats.revenue.monthlySubscribers + stats.revenue.yearlySubscribers}</p>
                <p className="text-gray-500 text-xs mt-1">Paying Subscribers →</p>
              </div>
            </div>

            {/* Activity */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 mb-6">
              <MetricCard label="Liked" value={stats.activity.totalLiked} color="text-green-400" />
              <MetricCard label="Disliked" value={stats.activity.totalDisliked} color="text-red-400" />
              <MetricCard label="Watched" value={stats.activity.totalWatched} color="text-yellow-400" />
              <MetricCard label="Watchlist" value={stats.activity.totalWatchlist} color="text-pink-400" />
              <MetricCard label="Swipe Sessions" value={stats.activity.totalSwipeSessions} color="text-orange-400" />
            </div>

            {/* GA 7-day + 30-day side by side */}
            {analytics && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                <div className="bg-gray-900 border border-gray-700/40 rounded-2xl p-5">
                  <h3 className="text-gray-400 text-xs uppercase tracking-wider mb-4">Last 7 Days</h3>
                  <div className="space-y-3">
                    <StatRow label="Users" value={analytics.last7Days.users} />
                    <StatRow label="New Users" value={analytics.last7Days.newUsers} />
                    <StatRow label="Sessions" value={analytics.last7Days.sessions} />
                    <StatRow label="Page Views" value={analytics.last7Days.pageViews} />
                    <StatRow label="Avg Session" value={`${analytics.last7Days.avgSessionDuration}s`} />
                    <StatRow label="Bounce Rate" value={`${analytics.last7Days.bounceRate}%`} />
                  </div>
                </div>
                <div className="bg-gray-900 border border-gray-700/40 rounded-2xl p-5">
                  <h3 className="text-gray-400 text-xs uppercase tracking-wider mb-4">Last 30 Days</h3>
                  <div className="space-y-3">
                    <StatRow label="Users" value={analytics.last30Days.users} />
                    <StatRow label="New Users" value={analytics.last30Days.newUsers} />
                    <StatRow label="Sessions" value={analytics.last30Days.sessions} />
                    <StatRow label="Page Views" value={analytics.last30Days.pageViews} />
                  </div>
                </div>
              </div>
            )}

            {analyticsError && (
              <div className="bg-yellow-950/30 border border-yellow-800/30 rounded-2xl p-4 mb-6">
                <p className="text-yellow-400 text-sm">Google Analytics: {analyticsError}</p>
                <p className="text-gray-500 text-xs mt-1">Set GA4_PROPERTY_ID and GA4_CREDENTIALS env vars to enable.</p>
              </div>
            )}
          </>
        )}

        {/* USERS TAB */}
        {tab === "users" && stats && (
          <div className="bg-gray-900 border border-gray-700/50 rounded-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-800">
              <h2 className="text-lg font-bold">Users ({stats.userDetails.length})</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-gray-400 text-xs uppercase tracking-wider border-b border-gray-800">
                    <th className="text-left px-6 py-3">User</th>
                    <th className="text-left px-4 py-3">Signed Up</th>
                    <th className="text-center px-4 py-3">Members</th>
                    <th className="text-center px-4 py-3">Liked</th>
                    <th className="text-center px-4 py-3">Disliked</th>
                    <th className="text-center px-4 py-3">Plan</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.userDetails.map((user, i) => (
                    <tr key={i} className="border-b border-gray-800/50 hover:bg-gray-800/30">
                      <td className="px-6 py-3">
                        <p className="text-white font-medium">{user.name || "—"}</p>
                        <p className="text-gray-500 text-xs">{user.email || "—"}</p>
                      </td>
                      <td className="px-4 py-3 text-gray-400 text-xs">
                        {user.signedUp ? new Date(user.signedUp).toLocaleDateString() : "—"}
                      </td>
                      <td className="px-4 py-3 text-center text-gray-300">{user.members}</td>
                      <td className="px-4 py-3 text-center text-green-400">{user.liked}</td>
                      <td className="px-4 py-3 text-center text-red-400">{user.disliked}</td>
                      <td className="px-4 py-3 text-center">
                        {user.isPremium ? (
                          <span className="bg-gradient-to-r from-purple-600 to-pink-600 text-white text-[10px] font-bold px-2 py-1 rounded-full">
                            {user.plan === "admin" ? "ADMIN" : "PRO"}
                          </span>
                        ) : (
                          <span className="text-gray-600 text-xs">Free</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* REVENUE TAB */}
        {tab === "revenue" && stats && (
          <div className="space-y-6">
            {/* Revenue summary cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-gray-900 border border-green-800/30 rounded-xl p-4 text-center">
                <p className="text-green-400 text-3xl font-bold">${stats.revenue.mrr.toFixed(2)}</p>
                <p className="text-gray-500 text-xs mt-1">MRR</p>
              </div>
              <div className="bg-gray-900 border border-blue-800/30 rounded-xl p-4 text-center">
                <p className="text-blue-400 text-3xl font-bold">${stats.revenue.arr.toFixed(2)}</p>
                <p className="text-gray-500 text-xs mt-1">ARR</p>
              </div>
              <div className="bg-gray-900 border border-purple-800/30 rounded-xl p-4 text-center">
                <p className="text-purple-400 text-3xl font-bold">{stats.revenue.monthlySubscribers}</p>
                <p className="text-gray-500 text-xs mt-1">Monthly @ $3.99</p>
              </div>
              <div className="bg-gray-900 border border-pink-800/30 rounded-xl p-4 text-center">
                <p className="text-pink-400 text-3xl font-bold">{stats.revenue.yearlySubscribers}</p>
                <p className="text-gray-500 text-xs mt-1">Yearly @ $39.99</p>
              </div>
            </div>

            {/* Total revenue from payment records */}
            {stats.revenue.totalRevenue > 0 && (
              <div className="bg-gradient-to-r from-purple-950/40 to-pink-950/40 border border-purple-700/30 rounded-2xl p-5 flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-xs uppercase tracking-wider mb-1">Total Revenue Collected</p>
                  <p className="text-white text-4xl font-bold">${stats.revenue.totalRevenue.toFixed(2)}</p>
                </div>
                <div className="text-4xl opacity-30">💰</div>
              </div>
            )}

            {/* Paying subscribers table */}
            <div className="bg-gray-900 border border-gray-700/50 rounded-2xl overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-800 flex items-center justify-between">
                <h2 className="text-lg font-bold">Active Subscribers ({stats.revenue.payingSubscribers.length})</h2>
                <span className="text-gray-500 text-xs">Excludes admin accounts</span>
              </div>
              {stats.revenue.payingSubscribers.length === 0 ? (
                <div className="px-6 py-12 text-center">
                  <p className="text-gray-500 text-sm">No paying subscribers yet</p>
                  <p className="text-gray-600 text-xs mt-1">Stripe integration will populate this automatically</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-gray-400 text-xs uppercase tracking-wider border-b border-gray-800">
                        <th className="text-left px-6 py-3">Subscriber</th>
                        <th className="text-center px-4 py-3">Plan</th>
                        <th className="text-center px-4 py-3">Value/mo</th>
                        <th className="text-right px-6 py-3">Renews</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stats.revenue.payingSubscribers.map((s, i) => (
                        <tr key={i} className="border-b border-gray-800/50 hover:bg-gray-800/30">
                          <td className="px-6 py-3">
                            <p className="text-white font-medium">{s.name || "—"}</p>
                            <p className="text-gray-500 text-xs">{s.email || "—"}</p>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${
                              s.plan === "yearly"
                                ? "bg-blue-900/50 text-blue-300 border border-blue-700/50"
                                : "bg-purple-900/50 text-purple-300 border border-purple-700/50"
                            }`}>
                              {s.plan === "yearly" ? "YEARLY" : "MONTHLY"}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center text-green-400 font-semibold">
                            ${s.plan === "yearly" ? (39.99 / 12).toFixed(2) : "3.99"}
                          </td>
                          <td className="px-6 py-3 text-right text-gray-400 text-xs">
                            {s.premiumUntil ? new Date(s.premiumUntil).toLocaleDateString() : "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Payment history */}
            {stats.revenue.paymentHistory.length > 0 && (
              <div className="bg-gray-900 border border-gray-700/50 rounded-2xl overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-800">
                  <h2 className="text-lg font-bold">Payment History</h2>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-gray-400 text-xs uppercase tracking-wider border-b border-gray-800">
                        <th className="text-left px-6 py-3">Customer</th>
                        <th className="text-center px-4 py-3">Plan</th>
                        <th className="text-center px-4 py-3">Amount</th>
                        <th className="text-center px-4 py-3">Status</th>
                        <th className="text-right px-6 py-3">Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stats.revenue.paymentHistory.map((p, i) => (
                        <tr key={i} className="border-b border-gray-800/50 hover:bg-gray-800/30">
                          <td className="px-6 py-3">
                            <p className="text-white font-medium">{p.name || "—"}</p>
                            <p className="text-gray-500 text-xs">{p.email || "—"}</p>
                          </td>
                          <td className="px-4 py-3 text-center text-gray-300 text-xs capitalize">{p.plan}</td>
                          <td className="px-4 py-3 text-center text-green-400 font-semibold">
                            ${p.amount.toFixed(2)} {p.currency.toUpperCase()}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              p.status === "active" ? "bg-green-900/50 text-green-300" : "bg-gray-800 text-gray-500"
                            }`}>
                              {p.status.toUpperCase()}
                            </span>
                          </td>
                          <td className="px-6 py-3 text-right text-gray-400 text-xs">
                            {p.paidAt ? new Date(p.paidAt).toLocaleDateString() : "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ANALYTICS TAB */}
        {tab === "analytics" && (
          <>
            {analytics ? (
              <div className="space-y-6">
                {/* Realtime */}
                <div className="bg-green-950/30 border border-green-800/30 rounded-2xl p-6 text-center">
                  <p className="text-gray-400 text-xs uppercase tracking-wider mb-2">Right Now</p>
                  <p className="text-green-400 text-5xl font-bold">{analytics.realtime.activeUsers}</p>
                  <p className="text-gray-500 text-sm mt-1">active users</p>
                </div>

                {/* Top pages */}
                <div className="bg-gray-900 border border-gray-700/40 rounded-2xl p-5">
                  <h3 className="text-gray-400 text-xs uppercase tracking-wider mb-4">Top Pages (7 days)</h3>
                  <div className="space-y-2">
                    {analytics.topPages.map((p, i) => (
                      <div key={i} className="flex items-center justify-between">
                        <span className="text-gray-300 text-sm font-mono truncate flex-1 mr-4">{p.path}</span>
                        <span className="text-purple-400 font-bold text-sm">{p.views.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Countries + Devices side by side */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-gray-900 border border-gray-700/40 rounded-2xl p-5">
                    <h3 className="text-gray-400 text-xs uppercase tracking-wider mb-4">Top Countries (30 days)</h3>
                    <div className="space-y-2">
                      {analytics.topCountries.map((c, i) => {
                        const maxUsers = analytics.topCountries[0]?.users || 1;
                        return (
                          <div key={i}>
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-gray-300 text-sm">{c.country}</span>
                              <span className="text-blue-400 font-bold text-sm">{c.users}</span>
                            </div>
                            <div className="w-full bg-gray-800 rounded-full h-1.5">
                              <div className="h-full bg-blue-600 rounded-full" style={{ width: `${(c.users / maxUsers) * 100}%` }} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="bg-gray-900 border border-gray-700/40 rounded-2xl p-5">
                    <h3 className="text-gray-400 text-xs uppercase tracking-wider mb-4">Devices (30 days)</h3>
                    <div className="space-y-3">
                      {analytics.devices.map((d, i) => {
                        const total = analytics.devices.reduce((s, x) => s + x.users, 0);
                        const pct = total > 0 ? ((d.users / total) * 100).toFixed(0) : 0;
                        const icon = d.device === "mobile" ? "📱" : d.device === "desktop" ? "💻" : "📺";
                        return (
                          <div key={i} className="flex items-center gap-3">
                            <span className="text-xl">{icon}</span>
                            <div className="flex-1">
                              <div className="flex justify-between mb-1">
                                <span className="text-gray-300 text-sm capitalize">{d.device}</span>
                                <span className="text-gray-400 text-sm">{pct}%</span>
                              </div>
                              <div className="w-full bg-gray-800 rounded-full h-2">
                                <div className="h-full bg-gradient-to-r from-purple-600 to-pink-600 rounded-full" style={{ width: `${pct}%` }} />
                              </div>
                            </div>
                            <span className="text-gray-500 text-xs w-10 text-right">{d.users}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-gray-900 border border-gray-700/40 rounded-2xl p-8 text-center">
                <p className="text-gray-400 text-lg mb-2">Google Analytics not connected</p>
                <p className="text-gray-600 text-sm mb-4">Add these env vars to Vercel to enable:</p>
                <div className="bg-gray-800 rounded-xl p-4 text-left max-w-md mx-auto text-sm font-mono">
                  <p className="text-purple-400">GA4_PROPERTY_ID=<span className="text-gray-500">your-property-id</span></p>
                  <p className="text-purple-400 mt-1">GA4_CREDENTIALS=<span className="text-gray-500">{`{"type":"service_account",...}`}</span></p>
                </div>
                <p className="text-gray-600 text-xs mt-4">
                  Create a service account in Google Cloud, add it as a Viewer in GA4, then paste the JSON credentials.
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function MetricCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="bg-gray-900 border border-gray-700/40 rounded-xl p-4 text-center">
      <p className={`text-3xl font-bold ${color}`}>{value.toLocaleString()}</p>
      <p className="text-gray-500 text-xs mt-1">{label}</p>
    </div>
  );
}

function StatRow({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-gray-400 text-sm">{label}</span>
      <span className="text-white font-semibold text-sm">{typeof value === "number" ? value.toLocaleString() : value}</span>
    </div>
  );
}
