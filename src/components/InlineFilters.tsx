"use client";

import { useState, useRef, useEffect } from "react";

interface InlineFiltersProps {
  filters: {
    genre?: string; decade?: string; minRating?: number; maxRuntime?: number;
    providerId?: number; providerName?: string; region?: string;
    personId?: number; personName?: string;
    language?: string; languageName?: string;
  };
  onChange: (filters: InlineFiltersProps["filters"]) => void;
  onClear: () => void;
  isPremium?: boolean;
  onUpgrade?: () => void;
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

const LANGUAGES = [
  { code: "en", name: "English", flag: "🇬🇧" },
  { code: "fr", name: "French", flag: "🇫🇷" },
  { code: "es", name: "Spanish", flag: "🇪🇸" },
  { code: "ko", name: "Korean", flag: "🇰🇷" },
  { code: "ja", name: "Japanese", flag: "🇯🇵" },
  { code: "hi", name: "Hindi", flag: "🇮🇳" },
  { code: "de", name: "German", flag: "🇩🇪" },
  { code: "it", name: "Italian", flag: "🇮🇹" },
  { code: "pt", name: "Portuguese", flag: "🇧🇷" },
  { code: "zh", name: "Chinese", flag: "🇨🇳" },
  { code: "th", name: "Thai", flag: "🇹🇭" },
  { code: "tr", name: "Turkish", flag: "🇹🇷" },
  { code: "ar", name: "Arabic", flag: "🇸🇦" },
  { code: "he", name: "Hebrew", flag: "🇮🇱" },
  { code: "sv", name: "Swedish", flag: "🇸🇪" },
  { code: "da", name: "Danish", flag: "🇩🇰" },
  { code: "nl", name: "Dutch", flag: "🇳🇱" },
  { code: "ru", name: "Russian", flag: "🇷🇺" },
  { code: "pl", name: "Polish", flag: "🇵🇱" },
  { code: "tl", name: "Filipino", flag: "🇵🇭" },
];

const DECADES = ["2020", "2010", "2000", "1990", "1980", "1970"];
const RATINGS = [
  { label: "Any", value: 0 },
  { label: "6+", value: 6 },
  { label: "7+", value: 7 },
  { label: "8+", value: 8 },
];

const COUNTRY_FLAGS: Record<string, string> = {
  US: "🇺🇸", CA: "🇨🇦", GB: "🇬🇧", AU: "🇦🇺", FR: "🇫🇷", DE: "🇩🇪",
  IN: "🇮🇳", BR: "🇧🇷", MX: "🇲🇽", JP: "🇯🇵", KR: "🇰🇷", IL: "🇮🇱",
  ES: "🇪🇸", IT: "🇮🇹", NL: "🇳🇱", SE: "🇸🇪", NO: "🇳🇴", DK: "🇩🇰",
};

const COUNTRY_NAMES: Record<string, string> = {
  US: "United States", CA: "Canada", GB: "United Kingdom", AU: "Australia",
  FR: "France", DE: "Germany", IN: "India", BR: "Brazil", MX: "Mexico",
  JP: "Japan", KR: "South Korea", IL: "Israel", ES: "Spain", IT: "Italy",
  NL: "Netherlands", SE: "Sweden", NO: "Norway", DK: "Denmark",
};

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

interface PersonResult {
  id: number;
  name: string;
  known_for_department: string;
  profile_path: string | null;
}

function PersonSearch({ value, onSelect, onClear }: {
  value?: string;
  onSelect: (person: PersonResult) => void;
  onClear: () => void;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<PersonResult[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const search = (q: string) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (q.trim().length < 2) { setResults([]); setOpen(false); return; }
    timerRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/people/search?q=${encodeURIComponent(q)}`);
        const data = await res.json();
        setResults(data);
        setOpen(data.length > 0);
      } catch {
        setResults([]);
      }
      setLoading(false);
    }, 300);
  };

  if (value) {
    return (
      <div className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-medium bg-purple-600/30 border border-purple-500/50 text-purple-200 whitespace-nowrap">
        <span className="text-gray-500">🎬</span>
        <span className="text-white font-semibold">{value}</span>
        <button
          onClick={onClear}
          className="ml-1 text-purple-300 hover:text-white"
          aria-label="Clear person filter"
        >
          ×
        </button>
      </div>
    );
  }

  return (
    <div className="relative" ref={ref}>
      <div className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-medium transition-all bg-gray-800/60 border border-gray-700/50 ${open ? "border-gray-600" : ""}`}>
        <span className="text-gray-500">🎬</span>
        <input
          type="text"
          value={query}
          onChange={e => { setQuery(e.target.value); search(e.target.value); }}
          placeholder="Actor / Director"
          className="bg-transparent outline-none text-gray-300 placeholder-gray-600 w-28 text-xs"
        />
        {loading && <span className="text-gray-600 text-xs">...</span>}
      </div>
      {open && (
        <div className="absolute left-0 top-full mt-1 bg-gray-900 border border-gray-700/60 rounded-xl shadow-2xl z-[200] min-w-[180px]">
          {results.map(p => (
            <button
              key={p.id}
              onClick={() => { onSelect(p); setQuery(""); setOpen(false); }}
              className="w-full text-left px-3 py-2 text-xs text-gray-300 hover:bg-gray-800 transition-colors flex items-center gap-2"
            >
              <span className="text-gray-500">{p.known_for_department === "Directing" ? "🎬" : "🎭"}</span>
              <span>{p.name}</span>
              <span className="text-gray-600 text-xs ml-auto">{p.known_for_department}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function InlineFilters({ filters, onChange, onClear, isPremium = true, onUpgrade }: InlineFiltersProps) {
  const [detectedCountry, setDetectedCountry] = useState<string>("US");

  useEffect(() => {
    fetch("/api/geo")
      .then(r => r.json())
      .then(d => { if (d.country) setDetectedCountry(d.country); })
      .catch(() => {});
  }, []);

  const update = (patch: Partial<InlineFiltersProps["filters"]>) => {
    onChange({ ...filters, ...patch });
  };

  const currentRegion = filters.region || detectedCountry;

  const hasAny = !!(filters.providerId || filters.genre || filters.decade || filters.minRating || filters.maxRuntime || filters.personId);

  return (
    <div className="max-w-6xl mx-auto px-4 mb-4">
      <div className="bg-gray-800/30 border border-gray-700/30 rounded-2xl px-4 py-3">
        <div className="flex flex-wrap items-center gap-2">
          {/* Country chip — always visible */}
          <div className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs bg-gray-800/60 border border-gray-700/30 text-gray-500 whitespace-nowrap" title={COUNTRY_NAMES[currentRegion] || currentRegion}>
            <span>{COUNTRY_FLAGS[currentRegion] || "🌍"}</span>
            <span>{currentRegion}</span>
          </div>

          {/* Platform */}
          <FilterDropdown label="📺 " value={filters.providerName || "Any"} active={!!filters.providerId}>
            <DropdownItem label="Any platform" selected={!filters.providerId} onClick={() => update({ providerId: undefined, providerName: undefined })} />
            {PLATFORMS.map(p => (
              <DropdownItem
                key={p.id}
                label={p.name}
                icon={p.logo}
                selected={filters.providerId === p.id}
                onClick={() => update({ providerId: p.id, providerName: p.name, region: currentRegion })}
              />
            ))}
          </FilterDropdown>

          {/* Genre */}
          <FilterDropdown label="🎭 " value={filters.genre ? filters.genre.charAt(0).toUpperCase() + filters.genre.slice(1) : "Any"} active={!!filters.genre}>
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
          <FilterDropdown label="📅 " value={filters.decade ? `${filters.decade}s` : "Any"} active={!!filters.decade}>
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
          <FilterDropdown label="⭐ " value={filters.minRating ? `${filters.minRating}+` : "Any"} active={!!filters.minRating}>
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
          <FilterDropdown label="⏱ " value={filters.maxRuntime ? `<${filters.maxRuntime}m` : "Any"} active={!!filters.maxRuntime}>
            <DropdownItem label="Any length" selected={!filters.maxRuntime} onClick={() => update({ maxRuntime: undefined })} />
            <DropdownItem label="< 90 min" selected={filters.maxRuntime === 90} onClick={() => update({ maxRuntime: 90 })} />
            <DropdownItem label="< 2 hrs" selected={filters.maxRuntime === 120} onClick={() => update({ maxRuntime: 120 })} />
            <DropdownItem label="< 2.5 hrs" selected={filters.maxRuntime === 150} onClick={() => update({ maxRuntime: 150 })} />
          </FilterDropdown>

          {/* Language — premium only */}
          {isPremium ? (
            <FilterDropdown label="🌍 " value={filters.languageName || "Any"} active={!!filters.language}>
              <DropdownItem label="Any language" selected={!filters.language} onClick={() => update({ language: undefined, languageName: undefined })} />
              {LANGUAGES.map(l => (
                <DropdownItem key={l.code} label={`${l.flag} ${l.name}`} selected={filters.language === l.code} onClick={() => update({ language: l.code, languageName: l.name })} />
              ))}
            </FilterDropdown>
          ) : (
            <button
              onClick={onUpgrade}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-medium bg-gray-800/60 border border-gray-700/50 text-gray-600 hover:text-gray-400 whitespace-nowrap transition-all"
              title="Upgrade to Premium"
            >
              <span>🌍</span>
              <span>Language</span>
              <span className="text-yellow-600 text-xs">⭐</span>
            </button>
          )}

          {/* Actor / Director — premium only */}
          {isPremium ? (
            <PersonSearch
              value={filters.personName}
              onSelect={p => update({ personId: p.id, personName: p.name })}
              onClear={() => update({ personId: undefined, personName: undefined })}
            />
          ) : (
            <button
              onClick={onUpgrade}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-medium bg-gray-800/60 border border-gray-700/50 text-gray-600 hover:text-gray-400 whitespace-nowrap transition-all"
              title="Upgrade to Premium"
            >
              <span>🎬</span>
              <span>Actor / Director</span>
              <span className="text-yellow-600 text-xs">⭐</span>
            </button>
          )}

          {/* Clear all */}
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
