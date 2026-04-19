"use client";

import { useState, useEffect } from "react";
import Image from "next/image";

interface WatchlistItem {
  id: number;
  tmdb_id: number;
  title: string;
  poster_path: string | null;
  vote_average: number | null;
  certification: string | null;
  overview: string | null;
  release_date: string | null;
  content_type: string;
}

interface WatchlistProps {
  memberId: number;
  memberName: string;
  onClose: () => void;
}

export default function Watchlist({ memberId, memberName, onClose }: WatchlistProps) {
  const [items, setItems] = useState<WatchlistItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/watchlist?memberId=${memberId}`)
      .then((r) => r.json())
      .then((d) => { setItems(Array.isArray(d) ? d : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [memberId]);

  const handleRemove = async (tmdbId: number) => {
    setItems((prev) => prev.filter((i) => i.tmdb_id !== tmdbId));
    await fetch("/api/watchlist", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ memberId, tmdbId }),
    });
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-gray-900 border border-gray-700/50 rounded-3xl max-w-lg w-full p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-white text-xl">&times;</button>

        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full mb-3">
            Watchlist
          </div>
          <h2 className="text-xl font-bold text-white">{memberName}&apos;s List</h2>
        </div>

        {loading ? (
          <div className="flex justify-center py-8">
            <div className="w-10 h-10 rounded-full border-4 border-gray-700 border-t-purple-500 animate-spin" />
          </div>
        ) : items.length === 0 ? (
          <p className="text-center text-gray-400 py-8">No movies saved yet. Tap the bookmark icon on any movie to add it!</p>
        ) : (
          <div className="space-y-3">
            {items.map((item) => {
              const posterSrc = item.poster_path
                ? `https://image.tmdb.org/t/p/w154${item.poster_path}`
                : null;
              const year = item.release_date?.slice(0, 4);

              return (
                <div key={item.tmdb_id} className="flex gap-3 bg-gray-800/50 border border-gray-700/40 rounded-xl p-3">
                  <div className="relative w-12 h-18 flex-shrink-0 rounded-lg overflow-hidden bg-gray-700">
                    {posterSrc ? (
                      <Image src={posterSrc} alt={item.title} fill className="object-cover" sizes="48px" unoptimized />
                    ) : (
                      <div className="flex items-center justify-center h-full text-gray-500 text-[8px] text-center p-1">
                        {item.title}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-semibold text-sm truncate">{item.title}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      {year && <span className="text-gray-500 text-xs">{year}</span>}
                      {item.certification && <span className="text-gray-500 text-xs">{item.certification}</span>}
                      {item.vote_average && <span className="text-gray-500 text-xs">{Number(item.vote_average).toFixed(1)}/10</span>}
                    </div>
                    <span className="text-gray-600 text-[10px] uppercase">{item.content_type}</span>
                  </div>
                  <button
                    onClick={() => handleRemove(item.tmdb_id)}
                    className="flex-shrink-0 text-gray-500 hover:text-red-400 transition-colors self-center"
                    title="Remove"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
