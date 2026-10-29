"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useSession, signIn, signOut } from "next-auth/react";
import MemberSelector from "@/components/MemberSelector";
import SiteFooter from "@/components/SiteFooter";
import InlineFilters from "@/components/InlineFilters";

interface WatchProvider {
  provider_id: number;
  provider_name: string;
  logo_path: string;
}

interface Movie {
  id: number;
  title: string;
  poster_path: string | null;
  vote_average: number;
  overview?: string;
  release_date?: string;
  certification?: string;
  genre_ids?: number[];
  reason?: string;
  providers?: {
    flatrate?: WatchProvider[];
    rent?: WatchProvider[];
    buy?: WatchProvider[];
    link?: string;
  };
}

interface Member {
  id: number;
  name: string;
  avatar: string;
  age?: number | null;
  max_rating?: string | null;
  preferred_providers?: string | null;
}

const TMDB_IMG = "https://image.tmdb.org/t/p";
const MAX_PICKS = 5;
const MIN_PICKS = 3;
const PREFERRED_PROVIDERS_KEY = "nextmovie_preferred_providers_v1";

// TMDB watch-provider IDs — stable across regions. Lets a user say "I have
// these" once so results rank what's actually watchable tonight first.
const STREAMING_PLATFORMS: { id: number; name: string; logo: string }[] = [
  { id: 8, name: "Netflix", logo: "🔴" },
  { id: 337, name: "Disney+", logo: "🔵" },
  { id: 9, name: "Prime Video", logo: "🟡" },
  { id: 350, name: "Apple TV+", logo: "⚫" },
  { id: 1899, name: "Max", logo: "🟣" },
  { id: 15, name: "Hulu", logo: "🟢" },
  { id: 230, name: "Crave", logo: "🟤" },
];

function sortForDisplay(movies: Movie[], preferredProviderIds: number[]): Movie[] {
  const byRating = [...movies].sort((a, b) => (b.vote_average || 0) - (a.vote_average || 0));
  if (preferredProviderIds.length === 0) return byRating;
  const preferredSet = new Set(preferredProviderIds);
  const isWatchableNow = (m: Movie) => (m.providers?.flatrate || []).some((p) => preferredSet.has(p.provider_id));
  const available = byRating.filter(isWatchableNow);
  const rest = byRating.filter((m) => !isWatchableNow(m));
  return [...available, ...rest];
}

const GENRE_MAP: Record<string, string> = {
  "28": "Action", "35": "Comedy", "18": "Drama", "27": "Horror",
  "878": "Sci-Fi", "10749": "Romance", "53": "Thriller", "16": "Animation",
  "14": "Fantasy", "99": "Documentary", "9648": "Mystery", "12": "Adventure",
};

const TV_GENRE_MAP: Record<string, string> = {
  "10759": "Action & Adventure", "35": "Comedy", "18": "Drama", "80": "Crime",
  "10765": "Sci-Fi & Fantasy", "9648": "Mystery", "16": "Animation",
  "10751": "Family", "99": "Documentary", "10764": "Reality",
};

function genreMapFor(contentType: "movie" | "show"): Record<string, string> {
  return contentType === "show" ? TV_GENRE_MAP : GENRE_MAP;
}

function genreLabel(category: string, contentType: "movie" | "show" = "movie"): string {
  if (category === "for-you" || category === "all") return "All Genres";
  return genreMapFor(contentType)[category] || category;
}

function posterUrl(path: string | null, size = "w342") {
  if (!path) return "";
  return `${TMDB_IMG}/${size}${path}`;
}

const DECADE_FILTERS: { value: string; label: string }[] = [
  { value: "2020", label: "2020s+" },
  { value: "2010", label: "2010s+" },
  { value: "2000", label: "2000s+" },
  { value: "1990", label: "1990s+" },
];

function passesDecade(movie: Movie, minDecade: string | null): boolean {
  if (!minDecade) return true;
  const year = movie.release_date ? parseInt(movie.release_date.slice(0, 4)) : 0;
  return year >= Number(minDecade);
}

function sortByRating(movies: Movie[]): Movie[] {
  return [...movies].sort((a, b) => (b.vote_average || 0) - (a.vote_average || 0));
}

// TMDB lists near-duplicate entries per service ("Netflix" vs "Netflix
// Standard with Ads", "Amazon Prime Video" vs "...with Ads") as distinct
// provider ids. Collapse those down to one logo per real service.
function dedupeProviders(providers: WatchProvider[]): WatchProvider[] {
  const seen = new Set<string>();
  const out: WatchProvider[] = [];
  for (const p of providers) {
    const key = p.provider_name
      .replace(/\s*(standard|basic|premium)?\s*with ads\b/i, "")
      .replace(/\s*\(.*?\)\s*/g, "")
      .trim()
      .toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(p);
  }
  return out;
}

const PENDING_GENRE_KEY = "nextmovie_pending_genre";

function consumePendingGenre(): { genreId: string; type: "movie" | "show" } | null {
  try {
    const raw = sessionStorage.getItem(PENDING_GENRE_KEY);
    if (!raw) return null;
    sessionStorage.removeItem(PENDING_GENRE_KEY);
    const parsed = JSON.parse(raw);
    if (!parsed?.genreId || !/^\d+$/.test(parsed.genreId)) return null;
    return { genreId: parsed.genreId, type: parsed.type === "show" ? "show" : "movie" };
  } catch {
    return null;
  }
}

export default function ClientPage() {
  const { data: session, status } = useSession();

  const [members, setMembers] = useState<Member[]>([]);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [guestMode, setGuestMode] = useState(false);
  const isLoggedIn = status === "authenticated" || guestMode;

  const [step, setStep] = useState<"select-member" | "saved-genres" | "pick" | "loading" | "results">("select-member");
  const [contentType, setContentType] = useState<"movie" | "show">("movie");
  const apiBase = contentType === "show" ? "/api/shows" : "/api/movies";
  const [guestMaxRating, setGuestMaxRating] = useState<string | null>("PG"); // safe default until the guest actively confirms
  const [guestRatingTouched, setGuestRatingTouched] = useState(false);
  const [preferredProviders, setPreferredProviders] = useState<number[]>([]);
  const [showProvidersPanel, setShowProvidersPanel] = useState(false);
  const [discoverFilters, setDiscoverFilters] = useState<{
    providerId?: number; providerName?: string; region?: string;
    language?: string; languageName?: string;
    minRating?: number; maxRuntime?: number;
  }>({});
  const [showFilterBar, setShowFilterBar] = useState(false);
  const [showPlatformSignInPrompt, setShowPlatformSignInPrompt] = useState(false);
  const [gridMovies, setGridMovies] = useState<Movie[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [selectedRatings, setSelectedRatings] = useState<Record<number, number>>({});
  // Picks for the OTHER content type, stashed on toggle so switching
  // Movies <-> Shows restores each type's picks instead of wiping them.
  const [picksStash, setPicksStash] = useState<Record<"movie" | "show", Array<{ movie: Movie; rating: number }>>>({ movie: [], show: [] });
  const [recommendations, setRecommendations] = useState<Movie[]>([]);
  const [recBuffer, setRecBuffer] = useState<Movie[]>([]);
  const [lastSwipe, setLastSwipe] = useState<{ movie: Movie; direction: "left" | "right"; replacement: Movie | null } | null>(null);
  const [loadingGrid, setLoadingGrid] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [gridPage, setGridPage] = useState(1);
  const [showMoreCount, setShowMoreCount] = useState(0);
  // True once a "Show More" fetch has come back with nothing new for the
  // current genre/type — the real signal, not a fixed decrementing count.
  const [gridExhausted, setGridExhausted] = useState(false);
  const [activeGenre, setActiveGenre] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>("for-you");
  const [savedCategories, setSavedCategories] = useState<{ category: string; content_type: "movie" | "show"; count: number }[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [swipingId, setSwipingId] = useState<number | null>(null);
  const [fetchingMore, setFetchingMore] = useState(false);
  const [likedStreak, setLikedStreak] = useState<string[]>([]);
  const [refining, setRefining] = useState(false);
  const [minDecade, setMinDecade] = useState<string | null>(null);
  // Which decade value we've already confirmed has nothing left to fetch —
  // cleared whenever the era changes or a fresh results set starts.
  const [eraExhausted, setEraExhausted] = useState<string | null>(null);
  const seedTitlesRef = useRef<string[]>([]);
  const shownIdsRef = useRef<Set<number>>(new Set());
  const guestLikedTitlesRef = useRef<string[]>([]);
  const hasRestoredGuestRef = useRef(false);

  // Every movie/show object the user has seen this pick session (browse grid,
  // search results, a person's filmography) — handleGetRecommendations reads
  // from this instead of just gridMovies, so a selection made while searching
  // still resolves correctly after switching back to Browse.
  const seenMoviesRef = useRef<Map<number, Movie>>(new Map());
  const rememberMovies = (movies: Movie[]) => {
    for (const m of movies) seenMoviesRef.current.set(m.id, m);
  };

  // ── Search, people, and mood ──
  const [isPremium, setIsPremium] = useState(false);
  const [searchMode, setSearchMode] = useState<"browse" | "search" | "person">("browse");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Movie[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [personResults, setPersonResults] = useState<{ id: number; name: string; known_for_department: string; profile_path: string | null }[]>([]);
  const [activePerson, setActivePerson] = useState<{ id: number; name: string } | null>(null);
  const [personMovies, setPersonMovies] = useState<Movie[]>([]);
  const [personLoading, setPersonLoading] = useState(false);
  const [showMoodPanel, setShowMoodPanel] = useState(false);
  const [moodText, setMoodText] = useState("");
  const [moodLoading, setMoodLoading] = useState(false);
  const [activeMood, setActiveMood] = useState<string | null>(null);
  const [upsellFeature, setUpsellFeature] = useState<string | null>(null);

  // Guests have no DB-backed session — persist to localStorage so a refresh
  // or accidental tab close doesn't wipe out picks/results. Signed-in users
  // already get this for free via /api/session.
  const GUEST_STORAGE_KEY = "nextmovie_guest_session_v1";
  const GUEST_STORAGE_MAX_AGE_MS = 24 * 60 * 60 * 1000;

  function readGuestSnapshot(): Record<string, unknown> | null {
    try {
      const raw = localStorage.getItem(GUEST_STORAGE_KEY);
      if (!raw) return null;
      const snap = JSON.parse(raw);
      if (!snap || Date.now() - (snap.savedAt || 0) > GUEST_STORAGE_MAX_AGE_MS) {
        localStorage.removeItem(GUEST_STORAGE_KEY);
        return null;
      }
      if (snap.step !== "pick" && snap.step !== "results") return null;
      return snap;
    } catch {
      return null;
    }
  }

  // Computed once, synchronously, before the first paint — so a returning
  // guest with valid saved state never sees the sign-in gate flash while
  // next-auth's useSession() is still resolving `status`. Only a genuine
  // first-time visitor (no valid snapshot) falls through to the gate.
  const [hasPendingGuestRestore] = useState(() => typeof window !== "undefined" && readGuestSnapshot() !== null);
  // Escape hatch: once the restore attempt has actually run (success or
  // not), stop treating the visit as "pending" — otherwise an edge case
  // where the snapshot fails its second read would strand the user on an
  // unbuttoned loading screen forever.
  const [guestRestoreAttempted, setGuestRestoreAttempted] = useState(false);

  // Safety net: if next-auth's session check hangs for any reason, don't
  // strand a returning guest on an unbuttoned screen forever.
  useEffect(() => {
    if (!hasPendingGuestRestore) return;
    const t = setTimeout(() => setGuestRestoreAttempted(true), 2500);
    return () => clearTimeout(t);
  }, [hasPendingGuestRestore]);

  useEffect(() => {
    if (hasRestoredGuestRef.current) return;
    if (status === "loading" || status === "authenticated") return;
    hasRestoredGuestRef.current = true;
    setGuestRestoreAttempted(true);
    const snap = readGuestSnapshot();
    if (!snap) return;
    setGuestMode(true);
    setGuestMaxRating((snap.guestMaxRating as string) ?? "PG");
    setGuestRatingTouched(Boolean(snap.guestRatingTouched));
    setContentType(snap.contentType === "show" ? "show" : "movie");
    setActiveGenre((snap.activeGenre as string) ?? null);
    setActiveCategory((snap.activeCategory as string) || "for-you");
    setMinDecade((snap.minDecade as string) ?? null);
    setSelectedIds(new Set(Array.isArray(snap.selectedIds) ? (snap.selectedIds as number[]) : []));
    setSelectedRatings((snap.selectedRatings as Record<number, number>) || {});
    const restoredGrid = Array.isArray(snap.gridMovies) ? (snap.gridMovies as Movie[]) : [];
    const restoredRecs = Array.isArray(snap.recommendations) ? (snap.recommendations as Movie[]) : [];
    const restoredBuffer = Array.isArray(snap.recBuffer) ? (snap.recBuffer as Movie[]) : [];
    setGridMovies(restoredGrid);
    setRecommendations(restoredRecs);
    setRecBuffer(restoredBuffer);
    // Every title the restored state references must also exist in
    // seenMoviesRef, or resolving picks later (handleGetRecommendations,
    // toggling content type) would silently drop them.
    rememberMovies([...restoredGrid, ...restoredRecs, ...restoredBuffer]);
    const restoredStash = (snap.picksStash as Record<"movie" | "show", Array<{ movie: Movie; rating: number }>>) || { movie: [], show: [] };
    setPicksStash(restoredStash);
    rememberMovies([...(restoredStash.movie || []), ...(restoredStash.show || [])].map((p) => p.movie));
    seedTitlesRef.current = Array.isArray(snap.seedTitles) ? (snap.seedTitles as string[]) : [];
    shownIdsRef.current = new Set(Array.isArray(snap.shownIds) ? (snap.shownIds as number[]) : []);
    guestLikedTitlesRef.current = Array.isArray(snap.guestLikedTitles) ? (snap.guestLikedTitles as string[]) : [];
    setStep(snap.step as "pick" | "results");
  }, [status]);

  // Preferred streaming services — a durable per-device preference, set once
  // and reused for every future results page regardless of sign-in state.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(PREFERRED_PROVIDERS_KEY);
      if (!raw) return;
      const ids = JSON.parse(raw);
      if (Array.isArray(ids)) setPreferredProviders(ids.filter((n) => typeof n === "number"));
    } catch {}
  }, []);

  const handleSavePreferredProviders = (ids: number[]) => {
    setPreferredProviders(ids);
    setShowProvidersPanel(false);
    try { localStorage.setItem(PREFERRED_PROVIDERS_KEY, JSON.stringify(ids)); } catch {}
    if (selectedMember) {
      fetch("/api/members", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ memberId: selectedMember.id, preferredProviders: ids }),
      }).catch(() => {});
    }
  };

  useEffect(() => {
    if (!guestMode) return;
    if (step !== "pick" && step !== "results") return;
    try {
      localStorage.setItem(GUEST_STORAGE_KEY, JSON.stringify({
        guestMaxRating,
        guestRatingTouched,
        contentType,
        step,
        activeGenre,
        activeCategory,
        minDecade,
        selectedIds: Array.from(selectedIds),
        selectedRatings,
        picksStash,
        gridMovies,
        recommendations,
        recBuffer,
        seedTitles: seedTitlesRef.current,
        shownIds: Array.from(shownIdsRef.current),
        guestLikedTitles: guestLikedTitlesRef.current,
        savedAt: Date.now(),
      }));
    } catch {}
  }, [guestMode, step, guestMaxRating, guestRatingTouched, contentType, activeGenre, activeCategory, minDecade, selectedIds, selectedRatings, picksStash, gridMovies, recommendations, recBuffer]);

  // A real sign-in supersedes any saved guest session — drop it so it can
  // never resurface stale picks after logging out and returning as a guest.
  useEffect(() => {
    if (status === "authenticated") {
      try { localStorage.removeItem(GUEST_STORAGE_KEY); } catch {}
    }
  }, [status]);

  useEffect(() => {
    if (status !== "authenticated" && !guestMode) return;
    fetch("/api/members").then((r) => r.json()).then(setMembers).catch(() => {});
    fetch("/api/premium").then((r) => r.json()).then((d) => setIsPremium(Boolean(d?.isPremium))).catch(() => {});
  }, [status, guestMode]);

  // Capture a ?genre=<id>[&type=show] link (from /genres' "Browse X" cards)
  // into sessionStorage so it survives both the guest flow and a full
  // page navigation through Google sign-in, then clean the URL.
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const genre = params.get("genre");
      if (genre && /^\d+$/.test(genre)) {
        sessionStorage.setItem(PENDING_GENRE_KEY, JSON.stringify({
          genreId: genre,
          type: params.get("type") === "show" ? "show" : "movie",
        }));
        window.history.replaceState({}, "", window.location.pathname);
      }
    } catch {}
  }, []);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [step]);

  const loadGrid = async (page = 1, append = false, genreId?: string | null, typeOverride?: "movie" | "show", maxRatingOverride?: string | null) => {
    if (page === 1) {
      setLoadingGrid(true);
      setGridExhausted(false);
    } else {
      setLoadingMore(true);
    }
    try {
      const base = (typeOverride || contentType) === "show" ? "/api/shows" : "/api/movies";
      const effectiveMaxRating = maxRatingOverride !== undefined ? maxRatingOverride : (selectedMember?.max_rating || guestMaxRating);
      const params = new URLSearchParams({ page: String(page) });
      if (genreId) params.set("genre", genreId);
      if (effectiveMaxRating && effectiveMaxRating !== "ALL") params.set("maxRating", effectiveMaxRating);
      const res = await fetch(`${base}/popular-grid?${params}`);
      const data = await res.json();
      const newMovies: Movie[] = data.movies || [];
      rememberMovies(newMovies);
      if (append) {
        const existingIds = new Set(gridMovies.map((m: Movie) => m.id));
        const unique = newMovies.filter((m: Movie) => !existingIds.has(m.id));
        setGridExhausted(unique.length === 0);
        setGridMovies((prev: Movie[]) => {
          const prevIds = new Set(prev.map((m: Movie) => m.id));
          return [...prev, ...newMovies.filter((m: Movie) => !prevIds.has(m.id))];
        });
      } else {
        setGridMovies(newMovies);
      }
      setGridPage(page);
    } catch {
      setError("Couldn't load movies. Please try again.");
    }
    setLoadingGrid(false);
    setLoadingMore(false);
  };

  // Defensive ceiling only — never shown to the user as a countdown. Real
  // exhaustion is driven by gridExhausted (the API actually running dry).
  const MAX_SHOW_MORE_PAGES = 20;

  const handleShowMore = () => {
    if (showMoreCount >= MAX_SHOW_MORE_PAGES || gridExhausted || loadingMore) return;
    setShowMoreCount((c: number) => c + 1);
    loadGrid(gridPage + 1, true, activeGenre);
  };

  const handleGenreChange = (genreId: string | null) => {
    setActiveGenre(genreId);
    setGridPage(1);
    setShowMoreCount(0);
    loadGrid(1, false, genreId);
  };

  const handleContentTypeChange = (type: "movie" | "show") => {
    if (type === contentType) return;

    // Stash the type we're leaving as full Movie objects (not just ids) so
    // restoring them later can't be corrupted by a same-numeric-id title of
    // the other content type overwriting seenMoviesRef while we're away.
    const outgoingPicks = Array.from(selectedIds)
      .map((id) => seenMoviesRef.current.get(id))
      .filter((m): m is Movie => Boolean(m))
      .map((m) => ({ movie: m, rating: selectedRatings[m.id] || 5 }));
    setPicksStash((prev) => ({ ...prev, [contentType]: outgoingPicks }));

    const incomingPicks = picksStash[type] || [];
    rememberMovies(incomingPicks.map((p) => p.movie));

    setContentType(type);
    setActiveGenre(null);
    setGridPage(1);
    setShowMoreCount(0);
    setSelectedIds(new Set(incomingPicks.map((p) => p.movie.id)));
    setSelectedRatings(Object.fromEntries(incomingPicks.map((p) => [p.movie.id, p.rating])));
    setSearchMode("browse");
    setSearchQuery("");
    setSearchResults([]);
    setPersonResults([]);
    setActivePerson(null);
    setPersonMovies([]);
    loadGrid(1, false, null, type);
  };

  // Tracks the most recently typed query so a slow response for an older
  // query can never overwrite the results of a newer one that's since
  // superseded it (the debounce below cancels pending timers, but an
  // already-in-flight fetch can still resolve out of order).
  const latestSearchQueryRef = useRef("");

  const runSearch = useCallback(async (query: string) => {
    if (query.trim().length < 2) {
      setSearchResults([]);
      setPersonResults([]);
      setSearchLoading(false);
      return;
    }
    try {
      const effectiveMaxRating = selectedMember?.max_rating || guestMaxRating;
      const params = new URLSearchParams({ q: query });
      if (effectiveMaxRating && effectiveMaxRating !== "ALL") params.set("maxRating", effectiveMaxRating);
      const [titleRes, personRes] = await Promise.all([
        fetch(`${apiBase}/search?${params}`),
        contentType === "movie" ? fetch(`/api/people/search?q=${encodeURIComponent(query)}`) : Promise.resolve(null),
      ]);
      const titles: Movie[] = await titleRes.json();
      if (query !== latestSearchQueryRef.current) return; // superseded — discard
      rememberMovies(titles);
      setSearchResults(titles);
      if (personRes) {
        const people = await personRes.json();
        if (query !== latestSearchQueryRef.current) return;
        setPersonResults(Array.isArray(people) ? people : []);
      } else {
        setPersonResults([]);
      }
    } catch {
      if (query === latestSearchQueryRef.current) {
        setSearchResults([]);
        setPersonResults([]);
      }
    }
    if (query === latestSearchQueryRef.current) setSearchLoading(false);
  }, [apiBase, contentType, selectedMember, guestMaxRating]);

  useEffect(() => {
    if (searchMode !== "search") return;
    latestSearchQueryRef.current = searchQuery;
    // Loading state starts the instant the query changes, not after the
    // debounce — otherwise stale results (or a false empty state) show
    // for the whole 350ms gap before the new fetch even begins.
    setSearchLoading(true);
    const handle = setTimeout(() => runSearch(searchQuery), 350);
    return () => clearTimeout(handle);
  }, [searchQuery, searchMode, runSearch]);

  const handleSelectPerson = async (person: { id: number; name: string }) => {
    if (!isPremium) {
      setUpsellFeature(`Search by actor or director — see every ${person.name} title in one place`);
      return;
    }
    setActivePerson(person);
    setSearchMode("person");
    setPersonLoading(true);
    try {
      const params = new URLSearchParams({ personId: String(person.id) });
      if (selectedMember?.id) params.set("memberId", String(selectedMember.id));
      const res = await fetch(`/api/movies/person?${params}`);
      if (res.status === 403) {
        setUpsellFeature(`Search by actor or director — see every ${person.name} title in one place`);
        setSearchMode("search");
        setPersonLoading(false);
        return;
      }
      const movies: Movie[] = await res.json();
      rememberMovies(movies);
      setPersonMovies(movies);
    } catch {
      setPersonMovies([]);
    }
    setPersonLoading(false);
  };

  const handleBackToDiscovery = () => {
    setSearchMode("browse");
    setSearchQuery("");
    setSearchResults([]);
    setPersonResults([]);
    setActivePerson(null);
    setPersonMovies([]);
  };

  const MOOD_PRESETS: { display: string; value: string }[] = [
    { display: "Make me laugh 😂", value: "Make me laugh" },
    { display: "Scare me 😱", value: "Scare me" },
    { display: "Make me cry 😭", value: "Make me cry" },
    { display: "Date night 💕", value: "Date night" },
    { display: "Mind-bending 🤯", value: "Mind-bending" },
    { display: "Feel-good ☀️", value: "Feel-good" },
    { display: "Edge of my seat 😬", value: "Edge of my seat" },
    { display: "Cozy & comforting 🛋️", value: "Cozy & comforting" },
    { display: "Something epic 🗡️", value: "Something epic" },
    { display: "Nostalgic 📼", value: "Nostalgic" },
    { display: "Weird & different 🌀", value: "Weird & different" },
    { display: "Inspiring 💪", value: "Inspiring" },
  ];

  const handleMoodSubmit = async (mood: string) => {
    if (!mood.trim()) return;
    if (guestMode && !selectedMember && !guestRatingTouched) {
      setShowMoodPanel(false);
      setError("Pick who's watching above before we show you results.");
      return;
    }
    setMoodLoading(true);
    setError(null);
    setShowMoodPanel(false);
    setStep("loading");
    setActiveMood(mood);
    setActiveCategory("mood");
    setLikedStreak([]);
    setMinDecade(null);
    setEraExhausted(null);
    try {
      const res = await fetch("/api/movies/mood", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          memberId: selectedMember?.id,
          mood,
          category: "mood",
          contentType,
          guestMaxRating,
        }),
      });
      const data = await res.json();
      const all = sortByRating(data.movies || []);
      shownIdsRef.current = new Set(all.map((m: Movie) => m.id));
      setRecommendations(all.slice(0, 10));
      setRecBuffer(all.slice(10));
      setStep(all.length > 0 ? "results" : "pick");
      if (all.length === 0) setError("Couldn't find anything for that mood — try describing it differently.");
    } catch {
      setError("Something went wrong. Please try again.");
      setStep("pick");
    }
    setMoodLoading(false);
  };

  const hasActiveDiscoverFilter = !!(
    discoverFilters.providerId || discoverFilters.language || discoverFilters.minRating || discoverFilters.maxRuntime
  );

  const handleApplyDiscoverFilters = async () => {
    if (!hasActiveDiscoverFilter) return;
    if (guestMode && !selectedMember && !guestRatingTouched) {
      setError("Pick who's watching above before we show you results.");
      return;
    }
    setError(null);
    setStep("loading");
    setActiveMood(null);
    setActiveCategory("filtered");
    setLikedStreak([]);
    setMinDecade(null);
    setEraExhausted(null);
    try {
      const params = new URLSearchParams();
      if (discoverFilters.providerId) {
        params.set("providerId", String(discoverFilters.providerId));
        if (discoverFilters.providerName) params.set("providerName", discoverFilters.providerName);
        params.set("region", discoverFilters.region || "CA");
      }
      if (discoverFilters.language) {
        params.set("language", discoverFilters.language);
        if (discoverFilters.languageName) params.set("languageName", discoverFilters.languageName);
      }
      if (discoverFilters.minRating) params.set("minRating", String(discoverFilters.minRating));
      if (discoverFilters.maxRuntime) params.set("maxRuntime", String(discoverFilters.maxRuntime));
      if (selectedMember?.id) {
        params.set("memberId", String(selectedMember.id));
      } else if (guestMaxRating) {
        params.set("guestMaxRating", guestMaxRating);
      }

      const res = await fetch(`/api/movies/discover?${params}`);
      if (res.status === 403) {
        setUpsellFeature("Filter by language, rating, or runtime — see exactly the movies you want");
        setStep("pick");
        return;
      }
      const data = await res.json();
      const all = sortByRating(data.movies || []);
      shownIdsRef.current = new Set(all.map((m: Movie) => m.id));
      setRecommendations(all.slice(0, 10));
      setRecBuffer(all.slice(10));
      setStep(all.length > 0 ? "results" : "pick");
      if (all.length === 0) setError("No matches for those filters — try loosening one.");
    } catch {
      setError("Something went wrong. Please try again.");
      setStep("pick");
    }
  };

  const handleSelectMember = async (member: Member) => {
    setSelectedMember(member);
    setSelectedIds(new Set());
    setSelectedRatings({});
    setRecommendations([]);
    setRecBuffer([]);

    if (member.preferred_providers) {
      try {
        const ids = JSON.parse(member.preferred_providers);
        if (Array.isArray(ids) && ids.length > 0) setPreferredProviders(ids.filter((n) => typeof n === "number"));
      } catch {}
    }

    // A genre link (e.g. from /genres) takes priority over "Welcome back" —
    // clicking "Browse Action" is an explicit intent to go straight to it.
    const pending = consumePendingGenre();
    if (pending) {
      setContentType(pending.type);
      setActiveGenre(pending.genreId);
      setStep("pick");
      loadGrid(1, false, pending.genreId, pending.type);
      return;
    }

    try {
      const res = await fetch(`/api/session/categories?memberId=${member.id}`);
      const cats: { category: string; content_type: "movie" | "show"; count: number }[] = await res.json();
      if (Array.isArray(cats) && cats.length > 0) {
        setSavedCategories(cats);
        setStep("saved-genres");
        return;
      }
    } catch {}

    setStep("pick");
    loadGrid();
  };

  const loadSavedGenre = async (category: string, savedType: "movie" | "show" = "movie") => {
    if (!selectedMember) return;
    setContentType(savedType);
    setActiveCategory(category);
    setLikedStreak([]);
    setStep("loading");
    const base = savedType === "show" ? "/api/shows" : "/api/movies";

    try {
      const res = await fetch(`/api/session?memberId=${selectedMember.id}&category=${encodeURIComponent(category)}&contentType=${savedType}`);
      const data = await res.json();
      if (data.activeRecommendations && data.activeRecommendations.length > 0) {
        const saved = data.activeRecommendations.map((r: Record<string, unknown>) => ({
          id: Number(r.tmdb_id),
          title: String(r.title),
          poster_path: r.poster_path ? String(r.poster_path) : null,
          vote_average: Number(r.vote_average || 0),
          certification: r.certification ? String(r.certification) : undefined,
          overview: r.overview ? String(r.overview) : undefined,
          release_date: r.release_date ? String(r.release_date) : undefined,
          reason: r.reason ? String(r.reason) : undefined,
        }));
        setRecommendations(saved);
        setRecBuffer([]);
        setStep("results");
        return;
      }

      // No active recs but user has history — fetch more via TMDB (free)
      const moreRes = await fetch(`${base}/more-like`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ memberId: selectedMember.id, category, minDecade }),
      });
      const moreData = await moreRes.json();
      const fresh: Movie[] = sortByRating(moreData.movies || []);
      if (fresh.length > 0) {
        setRecommendations(fresh.slice(0, 5));
        setRecBuffer(fresh.slice(5));
        setStep("results");
        return;
      }
    } catch {}

    setStep("pick");
    setActiveGenre(category === "for-you" ? null : category);
    loadGrid(1, false, category === "for-you" ? null : category, savedType);
  };

  const handleGuestStart = () => {
    setGuestMode(true);
    setSelectedIds(new Set());
    setSelectedRatings({});
    setRecommendations([]);
    const pending = consumePendingGenre();
    if (pending) {
      setContentType(pending.type);
      setActiveGenre(pending.genreId);
      setStep("pick");
      loadGrid(1, false, pending.genreId, pending.type, guestMaxRating);
    } else {
      setStep("pick");
      loadGrid(1, false, null, undefined, guestMaxRating);
    }
  };

  const GUEST_RATING_TIERS: { value: string; label: string; desc: string; icon: string }[] = [
    { value: "G", label: "Kids", desc: "G-rated only", icon: "🧸" },
    { value: "PG", label: "Whole Family", desc: "G & PG — safe to watch together", icon: "👨‍👩‍👧‍👦" },
    { value: "PG-13", label: "Teens", desc: "Up to PG-13", icon: "🎒" },
    { value: "ALL", label: "Adults", desc: "No restrictions", icon: "🔞" },
  ];

  const handleGuestRatingSelect = (rating: string) => {
    setGuestMaxRating(rating);
    setGuestRatingTouched(true);
    setError(null);
    loadGrid(1, false, activeGenre, undefined, rating);
  };

  const toggleMovie = (id: number) => {
    setSelectedIds((prev: Set<number>) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
        setSelectedRatings((r: Record<number, number>) => {
          const nr = { ...r };
          delete nr[id];
          return nr;
        });
      } else if (next.size < MAX_PICKS) {
        next.add(id);
        setSelectedRatings((r: Record<number, number>) => ({ ...r, [id]: 5 }));
      }
      return next;
    });
  };

  const setMovieRating = (id: number, rating: number) => {
    setSelectedRatings((r: Record<number, number>) => ({ ...r, [id]: rating }));
  };

  const handleGetRecommendations = async () => {
    const picked = Array.from(selectedIds)
      .map((id) => seenMoviesRef.current.get(id))
      .filter((m): m is Movie => Boolean(m));
    const moviePicks = picked.map((m: Movie) => ({ title: m.title, rating: selectedRatings[m.id] || 5 }));
    const titles = picked.map((m: Movie) => m.title);

    if (titles.length < MIN_PICKS) return;
    if (guestMode && !selectedMember && !guestRatingTouched) {
      setError("Pick who's watching above before we show you results.");
      return;
    }

    setStep("loading");
    setError(null);
    setMinDecade(null);
    setEraExhausted(null);

    const category = activeGenre || "for-you";
    setActiveCategory(category);
    setActiveMood(null);
    setLikedStreak([]);
    seedTitlesRef.current = titles;

    try {
      const res = await fetch(`${apiBase}/for-you`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          movieTitles: titles,
          moviePicks,
          memberId: selectedMember?.id,
          category,
          genreName: activeGenre ? genreMapFor(contentType)[activeGenre] : undefined,
          minDecade: null,
          guestMaxRating,
        }),
      });
      const data = await res.json();
      const all = sortByRating(data.movies || []);
      shownIdsRef.current = new Set(all.map((m: Movie) => m.id));
      setRecommendations(all.slice(0, 10));
      setRecBuffer(all.slice(10));
      setStep("results");
    } catch {
      setError("Something went wrong. Please try again.");
      setStep("pick");
    }
  };

  const fetchMoreRecs = useCallback(async (decadeOverride?: string | null) => {
    if (fetchingMore) return;
    const effectiveDecade = decadeOverride !== undefined ? decadeOverride : minDecade;

    if (!activeMood && !selectedMember && seedTitlesRef.current.length === 0 && guestLikedTitlesRef.current.length < 3) return;

    setFetchingMore(true);
    setEraExhausted(null);
    try {
      let fresh: Movie[] = [];

      if (activeMood) {
        // Mood results have no "liked" seed history to query more-like with —
        // re-ask the same mood, now scoped to the era and excluding what's
        // already been shown.
        const res = await fetch("/api/movies/mood", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            memberId: selectedMember?.id,
            mood: activeMood,
            category: activeCategory,
            contentType,
            guestMaxRating,
            minDecade: effectiveDecade,
            excludeIds: Array.from(shownIdsRef.current),
          }),
        });
        const data = await res.json();
        fresh = sortByRating(data.movies || []).filter((m: Movie) => !shownIdsRef.current.has(m.id));
      } else if (selectedMember) {
        const res = await fetch(`${apiBase}/more-like`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            memberId: selectedMember.id,
            category: activeCategory,
            minDecade: effectiveDecade,
          }),
        });
        const data = await res.json();
        fresh = sortByRating(data.movies || []);
      } else {
        // Guests have no saved history for more-like to query — reuse the
        // original picks (+ anything liked this session) as fresh AI seeds
        const combinedSeeds = [...new Set([...seedTitlesRef.current, ...guestLikedTitlesRef.current])];
        const res = await fetch(`${apiBase}/for-you`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            movieTitles: combinedSeeds,
            category: activeCategory,
            genreName: activeGenre ? genreMapFor(contentType)[activeGenre] : undefined,
            minDecade: effectiveDecade,
            guestMaxRating,
          }),
        });
        const data = await res.json();
        fresh = sortByRating(data.movies || []).filter((m: Movie) => !shownIdsRef.current.has(m.id));
      }

      // Honest end-state: we fetched, and nothing new matches this era.
      const existingIds = new Set([...recommendations, ...recBuffer].map((m) => m.id));
      const newMatchingEra = fresh.filter((m) => !existingIds.has(m.id) && passesDecade(m, effectiveDecade));
      if (effectiveDecade && newMatchingEra.length === 0) {
        setEraExhausted(effectiveDecade);
      }

      fresh.forEach((m: Movie) => shownIdsRef.current.add(m.id));

      setRecommendations((prev: Movie[]) => {
        const existingIds = new Set(prev.map((m: Movie) => m.id));
        const newOnes = fresh.filter((m: Movie) => !existingIds.has(m.id));
        return [...prev, ...newOnes.slice(0, 5)];
      });
      setRecBuffer((prev: Movie[]) => {
        const allIds = new Set(prev.map((m: Movie) => m.id));
        const extra = fresh.filter((m: Movie) => !allIds.has(m.id)).slice(5);
        return [...prev, ...extra];
      });
    } catch {}
    setFetchingMore(false);
  }, [selectedMember, activeCategory, activeGenre, activeMood, fetchingMore, minDecade, apiBase, contentType, guestMaxRating, recommendations, recBuffer]);

  const LIKE_STREAK_THRESHOLD = 5;

  const regenerateFromLikes = useCallback(async (titles: string[]) => {
    if (!selectedMember) return;
    setRefining(true);
    try {
      const res = await fetch(`${apiBase}/for-you`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          movieTitles: titles,
          memberId: selectedMember.id,
          category: activeCategory,
          genreName: activeGenre ? genreMapFor(contentType)[activeGenre] : undefined,
          minDecade,
        }),
      });
      const data = await res.json();
      const fresh: Movie[] = sortByRating(data.movies || []);
      if (fresh.length > 0) {
        setRecommendations((currentRecs: Movie[]) => {
          const visibleIds = new Set(currentRecs.map((m: Movie) => m.id));
          setRecBuffer(fresh.filter((m: Movie) => !visibleIds.has(m.id)));
          return currentRecs;
        });
      }
    } catch {}
    setRefining(false);
  }, [selectedMember, activeCategory, activeGenre, minDecade, apiBase, contentType]);

  const handleSwipe = useCallback((movie: Movie, direction: "left" | "right", feedbackType: "disliked" | "less_like_this" | "already_watched" = "disliked") => {
    setSwipingId(movie.id);

    setTimeout(() => {
      setRecommendations((prev: Movie[]) => {
        const idx = prev.findIndex((m: Movie) => m.id === movie.id);
        if (idx === -1) return prev;
        const next = [...prev];
        next.splice(idx, 1);
        return next;
      });

      // The replacement is computed from a direct read of recBuffer (now a
      // dependency) rather than from inside setRecBuffer's updater. Reading
      // it via an outer `let` set as a side effect of that updater raced
      // against React deferring the updater's execution, so lastSwipe.
      // replacement was always null even when a replacement had been
      // added — Undo could never remove it, and the list grew by one every
      // swipe. Calling other setters from inside an updater would "fix"
      // that but makes the updater impure, which breaks under Strict
      // Mode's double-invocation; this avoids both problems.
      if (recBuffer.length === 0) {
        fetchMoreRecs();
        setLastSwipe({ movie, direction, replacement: null });
      } else {
        const passing = recBuffer.filter((m: Movie) => passesDecade(m, minDecade));
        const pool = passing.length > 0 ? passing : recBuffer;
        const replacement = sortByRating(pool)[0];
        setRecBuffer((prev: Movie[]) => prev.filter((m: Movie) => m.id !== replacement.id));
        setRecommendations((recs: Movie[]) => [...recs, replacement]);
        if (recBuffer.length - 1 <= 2) fetchMoreRecs();
        setLastSwipe({ movie, direction, replacement });
      }

      setSwipingId(null);
    }, 300);

    if (selectedMember) {
      if (direction === "right") {
        fetch("/api/movies/watched", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ memberId: selectedMember.id, movie, category: activeCategory, contentType }),
        }).catch(() => {});

        setLikedStreak((prev: string[]) => {
          const next = [...prev, movie.title];
          if (next.length >= LIKE_STREAK_THRESHOLD) {
            regenerateFromLikes(next);
            return [];
          }
          return next;
        });
      } else {
        const isAlreadyWatched = feedbackType === "already_watched";
        fetch("/api/movies/dislike", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            memberId: selectedMember.id,
            movie,
            category: activeCategory,
            contentType,
            feedbackType: isAlreadyWatched ? "disliked" : feedbackType,
            action: isAlreadyWatched ? "already_watched" : "dislike",
          }),
        }).catch(() => {});
      }
    } else if (direction === "right") {
      // Guests have no DB — just remember this for seeding future "Load More" fetches
      guestLikedTitlesRef.current = [...guestLikedTitlesRef.current, movie.title].slice(-10);
    }
  }, [selectedMember, activeCategory, fetchMoreRecs, regenerateFromLikes, minDecade, contentType, recBuffer]);

  const handleLessLikeThis = useCallback((movie: Movie) => {
    handleSwipe(movie, "left", "less_like_this");
  }, [handleSwipe]);

  const handleAlreadyWatched = useCallback((movie: Movie) => {
    handleSwipe(movie, "left", "already_watched");
  }, [handleSwipe]);

  const handleUndo = useCallback(() => {
    if (!lastSwipe) return;
    const { movie, direction, replacement } = lastSwipe;

    setRecommendations((prev: Movie[]) => {
      const withoutReplacement = replacement ? prev.filter((m: Movie) => m.id !== replacement.id) : prev;
      if (withoutReplacement.some((m: Movie) => m.id === movie.id)) return withoutReplacement;
      return [movie, ...withoutReplacement];
    });

    if (replacement) {
      setRecBuffer((prev: Movie[]) => [replacement, ...prev]);
    }

    if (selectedMember) {
      fetch("/api/movies/undo-swipe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ memberId: selectedMember.id, movie, category: activeCategory, contentType, direction }),
      }).catch(() => {});
    } else if (direction === "right") {
      guestLikedTitlesRef.current = guestLikedTitlesRef.current.filter((t: string) => t !== movie.title);
    }

    setLastSwipe(null);
  }, [lastSwipe, selectedMember, activeCategory, contentType]);

  const handleStartOver = () => {
    setSelectedIds(new Set());
    setSelectedRatings({});
    setRecommendations([]);
    setRecBuffer([]);
    setLastSwipe(null);
    setShowMoreCount(0);
    setLikedStreak([]);
    setActiveMood(null);
    setMinDecade(null);
    setEraExhausted(null);
    handleBackToDiscovery();
    seedTitlesRef.current = [];
    shownIdsRef.current = new Set();
    guestLikedTitlesRef.current = [];
    setStep("pick");
    loadGrid(1, false, activeGenre);
  };

  const handleBackToGenres = () => {
    if (selectedMember) {
      handleSelectMember(selectedMember);
    } else {
      handleStartOver();
    }
  };

  const handleDecadeChange = (decade: string | null) => {
    const next = decade === minDecade ? null : decade;
    setMinDecade(next);
    setEraExhausted(null);
    const remaining = recommendations.filter((m: Movie) => passesDecade(m, next));
    if (next && remaining.length < 3) fetchMoreRecs(next);
  };

  const handleAddMember = async (name: string, avatar: string, age: number | null, maxRating: string) => {
    const res = await fetch("/api/members", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, avatar, age, maxRating }),
    });
    const member = await res.json();
    setMembers((prev: Member[]) => [...prev, member]);
  };

  const handleDeleteMember = async (memberId: number) => {
    await fetch("/api/members", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ memberId }),
    });
    setMembers((prev: Member[]) => prev.filter((m: Member) => m.id !== memberId));
  };

  const handleUpdateMember = async (memberId: number, updates: { age?: number | null; maxRating?: string }) => {
    await fetch("/api/members", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ memberId, ...updates }),
    });
    setMembers((prev: Member[]) =>
      prev.map((m: Member) =>
        m.id === memberId
          ? { ...m, age: updates.age !== undefined ? updates.age : m.age, max_rating: updates.maxRating !== undefined ? updates.maxRating : m.max_rating }
          : m
      )
    );
  };

  // ── Not signed in (also covers the brief session-check moment — same
  // branded screen either way, no bare "Loading..." flash) ──
  if (!isLoggedIn) {
    // A returning guest with valid saved state never sees sign-in/guest
    // buttons — they'd restore out from under a click anyway. Show a
    // neutral version of the same branded screen until that finishes
    // (bounded by the safety-net timeout above, so this never hangs).
    const stillRestoringGuest = hasPendingGuestRestore && !guestRestoreAttempted;
    return (
      <div className="min-h-screen bg-[#0a0a1a] flex flex-col">
        <Header onSignIn={() => signIn("google")} />
        <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
          <div className="text-6xl mb-6">🍿</div>
          <h1 className="text-4xl font-bold text-white mb-3">Next Movie</h1>
          {stillRestoringGuest ? (
            <p className="text-gray-500 text-sm mb-8">Restoring your picks…</p>
          ) : (
            <>
              <p className="text-gray-400 text-lg mb-2 max-w-md">
                Pick 5 movies you love. We&apos;ll tell you what to watch next.
              </p>
              <p className="text-gray-600 text-sm mb-8">
                Free to start — no account needed. <a href="/premium" className="text-purple-400 hover:text-purple-300">Premium</a> unlocks more.
              </p>
              <button
                onClick={() => signIn("google")}
                className="bg-white text-gray-900 font-semibold px-8 py-3 rounded-full text-lg hover:bg-gray-100 transition mb-4"
              >
                Sign in with Google
              </button>
              <button
                onClick={handleGuestStart}
                className="text-gray-500 hover:text-gray-300 transition text-sm"
              >
                Try without signing in
              </button>
            </>
          )}
        </div>
        <SiteFooter />
      </div>
    );
  }


  // ── Select member ──
  if (step === "select-member") {
    return (
      <div className="min-h-screen bg-[#0a0a1a] flex flex-col">
        <Header
          session={session}
          onSignOut={() => signOut()}
          onSwitch={() => { setSelectedMember(null); setStep("select-member"); }}
          memberName={selectedMember?.name}
        />
        <div className="flex-1 flex flex-col items-center justify-center px-4">
          <h2 className="text-2xl font-bold text-white mb-2">Who&apos;s watching?</h2>
          <p className="text-gray-500 text-sm mb-8">Pick your profile to get personalized picks</p>
          <div className="w-full max-w-lg">
            <MemberSelector
              members={members}
              selectedMember={selectedMember}
              onSelect={handleSelectMember}
              onAdd={handleAddMember}
              onDelete={handleDeleteMember}
              onUpdateMember={handleUpdateMember}
              viewingAll={false}
              onViewAll={() => {}}
            />
          </div>
        </div>
      </div>
    );
  }

  // ── Saved genres ──
  if (step === "saved-genres") {
    return (
      <div className="min-h-screen bg-[#0a0a1a] flex flex-col">
        <Header
          session={session}
          onSignOut={() => signOut()}
          onSwitch={() => { setSelectedMember(null); setStep("select-member"); }}
          memberName={selectedMember?.name}
        />
        <div className="flex-1 px-4 pt-8 pb-8 max-w-lg mx-auto w-full">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-white mb-2">Welcome back!</h2>
            <p className="text-gray-500 text-sm">Continue where you left off or start fresh</p>
          </div>

          <div className="space-y-3 mb-8">
            {savedCategories.map((cat) => (
              <button
                key={`${cat.content_type}-${cat.category}`}
                onClick={() => loadSavedGenre(cat.category, cat.content_type)}
                className="w-full flex items-center justify-between bg-gray-900/60 hover:bg-gray-800/80 border border-gray-800/50 rounded-2xl px-5 py-4 transition-all group"
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{cat.content_type === "show" ? "📺" : "🎬"}</span>
                  <div className="text-left">
                    <p className="text-white font-semibold">{genreLabel(cat.category, cat.content_type)}</p>
                    <p className="text-gray-500 text-xs">{cat.count} {cat.content_type === "show" ? "shows" : "movies"} rated</p>
                  </div>
                </div>
                <svg className="w-5 h-5 text-gray-600 group-hover:text-white transition" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            ))}
          </div>

          <div className="text-center">
            <button
              onClick={() => { setStep("pick"); setActiveGenre(null); setActiveCategory("for-you"); loadGrid(); }}
              className="bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold px-8 py-3 rounded-full hover:from-purple-500 hover:to-pink-500 transition shadow-lg shadow-purple-500/25"
            >
              New Picks
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Pick 5 ──
  if (step === "pick") {
    const count = selectedIds.size;
    const label = contentType === "show" ? "shows" : "movies";
    const displayedGridMovies = searchMode === "person" ? personMovies : searchMode === "search" ? searchResults : gridMovies;
    const gridIsLoading = searchMode === "person" ? personLoading : searchMode === "search" ? searchLoading : loadingGrid;

    const MOVIE_GENRE_FILTERS: { id: number; label: string }[] = [
      { id: 28, label: "Action" },
      { id: 35, label: "Comedy" },
      { id: 18, label: "Drama" },
      { id: 27, label: "Horror" },
      { id: 878, label: "Sci-Fi" },
      { id: 10749, label: "Romance" },
      { id: 53, label: "Thriller" },
      { id: 16, label: "Animation" },
      { id: 14, label: "Fantasy" },
      { id: 99, label: "Documentary" },
      { id: 10751, label: "Family" },
      { id: 9648, label: "Mystery" },
    ];

    const SHOW_GENRE_FILTERS: { id: number; label: string }[] = [
      { id: 10759, label: "Action & Adventure" },
      { id: 35, label: "Comedy" },
      { id: 18, label: "Drama" },
      { id: 80, label: "Crime" },
      { id: 10765, label: "Sci-Fi & Fantasy" },
      { id: 9648, label: "Mystery" },
      { id: 16, label: "Animation" },
      { id: 10751, label: "Family" },
      { id: 99, label: "Documentary" },
      { id: 10764, label: "Reality" },
    ];

    const GENRE_FILTERS = contentType === "show" ? SHOW_GENRE_FILTERS : MOVIE_GENRE_FILTERS;

    return (
      <div className="min-h-screen bg-[#0a0a1a] flex flex-col">
        <Header
          session={session}
          onSignOut={() => signOut()}
          onSwitch={() => { setSelectedMember(null); setStep("select-member"); }}
          memberName={selectedMember?.name}
        />

        <div className="flex-1 px-4 pt-4 pb-32 max-w-4xl mx-auto w-full">
          {error && (
            <div className="text-red-400 text-center text-sm mb-4">{error}</div>
          )}

          {/* Who's watching — guests only, inline at the top, mandatory before results */}
          {guestMode && !selectedMember && (
            <div className="mb-4 bg-gray-900/60 border border-gray-800/50 rounded-2xl px-3 py-3">
              <p className="text-gray-400 text-xs font-medium mb-2 text-center">
                🔞 Who&apos;s watching? <span className="text-gray-600">(keeps picks age-appropriate)</span>
              </p>
              <div className="flex items-center justify-center gap-2 flex-wrap">
                {GUEST_RATING_TIERS.map((tier) => (
                  <button
                    key={tier.value}
                    onClick={() => handleGuestRatingSelect(tier.value)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                      guestRatingTouched && guestMaxRating === tier.value
                        ? "bg-purple-600 text-white"
                        : "bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700"
                    }`}
                  >
                    <span>{tier.icon}</span> {tier.label}
                  </button>
                ))}
              </div>
              {!guestRatingTouched && (
                <p className="text-amber-400/80 text-[11px] text-center mt-2">Tap one to confirm — required before you get results</p>
              )}
            </div>
          )}

          <div className="text-center mb-4">
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2">
              Find something to watch
            </h2>
            <p className="text-gray-500 text-sm">
              Pick a few {label} you love, or tell us the mood — either way takes seconds
            </p>
          </div>

          {/* Movies vs Shows toggle */}
          <div className="flex justify-center mb-4">
            <div className="inline-flex bg-gray-800/60 border border-gray-700/50 rounded-full p-1">
              <button
                onClick={() => handleContentTypeChange("movie")}
                className={`px-5 py-2 rounded-full text-sm font-medium transition-all ${
                  contentType === "movie"
                    ? "bg-purple-600 text-white shadow-lg shadow-purple-600/30"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                Movies
              </button>
              <button
                onClick={() => handleContentTypeChange("show")}
                className={`px-5 py-2 rounded-full text-sm font-medium transition-all ${
                  contentType === "show"
                    ? "bg-purple-600 text-white shadow-lg shadow-purple-600/30"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                Shows
              </button>
            </div>
          </div>

          {/* Two equal entry points: Pick 5 vs Mood */}
          <div className="grid grid-cols-2 gap-3 mb-5">
            <div className="bg-gradient-to-br from-purple-900/40 to-pink-900/20 border border-purple-700/40 rounded-2xl px-4 py-4 text-center">
              <p className="text-white font-bold text-sm mb-1">🎬 Pick {count}/5 you love</p>
              <p className="text-gray-400 text-xs">Browse below &amp; tap to select</p>
            </div>
            <button
              onClick={() => setShowMoodPanel(true)}
              className="bg-gray-900/60 hover:bg-gray-800/80 border border-gray-800/50 hover:border-purple-500/50 rounded-2xl px-4 py-4 text-center transition-all"
            >
              <p className="text-white font-bold text-sm mb-1">✨ Describe a mood</p>
              <p className="text-gray-400 text-xs">Skip picking — just tell us the vibe</p>
            </button>
          </div>

          <p className="text-gray-600 text-xs text-center mb-3">
            ⭐ Tap the stars on a pick to rate it — higher ratings shape your recommendations more
          </p>

          {/* Watchable tonight — one-time streaming service preference */}
          <button
            onClick={() => setShowProvidersPanel(true)}
            className="w-full flex items-center justify-center gap-1.5 text-xs font-medium text-gray-400 hover:text-white bg-gray-900/40 hover:bg-gray-800/60 border border-gray-800/50 rounded-full py-2 mb-4 transition-all"
          >
            📺{" "}
            {preferredProviders.length > 0
              ? `Your results will rank ${preferredProviders.length} streaming service${preferredProviders.length > 1 ? "s" : ""} first — change`
              : "Tell us what you're subscribed to — your results will rank watchable-tonight picks first"}
          </button>

          {/* Filters — platform, language, rating, runtime (movies only for now) */}
          {contentType === "movie" && (
            <>
              <button
                onClick={() => setShowFilterBar((v) => !v)}
                className="w-full flex items-center justify-center gap-1.5 text-xs font-medium text-gray-400 hover:text-white bg-gray-900/40 hover:bg-gray-800/60 border border-gray-800/50 rounded-full py-2 mb-3 transition-all"
              >
                ⚙️ {hasActiveDiscoverFilter ? "Filters applied — tap to edit" : "Filter by platform, language, rating, or runtime"}
              </button>
              {showFilterBar && (
                <div className="mb-4">
                  <InlineFilters
                    filters={discoverFilters}
                    onChange={setDiscoverFilters}
                    onClear={() => setDiscoverFilters({})}
                    isPremium={isPremium}
                    isGuest={guestMode}
                    onUpgrade={() => setUpsellFeature("Filter by language, rating, or runtime — see exactly the movies you want")}
                    onSignIn={() => setShowPlatformSignInPrompt(true)}
                    fields={["provider", "language", "rating", "runtime"]}
                  />
                  {hasActiveDiscoverFilter && (
                    <div className="flex justify-center mt-2">
                      <button
                        onClick={handleApplyDiscoverFilters}
                        className="bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold px-5 py-2 rounded-full text-sm transition-all"
                      >
                        Show matching movies
                      </button>
                    </div>
                  )}
                </div>
              )}
            </>
          )}

          {/* Search */}
          <div className="relative mb-3">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setSearchMode(e.target.value.trim().length >= 2 ? "search" : "browse");
              }}
              placeholder={`Search ${label} or people...`}
              className="w-full bg-gray-800/60 border border-gray-700/50 rounded-full pl-10 pr-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-purple-500/50"
            />
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500">🔍</span>
          </div>

          {/* Genre filter chips */}
          {searchMode === "browse" && (
            <div className="flex gap-2 overflow-x-auto pb-4 mb-2 scrollbar-hide">
              <button
                onClick={() => handleGenreChange(null)}
                className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                  !activeGenre
                    ? "bg-purple-600 text-white"
                    : "bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700"
                }`}
              >
                All
              </button>
              {GENRE_FILTERS.map((g) => (
                <button
                  key={g.id}
                  onClick={() => handleGenreChange(activeGenre === String(g.id) ? null : String(g.id))}
                  className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                    activeGenre === String(g.id)
                      ? "bg-purple-600 text-white"
                      : "bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700"
                  }`}
                >
                  {g.label}
                </button>
              ))}
            </div>
          )}

          {/* Person results (only while searching, movies only) */}
          {searchMode === "search" && personResults.length > 0 && (
            <div className="flex gap-2 overflow-x-auto pb-3 mb-1 scrollbar-hide">
              {personResults.map((p) => (
                <button
                  key={p.id}
                  onClick={() => handleSelectPerson(p)}
                  className="shrink-0 flex items-center gap-2 bg-gray-800/60 hover:bg-gray-700 border border-gray-700/50 rounded-full pl-1.5 pr-3 py-1.5 transition-all"
                >
                  {p.profile_path ? (
                    <img src={posterUrl(p.profile_path, "w92")} alt="" className="w-7 h-7 rounded-full object-cover" />
                  ) : (
                    <span className="w-7 h-7 rounded-full bg-gray-700 flex items-center justify-center text-xs">🎭</span>
                  )}
                  <span className="text-xs text-gray-200 font-medium">{p.name}</span>
                  {!isPremium && <span className="text-[10px]">🔒</span>}
                </button>
              ))}
            </div>
          )}

          {/* Person filmography mode header */}
          {searchMode === "person" && activePerson && (
            <div className="flex items-center justify-between mb-3 px-1">
              <span className="text-white font-semibold text-sm">🎬 {activePerson.name}</span>
              <button onClick={handleBackToDiscovery} className="text-purple-400 hover:text-purple-300 text-xs font-medium">
                ← Back to search
              </button>
            </div>
          )}

          {gridIsLoading ? (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
              {Array.from({ length: 15 }).map((_, i) => (
                <div key={i} className="w-full aspect-[2/3] rounded-xl bg-gray-800/60 animate-pulse" style={{ animationDelay: `${(i % 5) * 80}ms` }} />
              ))}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                {displayedGridMovies.map((movie: Movie) => {
                  const isSelected = selectedIds.has(movie.id);
                  const isFull = count >= MAX_PICKS && !isSelected;
                  const rating = selectedRatings[movie.id] || 5;
                  return (
                    <div
                      key={movie.id}
                      role="button"
                      tabIndex={isFull ? -1 : 0}
                      onClick={() => !isFull && toggleMovie(movie.id)}
                      onKeyDown={(e) => {
                        if (!isFull && (e.key === "Enter" || e.key === " ")) toggleMovie(movie.id);
                      }}
                      aria-disabled={isFull}
                      className={`relative group rounded-xl overflow-hidden transition-all duration-200 cursor-pointer ${
                        isSelected
                          ? "ring-3 ring-amber-400 scale-[1.03] shadow-lg shadow-amber-400/20"
                          : isFull
                            ? "opacity-40 cursor-not-allowed"
                            : "hover:scale-[1.03] hover:shadow-lg"
                      }`}
                    >
                      {movie.poster_path ? (
                        <img
                          src={posterUrl(movie.poster_path, "w342")}
                          alt={movie.title}
                          className="w-full aspect-[2/3] object-cover"
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-full aspect-[2/3] bg-gray-800 flex items-center justify-center text-gray-600 text-xs p-2 text-center">
                          {movie.title}
                        </div>
                      )}

                      {isSelected && (
                        <>
                          <div className="absolute inset-0 bg-amber-400/10" />
                          <div className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-amber-400 flex items-center justify-center shadow-lg">
                            <svg className="w-4 h-4 text-gray-900" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                          <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 flex items-center justify-center gap-0.5 bg-black/70 py-1.5">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <button
                                key={star}
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setMovieRating(movie.id, star);
                                }}
                                className="p-0.5"
                                aria-label={`Rate ${star} star${star > 1 ? "s" : ""}`}
                              >
                                <svg
                                  className={`w-4 h-4 ${star <= rating ? "text-amber-400" : "text-gray-600"}`}
                                  fill="currentColor"
                                  viewBox="0 0 20 20"
                                >
                                  <path d="M10 15.27L16.18 19l-1.64-7.03L20 7.24l-7.19-.61L10 0 7.19 6.63 0 7.24l5.46 4.73L3.82 19z" />
                                </svg>
                              </button>
                            ))}
                          </div>
                        </>
                      )}

                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent p-2 pt-8">
                        <p className="text-white text-xs font-medium leading-tight line-clamp-2">
                          {movie.title}
                        </p>
                        <p className="text-gray-400 text-[10px]">
                          {movie.release_date?.slice(0, 4)}
                        </p>
                      </div>

                      <div className="absolute top-1.5 left-1.5">
                        <span className="text-[10px] font-bold bg-black/70 text-amber-400 px-1.5 py-0.5 rounded">
                          {movie.vote_average.toFixed(1)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {displayedGridMovies.length === 0 && searchMode === "browse" && (
                <div className="text-center text-gray-500 py-12">
                  {gridExhausted ? (
                    <p>No {label} in this genre at that rating.</p>
                  ) : (
                    <>
                      <p className="mb-3">No {label} on this page yet.</p>
                      <button
                        onClick={handleShowMore}
                        disabled={loadingMore}
                        className="bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white font-medium px-6 py-2.5 rounded-full text-sm transition-all disabled:opacity-50"
                      >
                        {loadingMore ? "Loading..." : "Try Loading More"}
                      </button>
                    </>
                  )}
                </div>
              )}

              {displayedGridMovies.length === 0 && searchMode === "search" && searchQuery.trim().length >= 2 && (
                <div className="text-center text-gray-500 py-12">
                  No {label} found for &quot;{searchQuery}&quot;.
                </div>
              )}

              {displayedGridMovies.length === 0 && searchMode === "person" && (
                <div className="text-center text-gray-500 py-12">
                  No {label} found for {activePerson?.name}.
                </div>
              )}

              {/* Show More button (browse mode only) */}
              {searchMode === "browse" && displayedGridMovies.length > 0 && (
              <div className="mt-6 text-center">
                {gridExhausted || showMoreCount >= MAX_SHOW_MORE_PAGES ? (
                  <p className="text-gray-600 text-sm">
                    That&apos;s everything{activeGenre ? ` in ${GENRE_FILTERS.find((g) => String(g.id) === activeGenre)?.label || "this genre"}` : ""}.
                  </p>
                ) : (
                  <button
                    onClick={handleShowMore}
                    disabled={loadingMore}
                    className="bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white font-medium px-6 py-2.5 rounded-full text-sm transition-all disabled:opacity-50"
                  >
                    {loadingMore ? "Loading..." : `Show More ${contentType === "show" ? "Shows" : "Movies"}`}
                  </button>
                )}
              </div>
              )}
            </>
          )}
        </div>

        {/* Bottom bar */}
        <div className="fixed bottom-0 left-0 right-0 bg-[#0a0a1a]/95 backdrop-blur-md border-t border-gray-800/50 px-4 py-3 z-50">
          <div className="max-w-4xl mx-auto flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex gap-1.5">
                {[0, 1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className={`w-2.5 h-2.5 rounded-full transition-all ${
                      i < count ? "bg-amber-400 scale-110" : "bg-gray-700"
                    }`}
                  />
                ))}
              </div>
              <span className="text-gray-400 text-xs sm:text-sm">
                {count < MIN_PICKS
                  ? `${count} of ${MIN_PICKS} picks needed`
                  : count < MAX_PICKS
                    ? `${count} picked — add up to ${MAX_PICKS} to sharpen results`
                    : `${count} of ${MAX_PICKS} picks`}
              </span>
            </div>

            <button
              onClick={handleGetRecommendations}
              disabled={count < MIN_PICKS}
              className={`px-6 py-2.5 rounded-full font-semibold text-sm transition-all shrink-0 ${
                count >= MIN_PICKS
                  ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-500 hover:to-pink-500 shadow-lg shadow-purple-500/25"
                  : "bg-gray-800 text-gray-600 cursor-not-allowed"
              }`}
            >
              Find My {contentType === "show" ? "Shows" : "Movies"}
            </button>
          </div>
        </div>

        {/* Mood panel */}
        {showMoodPanel && (
          <div
            className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm px-4 pb-4 sm:pb-0"
            onClick={(e) => { if (e.target === e.currentTarget) setShowMoodPanel(false); }}
          >
            <div className="bg-gray-900 border border-gray-700/50 rounded-3xl p-6 w-full max-w-md shadow-2xl">
              <div className="flex items-center justify-between mb-1">
                <h2 className="text-xl font-bold text-white">✨ What&apos;s the vibe?</h2>
                <button onClick={() => setShowMoodPanel(false)} className="text-gray-500 hover:text-gray-300 text-xl leading-none">&times;</button>
              </div>
              <p className="text-gray-500 text-sm mb-4">Describe a mood or pick one — we&apos;ll find {label} that match, no picks needed.</p>
              <div className="flex flex-wrap gap-2 mb-4">
                {MOOD_PRESETS.map((preset) => (
                  <button
                    key={preset.value}
                    onClick={() => handleMoodSubmit(preset.value)}
                    disabled={moodLoading}
                    className="bg-gray-800 hover:bg-purple-600 text-gray-300 hover:text-white text-xs font-medium px-3 py-2 rounded-full transition-all disabled:opacity-50"
                  >
                    {preset.display}
                  </button>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={moodText}
                  onChange={(e) => setMoodText(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") handleMoodSubmit(moodText); }}
                  placeholder="Or describe it yourself..."
                  disabled={moodLoading}
                  className="flex-1 bg-gray-800/60 border border-gray-700/50 rounded-full px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-purple-500/50 disabled:opacity-50"
                />
                <button
                  onClick={() => handleMoodSubmit(moodText)}
                  disabled={moodLoading || !moodText.trim()}
                  className="bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold px-5 py-2.5 rounded-full text-sm disabled:opacity-40 transition-all"
                >
                  {moodLoading ? "..." : "Go"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Streaming services panel — set once, ranks "watchable tonight" picks first */}
        {showProvidersPanel && (
          <div
            className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm px-4 pb-4 sm:pb-0"
            onClick={(e) => { if (e.target === e.currentTarget) setShowProvidersPanel(false); }}
          >
            <div className="bg-gray-900 border border-gray-700/50 rounded-3xl p-6 w-full max-w-md shadow-2xl">
              <div className="flex items-center justify-between mb-1">
                <h2 className="text-xl font-bold text-white">📺 What do you have?</h2>
                <button onClick={() => setShowProvidersPanel(false)} className="text-gray-500 hover:text-gray-300 text-xl leading-none">&times;</button>
              </div>
              <p className="text-gray-500 text-sm mb-4">Pick your streaming services and we&apos;ll rank what&apos;s watchable tonight first. Set it once — we&apos;ll remember.</p>
              <div className="grid grid-cols-2 gap-2 mb-5">
                {STREAMING_PLATFORMS.map((p) => {
                  const isSelected = preferredProviders.includes(p.id);
                  return (
                    <button
                      key={p.id}
                      onClick={() =>
                        setPreferredProviders((prev) =>
                          prev.includes(p.id) ? prev.filter((id) => id !== p.id) : [...prev, p.id]
                        )
                      }
                      className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                        isSelected
                          ? "bg-purple-600 text-white ring-2 ring-purple-400"
                          : "bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700"
                      }`}
                    >
                      <span>{p.logo}</span> {p.name}
                    </button>
                  );
                })}
              </div>
              <button
                onClick={() => handleSavePreferredProviders(preferredProviders)}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold py-2.5 rounded-full text-sm transition-all"
              >
                {preferredProviders.length > 0 ? "Save" : "Skip for now"}
              </button>
            </div>
          </div>
        )}

        {/* Platform filter sign-in prompt — explain before navigating away */}
        {showPlatformSignInPrompt && (
          <div
            className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 backdrop-blur-sm px-4"
            onClick={(e) => { if (e.target === e.currentTarget) setShowPlatformSignInPrompt(false); }}
          >
            <div className="bg-gray-900 border border-gray-700/50 rounded-3xl max-w-sm w-full p-6 shadow-2xl shadow-purple-900/30 text-center">
              <button onClick={() => setShowPlatformSignInPrompt(false)} className="absolute float-right -mt-2 -mr-2 text-gray-500 hover:text-white text-xl">&times;</button>
              <div className="text-4xl mb-3">📺</div>
              <h2 className="text-xl font-bold text-white mb-2">Sign in to filter by platform</h2>
              <p className="text-gray-400 text-sm mb-4">
                Filtering by streaming service is free — it just needs an account so we can remember which services you have. Signing in with Google only shares your name and email; it never posts anything or touches your Google account otherwise.
              </p>
              <button
                onClick={() => { setShowPlatformSignInPrompt(false); signIn("google"); }}
                className="w-full bg-white text-gray-900 font-semibold py-3 rounded-2xl text-sm hover:bg-gray-100 transition-all mb-3"
              >
                Sign in with Google
              </button>
              <button
                onClick={() => setShowPlatformSignInPrompt(false)}
                className="w-full bg-gray-800 hover:bg-gray-700 text-gray-300 py-2.5 rounded-2xl text-sm transition-colors"
              >
                Maybe later
              </button>
            </div>
          </div>
        )}

        {/* Premium upsell */}
        {upsellFeature && (
          <div
            className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 backdrop-blur-sm px-4"
            onClick={(e) => { if (e.target === e.currentTarget) setUpsellFeature(null); }}
          >
            <div className="bg-gray-900 border border-gray-700/50 rounded-3xl max-w-sm w-full p-6 shadow-2xl shadow-purple-900/30 text-center">
              <button onClick={() => setUpsellFeature(null)} className="absolute float-right -mt-2 -mr-2 text-gray-500 hover:text-white text-xl">&times;</button>
              <div className="inline-flex items-center gap-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full mb-3">
                Premium
              </div>
              <h2 className="text-xl font-bold text-white mb-2">Unlock Premium</h2>
              <p className="text-gray-400 text-sm mb-4">{upsellFeature}</p>
              <div className="flex items-center justify-center gap-2 mb-5 text-sm">
                <span className="text-gray-400">From</span>
                <span className="text-white text-2xl font-bold">$4.99</span>
                <span className="text-gray-400">/month</span>
              </div>
              <a
                href="/premium"
                className="block w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white py-3 rounded-2xl font-bold transition-all hover:scale-[1.02] mb-3"
              >
                See Plans &amp; Features →
              </a>
              <button
                onClick={() => setUpsellFeature(null)}
                className="w-full bg-gray-800 hover:bg-gray-700 text-gray-300 py-2.5 rounded-2xl text-sm transition-colors"
              >
                Maybe later
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ── Loading ──
  if (step === "loading") {
    return (
      <div className="min-h-screen bg-[#0a0a1a] flex flex-col items-center justify-center px-6">
        <div className="text-6xl mb-6 animate-bounce">🍿</div>
        <h2 className="text-xl font-bold text-white mb-2">Finding your perfect {contentType === "show" ? "shows" : "movies"}...</h2>
        <p className="text-gray-500 text-sm text-center max-w-sm">
          Analyzing your taste across {selectedIds.size} picks to find {contentType === "show" ? "shows" : "movies"} you&apos;ll love
        </p>
        <div className="mt-8 flex gap-1">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-2 h-2 rounded-full bg-purple-500 animate-pulse"
              style={{ animationDelay: `${i * 200}ms` }}
            />
          ))}
        </div>
      </div>
    );
  }

  // ── Results ──
  if (step === "results") {
    const label = contentType === "show" ? "shows" : "movies";
    const displayedRecommendations = sortForDisplay(
      recommendations.filter((m: Movie) => passesDecade(m, minDecade)),
      preferredProviders
    );
    const hiddenByDecade = recommendations.length > 0 && displayedRecommendations.length === 0;

    return (
      <div className="min-h-screen bg-[#0a0a1a] flex flex-col">
        <Header
          session={session}
          onSignOut={() => signOut()}
          onSwitch={() => { setSelectedMember(null); setStep("select-member"); }}
          memberName={selectedMember?.name}
        />

        <div className="flex-1 px-4 pt-4 pb-8 max-w-xl mx-auto w-full">
          {/* Swipe legend */}
          <div className="flex items-center justify-between mb-4 px-2">
            <div className="flex items-center gap-2">
              <span className="text-3xl">👈</span>
              <span className="text-red-400 font-bold">Nope</span>
            </div>
            <div className="text-center">
              <h2 className="text-xl font-bold text-white">Your Next Watch</h2>
              {activeCategory === "mood" && activeMood ? (
                <p className="text-purple-400 text-xs font-medium">✨ &quot;{activeMood}&quot;</p>
              ) : activeCategory && activeCategory !== "for-you" && (
                <p className="text-purple-400 text-xs font-medium">{genreLabel(activeCategory, contentType)}</p>
              )}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-green-400 font-bold">Liked</span>
              <span className="text-3xl">👉</span>
            </div>
          </div>

          {/* Decade filter */}
          <div className="flex items-center justify-center gap-2 flex-wrap mb-4">
            <span className="text-gray-500 text-xs font-medium mr-1">Era</span>
            <button
              onClick={() => handleDecadeChange(null)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                !minDecade
                  ? "bg-purple-600 text-white"
                  : "bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700"
              }`}
            >
              All
            </button>
            {DECADE_FILTERS.map((d) => (
              <button
                key={d.value}
                onClick={() => handleDecadeChange(d.value)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                  minDecade === d.value
                    ? "bg-purple-600 text-white"
                    : "bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700"
                }`}
              >
                {d.label}
              </button>
            ))}
          </div>

          {refining && (
            <div className="flex items-center justify-center gap-2 bg-purple-900/30 border border-purple-700/40 text-purple-300 text-sm font-medium rounded-full py-2 px-4 mb-4 mx-auto w-fit">
              <span className="animate-pulse">✨</span> Refining your picks based on what you liked...
            </div>
          )}

          {error && (
            <div className="text-red-400 text-center mb-6">{error}</div>
          )}

          <div className="space-y-4">
            {displayedRecommendations.map((movie: Movie, i: number) => (
              <SwipeableCard
                key={movie.id}
                onSwipeLeft={() => handleSwipe(movie, "left")}
                onSwipeRight={() => handleSwipe(movie, "right")}
                isSwiping={swipingId === movie.id}
              >
                <FlippableCard movie={movie} index={i} contentType={contentType} />
              </SwipeableCard>
            ))}
          </div>

          {displayedRecommendations.length > 0 && (
            <>
              <div className="flex items-center justify-center gap-4 mt-5">
                <button
                  onClick={() => handleSwipe(displayedRecommendations[0], "left")}
                  disabled={swipingId !== null}
                  className="flex items-center gap-2 bg-gray-900 hover:bg-red-950/60 border border-gray-800 hover:border-red-800/60 text-red-400 font-semibold px-6 py-3 rounded-full transition-all disabled:opacity-50"
                >
                  ✕ Nope
                </button>
                <button
                  onClick={handleUndo}
                  disabled={!lastSwipe}
                  title="Undo last swipe"
                  className="flex items-center justify-center w-11 h-11 rounded-full bg-gray-900 hover:bg-gray-800 border border-gray-800 text-gray-400 hover:text-white transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  ↩
                </button>
                <button
                  onClick={() => handleSwipe(displayedRecommendations[0], "right")}
                  disabled={swipingId !== null}
                  className="flex items-center gap-2 bg-gray-900 hover:bg-green-950/60 border border-gray-800 hover:border-green-800/60 text-green-400 font-semibold px-6 py-3 rounded-full transition-all disabled:opacity-50"
                >
                  ♥ Liked
                </button>
              </div>
              <div className="flex items-center justify-center gap-4 mt-2">
                <button
                  onClick={() => handleLessLikeThis(displayedRecommendations[0])}
                  disabled={swipingId !== null}
                  className="text-gray-500 hover:text-gray-300 text-xs font-medium transition-colors disabled:opacity-50"
                >
                  👎 Less like this
                </button>
                <span className="text-gray-700 text-xs">·</span>
                <button
                  onClick={() => handleAlreadyWatched(displayedRecommendations[0])}
                  disabled={swipingId !== null}
                  title="Seen it — won't count against or for your taste, just won't show it again"
                  className="text-gray-500 hover:text-gray-300 text-xs font-medium transition-colors disabled:opacity-50"
                >
                  👀 Already watched
                </button>
              </div>
            </>
          )}

          {displayedRecommendations.length === 0 && !error && (
            <div className="text-center py-12">
              {fetchingMore ? (
                <>
                  <div className="text-3xl mb-3 animate-bounce">🍿</div>
                  <p className="text-gray-400">Finding more {label} for you...</p>
                </>
              ) : hiddenByDecade ? (
                <>
                  <p className="text-gray-400 mb-4">No {label} from that era in your current picks yet.</p>
                  {eraExhausted === minDecade ? (
                    <>
                      <button
                        disabled
                        className="bg-gray-800 text-gray-500 font-semibold px-8 py-3 rounded-full cursor-not-allowed"
                      >
                        No more {minDecade}s+ {label} {activeMood ? "for this mood" : "here"} — try All
                      </button>
                      <div className="mt-3">
                        <button
                          onClick={() => handleDecadeChange(null)}
                          className="text-purple-400 hover:text-purple-300 text-sm font-medium transition-colors"
                        >
                          Show All eras
                        </button>
                      </div>
                    </>
                  ) : (
                    <button
                      onClick={() => fetchMoreRecs()}
                      className="bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold px-8 py-3 rounded-full hover:from-purple-500 hover:to-pink-500 transition shadow-lg shadow-purple-500/25"
                    >
                      Find More {minDecade ? `${minDecade}s+ ` : ""}{contentType === "show" ? "Shows" : "Movies"}
                    </button>
                  )}
                </>
              ) : (
                <button
                  onClick={() => fetchMoreRecs()}
                  className="bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold px-8 py-3 rounded-full hover:from-purple-500 hover:to-pink-500 transition shadow-lg shadow-purple-500/25"
                >
                  Load More Recommendations
                </button>
              )}
            </div>
          )}

          <div className="mt-8 flex flex-col items-center gap-4">
            <button
              onClick={handleStartOver}
              className="bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold px-8 py-3 rounded-full hover:from-purple-500 hover:to-pink-500 transition shadow-lg shadow-purple-500/25"
            >
              Pick Again
            </button>
            {session?.user && (
              <button
                onClick={handleBackToGenres}
                className="text-gray-400 hover:text-white text-sm transition"
              >
                Back to My Genres
              </button>
            )}
            {guestMode && !session?.user && (
              <button
                onClick={() => signIn("google")}
                className="text-gray-400 hover:text-white text-sm transition flex items-center gap-2"
              >
                <span>🔒</span> Sign in to save your picks &amp; build your taste
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return null;
}

// ── Header ──

function Header({
  session,
  onSignIn,
  onSignOut,
  onSwitch,
  memberName,
}: {
  session?: { user?: { name?: string | null; image?: string | null } } | null;
  onSignIn?: () => void;
  onSignOut?: () => void;
  onSwitch?: () => void;
  memberName?: string;
}) {
  return (
    <header className="flex items-center justify-between px-4 py-3 border-b border-gray-800/50">
      <h1 className="text-xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
        Next Movie
      </h1>
      <div className="flex items-center gap-3">
        {memberName && (
          <button
            onClick={onSwitch}
            className="text-gray-400 hover:text-white text-sm transition"
          >
            {memberName} &middot; Switch
          </button>
        )}
        {session?.user ? (
          <button
            onClick={onSignOut}
            className="text-gray-500 hover:text-gray-300 text-sm transition"
          >
            Sign out
          </button>
        ) : onSignIn ? (
          <button
            onClick={onSignIn}
            className="bg-white/10 hover:bg-white/20 text-white text-sm px-4 py-1.5 rounded-full transition"
          >
            Sign in
          </button>
        ) : null}
      </div>
    </header>
  );
}

// ── Swipeable Card ──

function SwipeableCard({
  children,
  onSwipeLeft,
  onSwipeRight,
  isSwiping,
}: {
  children: React.ReactNode;
  onSwipeLeft: () => void;
  onSwipeRight: () => void;
  isSwiping?: boolean;
}) {
  const cardRef = useRef<HTMLDivElement>(null);
  const startX = useRef(0);
  const currentX = useRef(0);
  const isDragging = useRef(false);
  const [offset, setOffset] = useState(0);
  const [exitDir, setExitDir] = useState<"left" | "right" | null>(null);

  const THRESHOLD = 80;

  const handleStart = (x: number) => {
    isDragging.current = true;
    startX.current = x;
    currentX.current = x;
  };

  const handleMove = (x: number) => {
    if (!isDragging.current) return;
    currentX.current = x;
    const dx = x - startX.current;
    setOffset(dx);
  };

  const handleEnd = () => {
    if (!isDragging.current) return;
    isDragging.current = false;

    if (offset > THRESHOLD) {
      setExitDir("right");
      setTimeout(onSwipeRight, 250);
    } else if (offset < -THRESHOLD) {
      setExitDir("left");
      setTimeout(onSwipeLeft, 250);
    }

    setOffset(0);
  };

  useEffect(() => {
    if (isSwiping) return;
    setExitDir(null);
  }, [isSwiping]);

  const onTouchStart = (e: React.TouchEvent) => handleStart(e.touches[0].clientX);
  const onTouchMove = (e: React.TouchEvent) => handleMove(e.touches[0].clientX);
  const onTouchEnd = () => handleEnd();
  const onMouseDown = (e: React.MouseEvent) => { e.preventDefault(); handleStart(e.clientX); };
  const onMouseMove = (e: React.MouseEvent) => handleMove(e.clientX);
  const onMouseUp = () => handleEnd();
  const onMouseLeave = () => { if (isDragging.current) handleEnd(); };

  const rotation = offset * 0.05;
  const opacity = exitDir ? 0 : 1;
  const translateX = exitDir === "left" ? -400 : exitDir === "right" ? 400 : offset;
  const showLabel = Math.abs(offset) > 30;

  return (
    <div
      ref={cardRef}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      onMouseLeave={onMouseLeave}
      className="relative select-none cursor-grab active:cursor-grabbing"
      style={{
        transform: `translateX(${translateX}px) rotate(${rotation}deg)`,
        opacity,
        transition: isDragging.current ? "none" : "all 0.3s ease-out",
      }}
    >
      {showLabel && offset < 0 && (
        <div className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none">
          <span className="text-red-400 font-bold text-lg bg-red-900/60 px-4 py-2 rounded-xl border-2 border-red-400 -rotate-12">
            Not interested
          </span>
        </div>
      )}
      {showLabel && offset > 0 && (
        <div className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none">
          <span className="text-green-400 font-bold text-lg bg-green-900/60 px-4 py-2 rounded-xl border-2 border-green-400 rotate-12">
            Liked it
          </span>
        </div>
      )}
      {children}
    </div>
  );
}

// ── Flippable Card ──

interface MovieDetails {
  runtime: number | null;
  genres: string[];
  director: string | null;
  cast: { name: string; character: string }[];
  tagline: string | null;
}

function FlippableCard({ movie, index, contentType = "movie" }: { movie: Movie; index: number; contentType?: "movie" | "show" }) {
  const [flipped, setFlipped] = useState(false);
  const [details, setDetails] = useState<MovieDetails | null>(null);
  const fetchedRef = useRef(false);

  const handleTap = (e: React.MouseEvent | React.TouchEvent) => {
    if ("button" in e && e.button !== 0) return;
    setFlipped((f) => !f);

    if (!fetchedRef.current) {
      fetchedRef.current = true;
      const url = contentType === "show"
        ? `/api/shows/details?showId=${movie.id}`
        : `/api/movies/details?movieId=${movie.id}`;
      fetch(url)
        .then((r) => r.json())
        .then(setDetails)
        .catch(() => {});
    }
  };

  const formatRuntime = (min: number) => {
    const h = Math.floor(min / 60);
    const m = min % 60;
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  };

  return (
    <div
      className="h-[42vh] min-h-[260px] max-h-[340px] cursor-pointer"
      style={{ perspective: "1000px" }}
      onClick={handleTap}
    >
      <div
        className="relative w-full h-full transition-transform duration-500"
        style={{
          transformStyle: "preserve-3d",
          transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)",
        }}
      >
        {/* ── Front ── */}
        <div
          className="absolute inset-0 rounded-2xl overflow-hidden border border-gray-800/50 shadow-lg flex bg-gray-900/80"
          style={{ backfaceVisibility: "hidden" }}
        >
          <div className="relative w-[40%] shrink-0">
            {movie.poster_path ? (
              <img
                src={posterUrl(movie.poster_path, "w342")}
                alt={movie.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gray-800 flex items-center justify-center text-gray-600 text-xs">
                No poster
              </div>
            )}
            {index === 0 && (
              <div className="absolute top-2 left-2 bg-amber-500 text-gray-900 text-[10px] font-bold px-2 py-0.5 rounded-full shadow">
                #1 Pick
              </div>
            )}
            <div className="absolute bottom-2 left-2 flex items-center gap-1.5">
              <span className="bg-black/80 text-amber-400 font-bold text-sm px-2 py-1 rounded-lg">
                ★ {movie.vote_average?.toFixed(1)}
              </span>
              {movie.certification && movie.certification !== "NR" && (
                <span className="bg-black/80 text-gray-300 font-medium text-sm px-2 py-1 rounded-lg">
                  {movie.certification}
                </span>
              )}
            </div>
          </div>

          <div className="flex-1 p-4 flex flex-col justify-between min-w-0">
            <div>
              <h3 className="text-white font-bold text-xl leading-snug line-clamp-2">
                {movie.title}
              </h3>
              <p className="text-gray-500 mt-0.5">
                {movie.release_date?.slice(0, 4)}
              </p>
              {movie.reason && (
                <p className="text-purple-400 text-sm font-medium mt-1.5 line-clamp-2">
                  ✨ {movie.reason}
                </p>
              )}
              {movie.overview && (
                <p className="text-gray-400 mt-2 leading-relaxed line-clamp-2">
                  {movie.overview}
                </p>
              )}
            </div>
            <div className="flex items-center justify-between">
              {(() => {
                const flat = dedupeProviders(movie.providers?.flatrate || []);
                const rentBuy = dedupeProviders([...(movie.providers?.rent || []), ...(movie.providers?.buy || [])]);
                const list = flat.length > 0 ? flat : rentBuy;
                const label = flat.length > 0 ? "Stream" : rentBuy.length > 0 ? "Rent/Buy" : null;
                if (!label || !movie.providers?.link) {
                  return <span className="text-gray-600 text-xs">Not streaming in Canada</span>;
                }
                return (
                  <a
                    href={movie.providers.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="flex items-center gap-1.5 hover:opacity-80 transition-opacity"
                  >
                    <span className="text-gray-500 text-xs">{label}</span>
                    {list.slice(0, 4).map((p) => (
                      <img
                        key={p.provider_id}
                        src={`${TMDB_IMG}/w45${p.logo_path}`}
                        alt={p.provider_name}
                        title={p.provider_name}
                        className="w-7 h-7 rounded"
                      />
                    ))}
                  </a>
                );
              })()}
              <span className="text-purple-400 text-xs font-medium">Tap for more →</span>
            </div>
          </div>
        </div>

        {/* ── Back ── */}
        <div
          className="absolute inset-0 rounded-2xl overflow-hidden border border-gray-800/50 shadow-lg bg-gray-900 flex flex-col"
          style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
        >
          {/* Compact header */}
          <div className="px-4 pt-4 pb-2 border-b border-gray-800/50">
            <div className="flex items-center justify-between mb-1.5">
              <h3 className="text-white font-bold text-lg leading-tight line-clamp-1 flex-1 mr-2">
                {movie.title}
              </h3>
              <div className="flex items-center gap-1.5 shrink-0">
                <span className="text-amber-400 font-bold text-sm">★ {movie.vote_average?.toFixed(1)}</span>
                {movie.certification && movie.certification !== "NR" && (
                  <span className="text-gray-400 bg-gray-800 px-1.5 py-0.5 rounded text-xs">{movie.certification}</span>
                )}
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-gray-400">
              <span>{movie.release_date?.slice(0, 4)}</span>
              {details?.runtime && <><span>·</span><span>{formatRuntime(details.runtime)}</span></>}
              {details?.director && <><span>·</span><span>{contentType === "show" ? "Creator" : "Dir."} {details.director}</span></>}
              {details?.genres && details.genres.length > 0 && (
                <><span>·</span><span>{details.genres.join(", ")}</span></>
              )}
            </div>
            {details?.cast && details.cast.length > 0 && (
              <p className="text-xs text-gray-500 mt-1 line-clamp-1">
                {details.cast.map((c: { name: string }) => c.name).join(", ")}
              </p>
            )}
            {movie.reason && (
              <p className="text-purple-400 text-xs font-medium mt-1.5">✨ {movie.reason}</p>
            )}
          </div>

          {/* Full synopsis — main content */}
          <div className="flex-1 overflow-y-auto px-4 py-4">
            {!details ? (
              <div className="flex items-center justify-center h-full">
                <span className="text-gray-500">Loading details...</span>
              </div>
            ) : movie.overview ? (
              <p className="text-gray-200 text-base leading-relaxed">
                {movie.overview}
              </p>
            ) : (
              <p className="text-gray-500 text-center">No description available</p>
            )}
          </div>

          {/* Compact footer */}
          <div className="px-4 py-2.5 border-t border-gray-800/50">
            {(() => {
              const flat = dedupeProviders(movie.providers?.flatrate || []);
              const rentBuy = dedupeProviders([...(movie.providers?.rent || []), ...(movie.providers?.buy || [])]);
              const list = flat.length > 0 ? flat : rentBuy;
              const label = flat.length > 0 ? "Stream on" : rentBuy.length > 0 ? "Rent or buy on" : null;
              if (!label || !movie.providers?.link) {
                return (
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600 text-xs">Not streaming in Canada right now</span>
                    <span className="text-purple-400 text-xs font-medium">← Tap to flip back</span>
                  </div>
                );
              }
              return (
                <a
                  href={movie.providers.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="block hover:opacity-80 transition-opacity"
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-gray-500 text-xs">{label} &middot; Canada</span>
                    <span className="text-purple-400 text-xs font-medium">View all →</span>
                  </div>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {list.slice(0, 4).map((p) => (
                      <span key={p.provider_id} className="flex items-center gap-1 bg-gray-800/60 rounded-full pl-1 pr-2 py-0.5">
                        <img src={`${TMDB_IMG}/w45${p.logo_path}`} alt="" className="w-5 h-5 rounded-full" />
                        <span className="text-gray-300 text-xs">{p.provider_name.replace(/\s*(standard|basic|premium)?\s*with ads\b/i, "")}</span>
                      </span>
                    ))}
                  </div>
                </a>
              );
            })()}
          </div>
        </div>
      </div>
    </div>
  );
}
