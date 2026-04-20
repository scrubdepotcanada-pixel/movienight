"use client";

import { useState, useRef, useEffect } from "react";

interface InlineFiltersProps {
  filters: {
    genre?: string; decade?: string; minRating?: number; maxRuntime?: number;
    providerId?: number; providerName?: string; region?: string;
  };
  onChange: (filters: InlineFiltersProps["filters"]) => void;
  onClear: () => void;
}

const PLATFORMS = [
  { id: 8,   name: "Netflix",   logo: "🔴" },
  { id: 337, name: "Disney+",   logo: "🔵" },
  { id: 9,   name: "Prime",     logo: "🟡" },
  { id: 2,   name: "Apple TV+", logo: "⚫" },
  { id: 384, name: "HBO Max",   logo: "🟣" },
  { id: 15,  name: "Hulu",      logo: "🟢" },
  { id: 230, name: "Crave",     logo: "🟤" },
];

const GENRES = [
  "Action", "Comedy", "Drama", "Horror", "Sci-Fi", "Romance",
  "Thriller", "Animation", "Documentary", "Fantasy", "Mystery", "Adventure",
];

const DECADES = ["2020", "2010", "2000", "1990", "1980", "1970"];
const RATINGS = [
  { label: "Any", value: 0 },
  { label: "6+", value: 6 },
  { label: "7+", value: 7 },
  { label: "8+", value: 8 },
];

function FilterDropdown({ label, value, children, active }: {
  label: string; value: string; children: React.ReactNode; active: boolean;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(o => !o)}
        className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-medium transition-all whitespace-nowrap ${
          active
            ? "bg-purple-600/30 border border-purple-500/50 text-purple-200"
            : "bg-gray-800/60 border border-gray-700/50 text-gray-400 hover:text-white hover:border-gray-600"
        }`}
      >
        <span className="text-gray-500">{label}</span>
        <span className={active ? "text-white font-semibold" : ""}>{value}</span>
        <svg className={`w-3 h-3 ml-0.5 transition-transform ${open ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && (
        <div className="absolute left-0 top-full mt-1 bg-gray-900 border border-gray-700/60 rounded-xl shadow-2xl z-[200] max-h-60 overflow-y-auto min-w-[140px]">
          <div onClick={() => setOpen(false)}>
            {children}
          </div>
        </div>
      )}
    </div>
  );
}

function DropdownItem({ label, selected, onClick, icon }: {
  label: string; selected: boolean; onClick: () => void; icon?: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left px-3 py-2 text-xs transition-colors flex items-center gap-2 ${
        selected ? "bg-purple-600/30 text-purple-200" : "text-gray-300 hover:bg-gray-800"
      }`}
    >
      {icon && <span className="text-sm">{icon}</span>}
      {label}
    </button>
  );
}

export default function InlineFilters({ filters, onChange, onClear }: InlineFiltersProps) {
  const update = (patch: Partial<InlineFiltersProps["filters"]>) => {
    onChange({ ...filters, ...patch });
  };

  const hasAny = !!(filters.providerId || filters.genre || filters.decade || filters.minRating || filters.maxRuntime);

  return (
    <div className="max-w-6xl mx-auto px-4 mb-4">
      <div className="bg-gray-800/30 border border-gray-700/30 rounded-2xl px-4 py-3">
        <div className="flex flex-wrap items-center gap-2">
          {/* Platform */}
          <FilterDropdown label="📺" value={filters.providerName || "Any"} active={!!filters.providerId}>
            <DropdownItem label="Any platform" selected={!filters.providerId} onClick={() => update({ providerId: undefined, providerName: undefined })} />
            {PLATFORMS.map(p => (
              <DropdownItem
                key={p.id}
                label={p.name}
                icon={p.logo}
                selected={filters.providerId === p.id}
                onClick={() => update({ providerId: p.id, providerName: p.name })}
              />
            ))}
          </FilterDropdown>

          {/* Genre */}
          <FilterDropdown label="🎭" value={filters.genre ? filters.genre.charAt(0).toUpperCase() + filters.genre.slice(1) : "Any"} active={!!filters.genre}>
            <DropdownItem label="Any genre" selected={!filters.genre} onClick={() => update({ genre: undefined })} />
            {GENRES.map(g => (
              <DropdownItem
                key={g}
                label={g}
                selected={filters.genre === g.toLowerCase()}
                onClick={() => update({ genre: g.toLowerCase() })}
              />
            ))}
          </FilterDropdown>

          {/* Decade */}
          <FilterDropdown label="📅" value={filters.decade ? `${filters.decade}s` : "Any"} active={!!filters.decade}>
            <DropdownItem label="Any decade" selected={!filters.decade} onClick={() => update({ decade: undefined })} />
            {DECADES.map(d => (
              <DropdownItem
                key={d}
                label={`${d}s`}
                selected={filters.decade === d}
                onClick={() => update({ decade: d })}
              />
            ))}
          </FilterDropdown>

          {/* Rating */}
          <FilterDropdown label="⭐" value={filters.minRating ? `${filters.minRating}+` : "Any"} active={!!filters.minRating}>
            {RATINGS.map(r => (
              <DropdownItem
                key={r.value}
                label={r.label}
                selected={(filters.minRating || 0) === r.value}
                onClick={() => update({ minRating: r.value || undefined })}
              />
            ))}
          </FilterDropdown>

          {/* Runtime */}
          <FilterDropdown label="⏱" value={filters.maxRuntime ? `<${filters.maxRuntime}m` : "Any"} active={!!filters.maxRuntime}>
            <DropdownItem label="Any length" selected={!filters.maxRuntime} onClick={() => update({ maxRuntime: undefined })} />
            <DropdownItem label="< 90 min" selected={filters.maxRuntime === 90} onClick={() => update({ maxRuntime: 90 })} />
            <DropdownItem label="< 2 hrs" selected={filters.maxRuntime === 120} onClick={() => update({ maxRuntime: 120 })} />
            <DropdownItem label="< 2.5 hrs" selected={filters.maxRuntime === 150} onClick={() => update({ maxRuntime: 150 })} />
          </FilterDropdown>

          {/* Apply */}
          {hasAny && (
            <button
              onClick={onClear}
              className="text-xs text-gray-500 hover:text-gray-300 ml-auto transition-colors"
            >
              Clear all
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
