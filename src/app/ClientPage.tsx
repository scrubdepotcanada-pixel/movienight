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

  const [step, setStep] = useState<"select-member" | "pick" | "loading" | "results">("select-member");
  const [gridMovies, setGridMovies] = useState<Movie[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [recommendations, setRecommendations] = useState<Movie[]>([]);
  const [recBuffer, setRecBuffer] = useState<Movie[]>([]);
  const [loadingGrid, setLoadingGrid] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [swipingId, setSwipingId] = useState<number | null>(null);

  useEffect(() => {
    if (status !== "authenticated" && !guestMode) return;
    fetch("/api/members").then((r) => r.json()).then(setMembers).catch(() => {});
  }, [status, guestMode]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [step]);

  const loadGrid = async () => {
    setLoadingGrid(true);
    try {
      const res = await fetch("/api/movies/popular-grid");
      const data = await res.json();
      setGridMovies(data.movies || []);
    } catch {
      setError("Couldn't load movies. Please try again.");
    }
    setLoadingGrid(false);
  };

  const handleSelectMember = (member: Member) => {
    setSelectedMember(member);
    setStep("pick");
    setSelectedIds(new Set());
    setRecommendations([]);
    loadGrid();
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

    try {
      const res = await fetch("/api/movies/for-you", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          movieTitles: titles,
          memberId: selectedMember?.id,
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
        if (prev.length === 0) return prev;
        const [replacement, ...rest] = prev;
        setRecommendations((recs: Movie[]) => [...recs, replacement]);
        return rest;
      });

      setSwipingId(null);
    }, 300);

    if (selectedMember) {
      if (direction === "right") {
        fetch("/api/movies/watched", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ memberId: selectedMember.id, movie, category: "for-you" }),
        }).catch(() => {});
      } else {
        fetch("/api/movies/dislike", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ memberId: selectedMember.id, movie, category: "for-you" }),
        }).catch(() => {});
      }
    }
  }, [selectedMember]);

  const handleStartOver = () => {
    setSelectedIds(new Set());
    setRecommendations([]);
    setStep("pick");
    loadGrid();
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

  // ── Pick 5 movies ──
  if (step === "pick") {
    const count = selectedIds.size;
    return (
      <div className="min-h-screen bg-[#0a0a1a] flex flex-col">
        <Header
          session={session}
          onSignOut={() => signOut()}
          onSwitch={() => { setSelectedMember(null); setStep("select-member"); }}
          memberName={selectedMember?.name}
        />

        <div className="flex-1 px-4 pt-4 pb-32 max-w-4xl mx-auto w-full">
          <div className="text-center mb-6">
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2">
              Pick 5 movies you love
            </h2>
            <p className="text-gray-500 text-sm">
              We&apos;ll figure out what you should watch next
            </p>
          </div>

          {loadingGrid ? (
            <div className="flex items-center justify-center py-20">
              <div className="text-gray-400">Loading movies...</div>
            </div>
          ) : (
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

        <div className="flex-1 px-4 pt-4 pb-8 max-w-2xl mx-auto w-full">
          <div className="text-center mb-6">
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2">
              Your Next Watch
            </h2>
            <p className="text-gray-500 text-sm">
              Swipe right = seen it &middot; Swipe left = not interested
            </p>
          </div>

          {error && (
            <div className="text-red-400 text-center mb-6">{error}</div>
          )}

          <div className="space-y-3">
            {recommendations.map((movie: Movie, i: number) => (
              <SwipeableCard
                key={movie.id}
                onSwipeLeft={() => handleSwipe(movie, "left")}
                onSwipeRight={() => handleSwipe(movie, "right")}
                isSwiping={swipingId === movie.id}
              >
                <div className="flex gap-4 bg-gray-900/60 rounded-2xl p-4 border border-gray-800/50">
                  <div className="relative shrink-0">
                    {i === 0 && (
                      <div className="absolute -top-2 left-1/2 -translate-x-1/2 bg-amber-500 text-gray-900 text-[10px] font-bold px-2 py-0.5 rounded-full z-10 whitespace-nowrap">
                        #1 Pick
                      </div>
                    )}
                    {movie.poster_path ? (
                      <img
                        src={posterUrl(movie.poster_path, "w185")}
                        alt={movie.title}
                        className="w-24 sm:w-28 rounded-xl"
                      />
                    ) : (
                      <div className="w-24 sm:w-28 aspect-[2/3] bg-gray-800 rounded-xl flex items-center justify-center text-gray-600 text-xs">
                        No poster
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <h3 className="text-white font-semibold text-lg leading-tight">
                      {movie.title}
                    </h3>
                    <div className="flex items-center gap-2 mt-1 text-sm">
                      <span className="text-gray-500">
                        {movie.release_date?.slice(0, 4)}
                      </span>
                      {movie.certification && movie.certification !== "NR" && (
                        <span className="text-gray-500 bg-gray-800 px-1.5 py-0.5 rounded text-xs">
                          {movie.certification}
                        </span>
                      )}
                      <span className="text-amber-400 font-medium">
                        {movie.vote_average?.toFixed(1)}
                      </span>
                    </div>

                    {movie.overview && (
                      <p className="text-gray-400 text-sm mt-2 line-clamp-3 leading-relaxed">
                        {movie.overview}
                      </p>
                    )}

                    {movie.providers?.flatrate && movie.providers.flatrate.length > 0 && (
                      <div className="flex items-center gap-1.5 mt-3">
                        <span className="text-gray-600 text-xs">Stream on</span>
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
                    )}
                  </div>
                </div>
              </SwipeableCard>
            ))}
          </div>

          {recommendations.length === 0 && !error && (
            <div className="text-center text-gray-500 py-12">
              No more recommendations. Try picking different movies!
            </div>
          )}

          <div className="mt-8 text-center">
            <button
              onClick={handleStartOver}
              className="bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold px-8 py-3 rounded-full hover:from-purple-500 hover:to-pink-500 transition shadow-lg shadow-purple-500/25"
            >
              Pick Again
            </button>
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
            Seen it
          </span>
        </div>
      )}
      {children}
    </div>
  );
}
