"use client";

import { useState } from "react";

interface AdvancedFiltersProps {
  onApply: (filters: { genre?: string; decade?: string; minRating?: number; maxRuntime?: number }) => void;
  loading?: boolean;
  onClose: () => void;
}

const DECADES = ["2020", "2010", "2000", "1990", "1980", "1970", "1960"];
const GENRES = [
  "Action", "Comedy", "Drama", "Horror", "Sci-Fi", "Romance",
  "Thriller", "Animation", "Documentary", "Fantasy", "Mystery", "Adventure",
];
const RATINGS = [
  { label: "Any", value: 0 },
  { label: "6+", value: 6 },
  { label: "7+", value: 7 },
  { label: "8+", value: 8 },
];
const RUNTIMES = [
  { label: "Any", value: 0 },
  { label: "< 90 min", value: 90 },
  { label: "< 2 hrs", value: 120 },
  { label: "< 2.5 hrs", value: 150 },
];

export default function AdvancedFilters({ onApply, loading, onClose }: AdvancedFiltersProps) {
  const [genre, setGenre] = useState<string>("");
  const [decade, setDecade] = useState<string>("");
  const [minRating, setMinRating] = useState(0);
  const [maxRuntime, setMaxRuntime] = useState(0);

  const handleApply = () => {
    onApply({
      genre: genre || undefined,
      decade: decade || undefined,
      minRating: minRating || undefined,
      maxRuntime: maxRuntime || undefined,
    });
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-gray-900 border border-gray-700/50 rounded-3xl max-w-md w-full p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-white text-xl">&times;</button>

        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full mb-3">
            Advanced Filters
          </div>
          <h2 className="text-xl font-bold text-white">Find exactly what you want</h2>
        </div>

        {/* Genre */}
        <div className="mb-5">
          <p className="text-gray-400 text-xs uppercase tracking-wider mb-2">Genre</p>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setGenre("")}
              className={`px-3 py-1.5 rounded-full text-sm transition-all ${!genre ? "bg-purple-600 text-white" : "bg-gray-800 text-gray-400 hover:text-white"}`}
            >
              Any
            </button>
            {GENRES.map((g) => (
              <button
                key={g}
                onClick={() => setGenre(g.toLowerCase())}
                className={`px-3 py-1.5 rounded-full text-sm transition-all ${genre === g.toLowerCase() ? "bg-purple-600 text-white" : "bg-gray-800 text-gray-400 hover:text-white"}`}
              >
                {g}
              </button>
            ))}
          </div>
        </div>

        {/* Decade */}
        <div className="mb-5">
          <p className="text-gray-400 text-xs uppercase tracking-wider mb-2">Decade</p>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setDecade("")}
              className={`px-3 py-1.5 rounded-full text-sm transition-all ${!decade ? "bg-purple-600 text-white" : "bg-gray-800 text-gray-400 hover:text-white"}`}
            >
              Any
            </button>
            {DECADES.map((d) => (
              <button
                key={d}
                onClick={() => setDecade(d)}
                className={`px-3 py-1.5 rounded-full text-sm transition-all ${decade === d ? "bg-purple-600 text-white" : "bg-gray-800 text-gray-400 hover:text-white"}`}
              >
                {d}s
              </button>
            ))}
          </div>
        </div>

        {/* Min Rating */}
        <div className="mb-5">
          <p className="text-gray-400 text-xs uppercase tracking-wider mb-2">Minimum Rating</p>
          <div className="flex gap-2">
            {RATINGS.map((r) => (
              <button
                key={r.value}
                onClick={() => setMinRating(r.value)}
                className={`flex-1 py-2 rounded-xl text-sm font-medium transition-all ${minRating === r.value ? "bg-purple-600 text-white" : "bg-gray-800 text-gray-400 hover:text-white"}`}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>

        {/* Max Runtime */}
        <div className="mb-6">
          <p className="text-gray-400 text-xs uppercase tracking-wider mb-2">Max Runtime</p>
          <div className="flex gap-2">
            {RUNTIMES.map((r) => (
              <button
                key={r.value}
                onClick={() => setMaxRuntime(r.value)}
                className={`flex-1 py-2 rounded-xl text-sm font-medium transition-all ${maxRuntime === r.value ? "bg-purple-600 text-white" : "bg-gray-800 text-gray-400 hover:text-white"}`}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={handleApply}
          disabled={loading}
          className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white py-3.5 rounded-2xl font-bold text-base transition-all disabled:opacity-50"
        >
          {loading ? "Searching..." : "Apply Filters"}
        </button>
      </div>
    </div>
  );
}
