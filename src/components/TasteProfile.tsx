"use client";

import { useState, useEffect } from "react";

interface TasteData {
  totalLiked: number;
  totalDisliked: number;
  totalWatched: number;
  totalWatchlist: number;
  favoriteGenres: { genre: string; count: number }[];
  avoidedGenres: { genre: string; count: number }[];
  moviesWatched: number;
  showsWatched: number;
}

interface TasteProfileProps {
  memberId: number;
  memberName: string;
  onClose: () => void;
}

const GENRE_LABELS: Record<string, string> = {
  action: "Action", comedy: "Comedy", drama: "Drama", horror: "Horror",
  "sci-fi": "Sci-Fi", romance: "Romance", thriller: "Thriller",
  animation: "Animation", documentary: "Documentary", fantasy: "Fantasy",
  mystery: "Mystery", adventure: "Adventure",
};

export default function TasteProfile({ memberId, memberName, onClose }: TasteProfileProps) {
  const [data, setData] = useState<TasteData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/taste-profile?memberId=${memberId}`)
      .then((r) => r.json())
      .then((d) => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [memberId]);

  if (loading) {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
        <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
        <div className="relative bg-gray-900 border border-gray-700/50 rounded-3xl max-w-md w-full p-8 text-center">
          <div className="w-10 h-10 mx-auto rounded-full border-4 border-gray-700 border-t-purple-500 animate-spin" />
        </div>
      </div>
    );
  }

  if (!data || !data.totalLiked) {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
        <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
        <div className="relative bg-gray-900 border border-gray-700/50 rounded-3xl max-w-md w-full p-8 text-center">
          <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-white text-xl">&times;</button>
          <p className="text-gray-400">Not enough data yet — keep rating movies to build your taste profile!</p>
        </div>
      </div>
    );
  }

  const maxGenreCount = data.favoriteGenres[0]?.count || 1;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-gray-900 border border-gray-700/50 rounded-3xl max-w-md w-full p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-white text-xl">&times;</button>

        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full mb-3">
            Taste Profile
          </div>
          <h2 className="text-xl font-bold text-white">{memberName}&apos;s Stats</h2>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <StatCard label="Liked" value={data.totalLiked} color="text-green-400" />
          <StatCard label="Disliked" value={data.totalDisliked} color="text-red-400" />
          <StatCard label="Movies Watched" value={data.moviesWatched} color="text-purple-400" />
          <StatCard label="Shows Watched" value={data.showsWatched} color="text-pink-400" />
        </div>

        {data.totalWatchlist > 0 && (
          <div className="text-center mb-6 text-gray-400 text-sm">
            {data.totalWatchlist} on watchlist
          </div>
        )}

        {/* Favorite genres */}
        {data.favoriteGenres.length > 0 && (
          <div className="mb-6">
            <h3 className="text-gray-400 text-xs uppercase tracking-wider mb-3">Top Genres</h3>
            <div className="space-y-2">
              {data.favoriteGenres.map((g) => (
                <div key={g.genre} className="flex items-center gap-3">
                  <span className="text-gray-300 text-sm w-24 text-right flex-shrink-0">
                    {GENRE_LABELS[g.genre] || g.genre}
                  </span>
                  <div className="flex-1 bg-gray-800 rounded-full h-4 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-purple-600 to-pink-600 rounded-full transition-all"
                      style={{ width: `${(g.count / maxGenreCount) * 100}%` }}
                    />
                  </div>
                  <span className="text-gray-500 text-xs w-6">{g.count}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Avoided genres */}
        {data.avoidedGenres.length > 0 && (
          <div>
            <h3 className="text-gray-400 text-xs uppercase tracking-wider mb-3">Genres You Avoid</h3>
            <div className="flex flex-wrap gap-2">
              {data.avoidedGenres.map((g) => (
                <span key={g.genre} className="bg-red-950/40 border border-red-800/30 text-red-400 text-xs px-3 py-1.5 rounded-full">
                  {GENRE_LABELS[g.genre] || g.genre} ({g.count})
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="bg-gray-800/50 border border-gray-700/40 rounded-xl p-4 text-center">
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
      <p className="text-gray-500 text-xs mt-1">{label}</p>
    </div>
  );
}
