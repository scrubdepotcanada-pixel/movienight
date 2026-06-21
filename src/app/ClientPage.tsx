"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useSession, signIn, signOut } from "next-auth/react";
import MemberSelector from "@/components/MemberSelector";

interface Movie {
  id: number;
  title: string;
  poster_path: string | null;
  vote_average: number;
  overview?: string;
  release_date?: string;
  certification?: string;
  genre_ids?: number[];
  providers?: {
    flatrate?: { provider_id: number; provider_name: string; logo_path: string }[];
  };
}

interface Member {
  id: number;
  name: string;
  avatar: string;
  age?: number | null;
  max_rating?: string | null;
}

const TMDB_IMG = "https://image.tmdb.org/t/p";

const GENRE_MAP: Record<string, string> = {
  "28": "Action", "35": "Comedy", "18": "Drama", "27": "Horror",
  "878": "Sci-Fi", "10749": "Romance", "53": "Thriller", "16": "Animation",
  "14": "Fantasy", "99": "Documentary", "9648": "Mystery", "12": "Adventure",
};

function genreLabel(category: string): string {
  if (category === "for-you" || category === "all") return "All Genres";
  return GENRE_MAP[category] || category;
}

function posterUrl(path: string | null, size = "w342") {
  if (!path) return "";
  return `${TMDB_IMG}/${size}${path}`;
}

export default function ClientPage() {
  const { data: session, status } = useSession();

  const [members, setMembers] = useState<Member[]>([]);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [guestMode, setGuestMode] = useState(false);
  const isLoggedIn = status === "authenticated" || guestMode;

  const [step, setStep] = useState<"select-member" | "saved-genres" | "pick" | "loading" | "results">("select-member");
  const [gridMovies, setGridMovies] = useState<Movie[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [recommendations, setRecommendations] = useState<Movie[]>([]);
  const [recBuffer, setRecBuffer] = useState<Movie[]>([]);
  const [loadingGrid, setLoadingGrid] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [gridPage, setGridPage] = useState(1);
  const [showMoreCount, setShowMoreCount] = useState(0);
  const [activeGenre, setActiveGenre] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>("for-you");
  const [savedCategories, setSavedCategories] = useState<{ category: string; count: number }[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [swipingId, setSwipingId] = useState<number | null>(null);
  const [fetchingMore, setFetchingMore] = useState(false);

  useEffect(() => {
    if (status !== "authenticated" && !guestMode) return;
    fetch("/api/members").then((r) => r.json()).then(setMembers).catch(() => {});
  }, [status, guestMode]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [step]);

  const loadGrid = async (page = 1, append = false, genreId?: string | null) => {
    if (page === 1) setLoadingGrid(true);
    else setLoadingMore(true);
    try {
      const params = new URLSearchParams({ page: String(page) });
      if (genreId) params.set("genre", genreId);
      const res = await fetch(`/api/movies/popular-grid?${params}`);
      const data = await res.json();
      const newMovies: Movie[] = data.movies || [];
      if (append) {
        setGridMovies((prev: Movie[]) => {
          const existingIds = new Set(prev.map((m: Movie) => m.id));
          const unique = newMovies.filter((m: Movie) => !existingIds.has(m.id));
          return [...prev, ...unique];
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

  const MAX_SHOW_MORE = 10;

  const handleShowMore = () => {
    if (showMoreCount >= MAX_SHOW_MORE) return;
    setShowMoreCount((c: number) => c + 1);
    loadGrid(gridPage + 1, true, activeGenre);
  };

  const handleGenreChange = (genreId: string | null) => {
    setActiveGenre(genreId);
    setGridPage(1);
    loadGrid(1, false, genreId);
  };

  const handleSelectMember = async (member: Member) => {
    setSelectedMember(member);
    setSelectedIds(new Set());
    setRecommendations([]);
    setRecBuffer([]);

    try {
      const res = await fetch(`/api/session/categories?memberId=${member.id}`);
      const cats: { category: string; count: number }[] = await res.json();
      if (Array.isArray(cats) && cats.length > 0) {
        setSavedCategories(cats);
        setStep("saved-genres");
        return;
      }
    } catch {}

    setStep("pick");
    loadGrid();
  };

  const loadSavedGenre = async (category: string) => {
    if (!selectedMember) return;
    setActiveCategory(category);
    setStep("loading");

    try {
      const res = await fetch(`/api/session?memberId=${selectedMember.id}&category=${encodeURIComponent(category)}`);
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
        }));
        setRecommendations(saved);
        setRecBuffer([]);
        setStep("results");
        return;
      }

      // No active recs but user has history — fetch more via TMDB (free)
      const moreRes = await fetch("/api/movies/more-like", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ memberId: selectedMember.id, category }),
      });
      const moreData = await moreRes.json();
      const fresh: Movie[] = moreData.movies || [];
      if (fresh.length > 0) {
        setRecommendations(fresh.slice(0, 5));
        setRecBuffer(fresh.slice(5));
        setStep("results");
        return;
      }
    } catch {}

    setStep("pick");
    setActiveGenre(category === "for-you" ? null : category);
    loadGrid(1, false, category === "for-you" ? null : category);
  };

  const handleGuestStart = () => {
    setGuestMode(true);
    setStep("pick");
    setSelectedIds(new Set());
    setRecommendations([]);
    loadGrid();
  };

  const toggleMovie = (id: number) => {
    setSelectedIds((prev: Set<number>) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else if (next.size < 5) {
        next.add(id);
      }
      return next;
    });
  };

  const handleGetRecommendations = async () => {
    const titles = gridMovies
      .filter((m: Movie) => selectedIds.has(m.id))
      .map((m: Movie) => m.title);

    if (titles.length < 5) return;

    setStep("loading");
    setError(null);

    const category = activeGenre || "for-you";
    setActiveCategory(category);

    try {
      const res = await fetch("/api/movies/for-you", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          movieTitles: titles,
          memberId: selectedMember?.id,
          category,
          genreName: activeGenre ? GENRE_MAP[activeGenre] : undefined,
        }),
      });
      const data = await res.json();
      const all = data.movies || [];
      setRecommendations(all.slice(0, 10));
      setRecBuffer(all.slice(10));
      setStep("results");
    } catch {
      setError("Something went wrong. Please try again.");
      setStep("pick");
    }
  };

  const fetchMoreRecs = useCallback(async () => {
    if (fetchingMore || !selectedMember) return;
    setFetchingMore(true);
    try {
      const res = await fetch("/api/movies/more-like", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          memberId: selectedMember.id,
          category: activeCategory,
        }),
      });
      const data = await res.json();
      const fresh: Movie[] = data.movies || [];
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
  }, [selectedMember, activeCategory, fetchingMore]);

  const handleSwipe = useCallback((movie: Movie, direction: "left" | "right") => {
    setSwipingId(movie.id);

    setTimeout(() => {
      setRecommendations((prev: Movie[]) => {
        const idx = prev.findIndex((m: Movie) => m.id === movie.id);
        if (idx === -1) return prev;
        const next = [...prev];
        next.splice(idx, 1);
        return next;
      });

      setRecBuffer((prev: Movie[]) => {
        if (prev.length === 0) {
          fetchMoreRecs();
          return prev;
        }
        const [replacement, ...rest] = prev;
        setRecommendations((recs: Movie[]) => [...recs, replacement]);
        if (rest.length <= 2) fetchMoreRecs();
        return rest;
      });

      setSwipingId(null);
    }, 300);

    if (selectedMember) {
      if (direction === "right") {
        fetch("/api/movies/watched", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ memberId: selectedMember.id, movie, category: activeCategory }),
        }).catch(() => {});
      } else {
        fetch("/api/movies/dislike", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ memberId: selectedMember.id, movie, category: activeCategory }),
        }).catch(() => {});
      }
    }
  }, [selectedMember, activeCategory, fetchMoreRecs]);

  const handleStartOver = () => {
    setSelectedIds(new Set());
    setRecommendations([]);
    setRecBuffer([]);
    setShowMoreCount(0);
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

  // ── Not signed in ──
  if (status === "loading") {
    return (
      <div className="min-h-screen bg-[#0a0a1a] flex items-center justify-center">
        <div className="text-gray-400 text-lg">Loading...</div>
      </div>
    );
  }

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-[#0a0a1a] flex flex-col">
        <Header onSignIn={() => signIn("google")} />
        <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
          <div className="text-6xl mb-6">🍿</div>
          <h1 className="text-4xl font-bold text-white mb-3">Next Movie</h1>
          <p className="text-gray-400 text-lg mb-10 max-w-md">
            Pick 5 movies you love. We&apos;ll tell you what to watch next.
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
        </div>
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
                key={cat.category}
                onClick={() => loadSavedGenre(cat.category)}
                className="w-full flex items-center justify-between bg-gray-900/60 hover:bg-gray-800/80 border border-gray-800/50 rounded-2xl px-5 py-4 transition-all group"
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">🎬</span>
                  <div className="text-left">
                    <p className="text-white font-semibold">{genreLabel(cat.category)}</p>
                    <p className="text-gray-500 text-xs">{cat.count} movies rated</p>
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

  // ── Pick 5 movies ──
  if (step === "pick") {
    const count = selectedIds.size;

    const GENRE_FILTERS: { id: number; label: string }[] = [
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
    ];

    return (
      <div className="min-h-screen bg-[#0a0a1a] flex flex-col">
        <Header
          session={session}
          onSignOut={() => signOut()}
          onSwitch={() => { setSelectedMember(null); setStep("select-member"); }}
          memberName={selectedMember?.name}
        />

        <div className="flex-1 px-4 pt-4 pb-32 max-w-4xl mx-auto w-full">
          <div className="text-center mb-4">
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2">
              Pick 5 movies you love
            </h2>
            <p className="text-gray-500 text-sm">
              We&apos;ll figure out what you should watch next
            </p>
          </div>

          {/* Genre filter chips */}
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

          {loadingGrid ? (
            <div className="flex items-center justify-center py-20">
              <div className="text-gray-400">Loading movies...</div>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                {gridMovies.map((movie: Movie) => {
                  const isSelected = selectedIds.has(movie.id);
                  const isFull = count >= 5 && !isSelected;
                  return (
                    <button
                      key={movie.id}
                      onClick={() => toggleMovie(movie.id)}
                      disabled={isFull}
                      className={`relative group rounded-xl overflow-hidden transition-all duration-200 ${
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
                        <div className="absolute inset-0 bg-amber-400/20 flex items-center justify-center">
                          <div className="w-10 h-10 rounded-full bg-amber-400 flex items-center justify-center shadow-lg">
                            <svg className="w-6 h-6 text-gray-900" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                        </div>
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
                    </button>
                  );
                })}
              </div>

              {gridMovies.length === 0 && (
                <div className="text-center text-gray-500 py-12">
                  No movies in this genre yet. Try &quot;Show More&quot; to load more.
                </div>
              )}

              {/* Show More button */}
              <div className="mt-6 text-center">
                {showMoreCount < MAX_SHOW_MORE ? (
                  <button
                    onClick={handleShowMore}
                    disabled={loadingMore}
                    className="bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white font-medium px-6 py-2.5 rounded-full text-sm transition-all disabled:opacity-50"
                  >
                    {loadingMore ? "Loading..." : `Show More Movies (${MAX_SHOW_MORE - showMoreCount} left)`}
                  </button>
                ) : (
                  <p className="text-gray-600 text-sm">You&apos;ve loaded all available batches</p>
                )}
              </div>
            </>
          )}
        </div>

        {/* Bottom bar */}
        <div className="fixed bottom-0 left-0 right-0 bg-[#0a0a1a]/95 backdrop-blur-md border-t border-gray-800/50 px-4 py-4 z-50">
          <div className="max-w-4xl mx-auto flex items-center justify-between">
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
              <span className="text-gray-400 text-sm">{count} of 5</span>
            </div>

            <button
              onClick={handleGetRecommendations}
              disabled={count < 5}
              className={`px-6 py-2.5 rounded-full font-semibold text-sm transition-all ${
                count >= 5
                  ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-500 hover:to-pink-500 shadow-lg shadow-purple-500/25"
                  : "bg-gray-800 text-gray-600 cursor-not-allowed"
              }`}
            >
              Find My Movies
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Loading ──
  if (step === "loading") {
    return (
      <div className="min-h-screen bg-[#0a0a1a] flex flex-col items-center justify-center px-6">
        <div className="text-6xl mb-6 animate-bounce">🍿</div>
        <h2 className="text-xl font-bold text-white mb-2">Finding your perfect movies...</h2>
        <p className="text-gray-500 text-sm text-center max-w-sm">
          Analyzing your taste across {selectedIds.size} picks to find movies you&apos;ll love
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
          <div className="flex items-center justify-between mb-5 px-2">
            <div className="flex items-center gap-2">
              <span className="text-3xl">👈</span>
              <span className="text-red-400 font-bold">Nope</span>
            </div>
            <div className="text-center">
              <h2 className="text-xl font-bold text-white">Your Next Watch</h2>
              {activeCategory && activeCategory !== "for-you" && (
                <p className="text-purple-400 text-xs font-medium">{genreLabel(activeCategory)}</p>
              )}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-green-400 font-bold">Liked</span>
              <span className="text-3xl">👉</span>
            </div>
          </div>

          {error && (
            <div className="text-red-400 text-center mb-6">{error}</div>
          )}

          <div className="space-y-4">
            {recommendations.map((movie: Movie, i: number) => (
              <SwipeableCard
                key={movie.id}
                onSwipeLeft={() => handleSwipe(movie, "left")}
                onSwipeRight={() => handleSwipe(movie, "right")}
                isSwiping={swipingId === movie.id}
              >
                <FlippableCard movie={movie} index={i} />
              </SwipeableCard>
            ))}
          </div>

          {recommendations.length === 0 && !error && (
            <div className="text-center py-12">
              {fetchingMore ? (
                <>
                  <div className="text-3xl mb-3 animate-bounce">🍿</div>
                  <p className="text-gray-400">Finding more movies for you...</p>
                </>
              ) : (
                <button
                  onClick={fetchMoreRecs}
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

function FlippableCard({ movie, index }: { movie: Movie; index: number }) {
  const [flipped, setFlipped] = useState(false);
  const [details, setDetails] = useState<MovieDetails | null>(null);
  const fetchedRef = useRef(false);

  const handleTap = (e: React.MouseEvent | React.TouchEvent) => {
    if ("button" in e && e.button !== 0) return;
    setFlipped((f) => !f);

    if (!fetchedRef.current) {
      fetchedRef.current = true;
      fetch(`/api/movies/details?movieId=${movie.id}`)
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
              {movie.overview && (
                <p className="text-gray-400 mt-2 leading-relaxed line-clamp-3">
                  {movie.overview}
                </p>
              )}
            </div>
            <div className="flex items-center justify-between">
              {movie.providers?.flatrate && movie.providers.flatrate.length > 0 ? (
                <div className="flex items-center gap-2">
                  <span className="text-gray-500 text-xs">Stream</span>
                  {movie.providers.flatrate.slice(0, 4).map((p: { provider_id: number; provider_name: string; logo_path: string }) => (
                    <img
                      key={p.provider_id}
                      src={`${TMDB_IMG}/w45${p.logo_path}`}
                      alt={p.provider_name}
                      title={p.provider_name}
                      className="w-7 h-7 rounded"
                    />
                  ))}
                </div>
              ) : <div />}
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
              {details?.director && <><span>·</span><span>Dir. {details.director}</span></>}
              {details?.genres && details.genres.length > 0 && (
                <><span>·</span><span>{details.genres.join(", ")}</span></>
              )}
            </div>
            {details?.cast && details.cast.length > 0 && (
              <p className="text-xs text-gray-500 mt-1 line-clamp-1">
                {details.cast.map((c: { name: string }) => c.name).join(", ")}
              </p>
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
          <div className="px-4 py-2.5 border-t border-gray-800/50 flex items-center justify-between">
            {movie.providers?.flatrate && movie.providers.flatrate.length > 0 ? (
              <div className="flex items-center gap-1.5">
                <span className="text-gray-600 text-xs">Stream</span>
                {movie.providers.flatrate.slice(0, 4).map((p: { provider_id: number; provider_name: string; logo_path: string }) => (
                  <img
                    key={p.provider_id}
                    src={`${TMDB_IMG}/w45${p.logo_path}`}
                    alt={p.provider_name}
                    title={p.provider_name}
                    className="w-6 h-6 rounded"
                  />
                ))}
              </div>
            ) : <div />}
            <span className="text-purple-400 text-xs font-medium">← Tap to flip back</span>
          </div>
        </div>
      </div>
    </div>
  );
}
