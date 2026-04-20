"use client";

import { useState, useRef, useEffect } from "react";

interface PremiumMenuProps {
  onWatchlist: () => void;
  onTasteProfile: () => void;
  onAdvancedFilters: () => void;
  isAdmin?: boolean;
}

const MENU_ITEMS = [
  {
    id: "watchlist",
    icon: "📋",
    label: "My Watchlist",
    description: "Movies you saved",
  },
  {
    id: "taste",
    icon: "📊",
    label: "Taste Profile",
    description: "Your genre stats",
  },
  {
    id: "filters",
    icon: "🎚️",
    label: "Advanced Filters",
    description: "By platform, decade, rating",
  },
];

export default function PremiumMenu({ onWatchlist, onTasteProfile, onAdvancedFilters, isAdmin }: PremiumMenuProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const handleItem = (id: string) => {
    setOpen(false);
    if (id === "watchlist") onWatchlist();
    if (id === "taste") onTasteProfile();
    if (id === "filters") onAdvancedFilters();
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(o => !o)}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-semibold transition-all ${
          open
            ? "bg-purple-600 text-white"
            : "bg-gradient-to-r from-purple-600/20 to-pink-600/20 border border-purple-500/40 text-purple-300 hover:border-purple-400/60 hover:text-white"
        }`}
      >
        <span className="text-xs">{isAdmin ? "👑" : "⭐"}</span>
        <span className="hidden sm:inline">{isAdmin ? "Admin" : "Premium"}</span>
        <svg className={`w-3 h-3 transition-transform ${open ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-56 bg-gray-900 border border-gray-700/60 rounded-2xl shadow-2xl shadow-purple-900/30 overflow-hidden z-[200]">
          <div className="px-4 py-3 border-b border-gray-800">
            <p className="text-xs text-gray-400 uppercase tracking-wider">Your Premium Features</p>
          </div>
          {MENU_ITEMS.map((item) => (
            <button
              key={item.id}
              onClick={() => handleItem(item.id)}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-800/60 transition-colors text-left"
            >
              <span className="text-xl flex-shrink-0">{item.icon}</span>
              <div>
                <p className="text-white text-sm font-medium">{item.label}</p>
                <p className="text-gray-500 text-xs">{item.description}</p>
              </div>
            </button>
          ))}
          {isAdmin && (
            <>
              <div className="border-t border-gray-800" />
              <a
                href="/admin"
                onClick={() => setOpen(false)}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-800/60 transition-colors text-left"
              >
                <span className="text-xl flex-shrink-0">🛠️</span>
                <div>
                  <p className="text-yellow-300 text-sm font-medium">Admin Dashboard</p>
                  <p className="text-gray-500 text-xs">Users, stats, revenue</p>
                </div>
              </a>
            </>
          )}
        </div>
      )}
    </div>
  );
}
