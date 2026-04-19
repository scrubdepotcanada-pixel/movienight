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

export default function AdminPage() {
  const { status } = useSession();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [authed, setAuthed] = useState(false);

  useEffect(() => {
    if (status !== "authenticated") return;
    fetch("/api/premium")
      .then(r => r.json())
      .then(d => {
        if (d.isAdmin) {
          setAuthed(true);
          loadStats();
        } else {
          setLoading(false);
        }
      })
      .catch(() => setLoading(false));
  }, [status]);

  const loadStats = () => {
    setLoading(true);
    fetch("/api/admin/stats")
      .then(r => {
        if (!r.ok) throw new Error("Unauthorized");
        return r.json();
      })
      .then(d => { setStats(d); setLoading(false); })
      .catch(() => { setError("Access denied"); setLoading(false); });
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

  if (!stats) return null;

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            Admin Dashboard
          </h1>
          <a href="/" className="text-gray-400 hover:text-white text-sm">Back to app</a>
        </div>

        {/* Key metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          <MetricCard label="Google Sign-ins" value={stats.users.googleSignIns} color="text-purple-400" />
          <MetricCard label="Guest Sessions" value={stats.users.guestSessions} color="text-gray-400" />
          <MetricCard label="Total Members" value={stats.users.totalMembers} color="text-blue-400" />
          <MetricCard label="Premium Users" value={stats.users.premiumUsers} color="text-green-400" />
        </div>

        {/* Activity */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 mb-8">
          <MetricCard label="Liked" value={stats.activity.totalLiked} color="text-green-400" />
          <MetricCard label="Disliked" value={stats.activity.totalDisliked} color="text-red-400" />
          <MetricCard label="Watched" value={stats.activity.totalWatched} color="text-yellow-400" />
          <MetricCard label="Watchlist" value={stats.activity.totalWatchlist} color="text-pink-400" />
          <MetricCard label="Swipe Sessions" value={stats.activity.totalSwipeSessions} color="text-orange-400" />
        </div>

        {/* User table */}
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

        {/* Refresh */}
        <div className="mt-6 text-center">
          <button
            onClick={loadStats}
            className="text-gray-400 hover:text-white text-sm transition-colors"
          >
            Refresh data
          </button>
        </div>
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
