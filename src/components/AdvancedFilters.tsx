"use client";

import { useState, useEffect } from "react";

interface AdvancedFiltersProps {
  onApply: (filters: {
    genre?: string;
    decade?: string;
    minRating?: number;
    maxRuntime?: number;
    providerId?: number;
    providerName?: string;
    region?: string;
  }) => void;
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

// TMDB provider IDs — same across all regions
const PLATFORMS = [
  { id: 8,   name: "Netflix",    logo: "🔴" },
  { id: 337, name: "Disney+",    logo: "🔵" },
  { id: 9,   name: "Prime",      logo: "🟡" },
  { id: 2,   name: "Apple TV+",  logo: "⚫" },
  { id: 384, name: "HBO Max",    logo: "🟣" },
  { id: 15,  name: "Hulu",       logo: "🟢" },
  { id: 230, name: "Crave",      logo: "🟤" },
  { id: 350, name: "Apple TV",   logo: "⬛" },
];

// Detect country from browser locale as best-effort region
const REGIONS = [
  { code: "US", label: "United States" },
  { code: "CA", label: "Canada" },
  { code: "GB", label: "UK" },
  { code: "AU", label: "Australia" },
  { code: "FR", label: "France" },
  { code: "DE", label: "Germany" },
];

export default function AdvancedFilters({ onApply, loading, onClose }: AdvancedFiltersProps) {
  const [genre, setGenre] = useState<string>("");
  const [decade, setDecade] = useState<string>("");
  const [minRating, setMinRating] = useState(0);
  const [maxRuntime, setMaxRuntime] = useState(0);
  const [providerId, setProviderId] = useState<number | null>(null);
  const [region, setRegion] = useState("US");

  useEffect(() => {
    fetch("/api/geo")
      .then(r => r.json())
      .then(d => { if (d.country) setRegion(d.country); })
      .catch(() => {});
  }, []);

  const handleApply = () => {
    const platform = PLATFORMS.find(p => p.id === providerId);
    onApply({
      genre: genre || undefined,
      decade: decade || undefined,
      minRating: minRating || undefined,
      maxRuntime: maxRuntime || undefined,
      providerId: providerId || undefined,
      providerName: platform?.name,
      region,
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

        {/* Streaming Platform */}
        <div className="mb-5">
          <p className="text-gray-400 text-xs uppercase tracking-wider mb-2">Streaming Platform</p>
          <div className="grid grid-cols-4 gap-2">
            <button
              onClick={() => setProviderId(null)}
              className={`py-2 px-1 rounded-xl text-xs font-medium transition-all flex flex-col items-center gap-1 ${!providerId ? "bg-purple-600 text-white" : "bg-gray-800 text-gray-400 hover:text-white"}`}
            >
              <span className="text-base">🎬</span>
              Any
            </button>
            {PLATFORMS.map((p) => (
              <button
                key={p.id}
                onClick={() => setProviderId(p.id === providerId ? null : p.id)}
                className={`py-2 px-1 rounded-xl text-xs font-medium transition-all flex flex-col items-center gap-1 ${providerId === p.id ? "bg-purple-600 text-white ring-2 ring-purple-400" : "bg-gray-800 text-gray-400 hover:text-white"}`}
              >
                <span className="text-base">{p.logo}</span>
                {p.name}
              </button>
            ))}
          </div>
        </div>

        {/* Region (only when platform is selected) */}
        {providerId && (
          <div className="mb-5">
            <p className="text-gray-400 text-xs uppercase tracking-wider mb-2">Your Country</p>
            <div className="flex flex-wrap gap-2">
              {REGIONS.map((r) => (
                <button
                  key={r.code}
                  onClick={() => setRegion(r.code)}
                  className={`px-3 py-1.5 rounded-full text-sm transition-all ${region === r.code ? "bg-purple-600 text-white" : "bg-gray-800 text-gray-400 hover:text-white"}`}
                >
                  {r.label}
                </button>
              ))}
            </div>
            <p className="text-gray-600 text-xs mt-2">Shows availability in your country</p>
          </div>
        )}

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
          {loading ? "Searching..." : providerId ? `Search ${PLATFORMS.find(p => p.id === providerId)?.name}` : "Apply Filters"}
        </button>
      </div>
    </div>
  );
}
