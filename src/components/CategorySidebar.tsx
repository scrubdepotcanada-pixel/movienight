"use client";

import { useState } from "react";

interface SidebarMovie {
  title: string;
  tmdb_id?: number;
}

interface CategorySidebarProps {
  category: string;
  likedMovies: SidebarMovie[];
  dislikedMovies: SidebarMovie[];
  onRemoveLike?: (title: string) => void;
  onRemoveDislike?: (tmdbId: number) => void;
}

export default function CategorySidebar({
  category,
  likedMovies,
  dislikedMovies,
  onRemoveLike,
  onRemoveDislike,
}: CategorySidebarProps) {
  const [expanded, setExpanded] = useState(false);
  const total = likedMovies.length + dislikedMovies.length;

  if (total === 0) return null;

  return (
    <div className="w-full max-w-4xl mx-auto">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-2 mx-auto text-xs text-gray-400 hover:text-gray-300 transition-colors mb-2"
      >
        <span className="uppercase tracking-wider font-medium">{category} history</span>
        <span className="bg-gray-700 text-gray-300 px-1.5 py-0.5 rounded-full text-[10px] font-bold">{total}</span>
        <svg className={`w-3 h-3 transition-transform ${expanded ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {expanded && (
        <div className="flex flex-wrap items-center gap-1.5 justify-center">
          {likedMovies.map((m, i) => (
            <span
              key={`liked-${i}`}
              className="inline-flex items-center gap-1 bg-green-900/30 border border-green-700/40 text-green-300 text-[11px] px-2 py-0.5 rounded-full"
            >
              👍 {m.title}
              {onRemoveLike && (
                <button
                  onClick={() => onRemoveLike(m.title)}
                  className="text-green-400 hover:text-red-400 font-bold text-sm leading-none ml-0.5"
                >
                  &times;
                </button>
              )}
            </span>
          ))}
          {dislikedMovies.map((m, i) => (
            <span
              key={`disliked-${i}`}
              className="inline-flex items-center gap-1 bg-red-900/30 border border-red-700/40 text-red-300 text-[11px] px-2 py-0.5 rounded-full"
            >
              👎 <span className="line-through">{m.title}</span>
              {onRemoveDislike && m.tmdb_id && (
                <button
                  onClick={() => onRemoveDislike(m.tmdb_id!)}
                  className="text-red-400 hover:text-red-300 font-bold text-sm leading-none ml-0.5"
                >
                  &times;
                </button>
              )}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
