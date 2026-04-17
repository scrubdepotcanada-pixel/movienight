"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession, signIn, signOut } from "next-auth/react";
import SearchBar from "@/components/SearchBar";
import MovieCard from "@/components/MovieCard";
import MemberSelector from "@/components/MemberSelector";
import GenreSelector, { GENRES } from "@/components/GenreSelector";
import CategorySidebar from "@/components/CategorySidebar";
import LandingPage from "@/components/landing/LandingPage";

interface Movie {
  id: number;
  title: string;
  poster_path: string | null;
  vote_average: number;
  certification?: string;
  overview?: string;
}

interface Member {
  id: number;
  name: string;
  avatar: string;
  age?: number | null;
  max_rating?: string | null;
}

interface SidebarMovie {
  title: string;
  tmdb_id?: number;
}

type Step =
  | "select-member"
  | "search"
  | "pick-similar"
  | "recommendations"
  | "returning"
  | "all-members"
  | "category-recs"
  | "category-returning";

export default function Home() {
  const { data: session, status } = useSession();
  const [members, setMembers] = useState<Member[]>([]);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [viewingAll, setViewingAll] = useState(false);
  const [allMembersData, setAllMembersData] = useState<
    { member: Member; recommendations: Movie[] }[]
  >([]);

  const [step, setStep] = useState<Step>("select-member");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Search state
  const [searchResults, setSearchResults] = useState<Movie[]>([]);
  const [selectedSearchMovie, setSelectedSearchMovie] = useState<Movie | null>(null);

  // Similar movies state
  const [similarMovies, setSimilarMovies] = useState<Movie[]>([]);
  const [selectedSimilar, setSelectedSimilar] = useState<Movie | null>(null);

  // Recommendations state
  const [recommendations, setRecommendations] = useState<Movie[]>([]);
  const [watchedSelection, setWatchedSelection] = useState<Set<number>>(new Set());
  const [dislikeLoadingId, setDislikeLoadingId] = useState<number | null>(null);
  const [likeLoadingId, setLikeLoadingId] = useState<number | null>(null);

  // Category state
  const [activeCategory, setActiveCategory] = useState<string>("general");
  const [categoryLiked, setCategoryLiked] = useState<SidebarMovie[]>([]);
  const [categoryDisliked, setCategoryDisliked] = useState<SidebarMovie[]>([]);
  const [activeCategories, setActiveCategories] = useState<{ category: string; count: number }[]>([]);

  // Load members only when signed in
  useEffect(() => {
    if (status !== "authenticated") return;
    fetch("/api/members")
      .then((r) => r.json())
      .then(setMembers)
      .catch(console.error);
  }, [status]);

  // Top up recommendations to 5 if some were lost to dedup/filtering
  const topUpRecommendations = useCallback(async (currentRecs: Movie[], memberId: number, category: string) => {
    const missing = 5 - currentRecs.length;
    if (missing <= 0) return currentRecs;

    try {
      const res = await fetch("/api/movies/refresh", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ memberId, count: missing, category }),
      });
      const extras = await res.json();
      if (Array.isArray(extras) && extras.length > 0) {
        return [...currentRecs, ...extras];
      }
    } catch (err) {
      console.error(err);
    }
    return currentRecs;
  }, []);

  const loadCategoryHistory = useCallback(async (memberId: number, category: string) => {
    try {
      const res = await fetch(`/api/session?memberId=${memberId}&category=${encodeURIComponent(category)}`);
      const data = await res.json();
      setCategoryLiked((data.likedInCategory || []).map((r: Record<string, unknown>) => ({ title: String(r.title) })));
      setCategoryDisliked((data.dislikedInCategory || []).map((r: Record<string, unknown>) => ({ title: String(r.title), tmdb_id: Number(r.tmdb_id) })));
    } catch {
      setCategoryLiked([]);
      setCategoryDisliked([]);
    }
  }, []);

  const loadMemberSession = useCallback(async (member: Member) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/session?memberId=${member.id}`);
      const data = await res.json();

      if (data.hasHistory && data.activeRecommendations.length > 0) {
        const recs = data.activeRecommendations.map((r: Record<string, unknown>) => ({
          id: Number(r.tmdb_id),
          title: r.title as string,
          poster_path: r.poster_path as string | null,
          vote_average: Number(r.vote_average),
          certification: r.certification as string,
          overview: r.overview as string,
        }));
        setActiveCategory("general");
        await loadCategoryHistory(member.id, "general");
        const filled = await topUpRecommendations(recs, member.id, "general");
        setRecommendations(filled);
        setStep("returning");
      } else {
        // Fetch active categories for "continue where you left off"
        try {
          const catRes = await fetch(`/api/session/categories?memberId=${member.id}`);
          const cats = await catRes.json();
          setActiveCategories(Array.isArray(cats) ? cats.map((c: Record<string, unknown>) => ({ category: String(c.category), count: Number(c.count) })) : []);
        } catch {
          setActiveCategories([]);
        }
        setStep("search");
      }
    } catch (err) {
      console.error(err);
      setStep("search");
    }
    setLoading(false);
  }, [loadCategoryHistory, topUpRecommendations]);

  const handleSelectMember = (member: Member) => {
    setSelectedMember(member);
    setViewingAll(false);
    setWatchedSelection(new Set());
    setSearchResults([]);
    setSimilarMovies([]);
    setSelectedSearchMovie(null);
    setSelectedSimilar(null);
    setActiveCategory("general");
    setCategoryLiked([]);
    setCategoryDisliked([]);
    loadMemberSession(member);
  };

  const handleViewAll = async () => {
    setViewingAll(true);
    setSelectedMember(null);
    setStep("all-members");
    setLoading(true);

    try {
      const data = await Promise.all(
        members.map(async (member) => {
          const res = await fetch(`/api/session?memberId=${member.id}`);
          const session = await res.json();
          const recs = (session.activeRecommendations || []).map((r: Record<string, unknown>) => ({
            id: Number(r.tmdb_id),
            title: r.title as string,
            poster_path: r.poster_path as string | null,
            vote_average: Number(r.vote_average),
            certification: r.certification as string,
            overview: r.overview as string,
          }));
          return { member, recommendations: recs };
        })
      );
      setAllMembersData(data);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const handleAddMember = async (name: string, avatar: string, age: number | null, maxRating: string) => {
    try {
      const res = await fetch("/api/members", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, avatar, age, maxRating }),
      });
      const member = await res.json();
      setMembers((prev) => [...prev, member]);
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateMember = async (memberId: number, updates: { age?: number | null; maxRating?: string }) => {
    try {
      const res = await fetch("/api/members", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ memberId, ...updates }),
      });
      const updated = await res.json();
      setMembers((prev) => prev.map((m) => (m.id === memberId ? updated : m)));
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteMember = async (memberId: number) => {
    try {
      await fetch("/api/members", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ memberId }),
      });
      setMembers((prev) => prev.filter((m) => m.id !== memberId));
      if (selectedMember?.id === memberId) {
        setSelectedMember(null);
        setStep("select-member");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSearch = async (query: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/movies/search?q=${encodeURIComponent(query)}`);
      const data = await res.json();
      setSearchResults(data);
      setSelectedSearchMovie(null);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const handlePickSearchMovie = async (movie: Movie) => {
    setSelectedSearchMovie(movie);
    setLoading(true);
    try {
      const res = await fetch(
        `/api/movies/similar?movieTitle=${encodeURIComponent(movie.title)}&memberId=${selectedMember!.id}`
      );
      const data = await res.json();
      setSimilarMovies(data);
      setStep("pick-similar");
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const handlePickSimilar = async (movie: Movie) => {
    setSelectedSimilar(movie);
    setLoading(true);
    setActiveCategory("general");
    try {
      const res = await fetch(
        `/api/movies/recommendations?likedMovie1=${encodeURIComponent(selectedSearchMovie!.title)}&likedMovie2=${encodeURIComponent(movie.title)}&memberId=${selectedMember!.id}&category=general`
      );
      const data = await res.json();
      setRecommendations(data.movies);
      setWatchedSelection(new Set());
      await loadCategoryHistory(selectedMember!.id, "general");
      setStep("recommendations");
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  // Category selection
  const handleSelectCategory = async (genreId: string) => {
    setActiveCategory(genreId);
    setLoading(true);
    setError(null);
    setCategoryLiked([]);
    setCategoryDisliked([]);

    try {
      // Check if there are existing recs for this category
      const sessionRes = await fetch(
        `/api/session?memberId=${selectedMember!.id}&category=${encodeURIComponent(genreId)}`
      );

      if (!sessionRes.ok) {
        throw new Error(`Session failed: ${sessionRes.status}`);
      }

      const sessionData = await sessionRes.json();

      if (sessionData.hasHistory && sessionData.activeRecommendations.length > 0) {
        const recs = sessionData.activeRecommendations.map((r: Record<string, unknown>) => ({
          id: Number(r.tmdb_id),
          title: r.title as string,
          poster_path: r.poster_path as string | null,
          vote_average: Number(r.vote_average),
          certification: r.certification as string,
          overview: r.overview as string,
        }));
        setCategoryLiked((sessionData.likedInCategory || []).map((r: Record<string, unknown>) => ({ title: String(r.title) })));
        setCategoryDisliked((sessionData.dislikedInCategory || []).map((r: Record<string, unknown>) => ({ title: String(r.title), tmdb_id: Number(r.tmdb_id) })));
        // Top up to 5 if dedup/filtering removed some
        const filled = await topUpRecommendations(recs, selectedMember!.id, genreId);
        setRecommendations(filled);
        setWatchedSelection(new Set());
        setStep("category-returning");
      } else {
        // Fresh category — get new recommendations
        const res = await fetch(
          `/api/movies/category?category=${encodeURIComponent(genreId)}&memberId=${selectedMember!.id}`
        );

        if (!res.ok) {
          throw new Error(`Category fetch failed: ${res.status}`);
        }

        const data = await res.json();
        setRecommendations(data.movies || []);
        setWatchedSelection(new Set());
        setStep("category-recs");
      }
    } catch (err) {
      console.error(err);
      setError("Failed to load recommendations. Check that your API keys are configured in Vercel.");
    }
    setLoading(false);
  };

  // Click a card → flip to watched → auto-replace after flip animation
  const handleWatched = async (movie: Movie) => {
    // 1. Immediately flip the card
    setWatchedSelection((prev) => {
      const next = new Set(prev);
      next.add(movie.id);
      return next;
    });

    try {
      // 2. Fire off the API call - it returns a replacement movie
      const res = await fetch("/api/movies/watched", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          memberId: selectedMember!.id,
          movie,
          category: activeCategory,
        }),
      });
      const data = await res.json();

      // 3. Wait for flip animation (700ms), then replace the card
      setTimeout(() => {
        setRecommendations((prev) => {
          const idx = prev.findIndex((m) => m.id === movie.id);
          if (idx === -1) return prev;
          const next = [...prev];
          if (data.replacement) {
            next[idx] = data.replacement;
          } else {
            next.splice(idx, 1);
          }
          return next;
        });
        setWatchedSelection((prev) => {
          const next = new Set(prev);
          next.delete(movie.id);
          return next;
        });
      }, 800);
    } catch (err) {
      console.error(err);
      // Revert flip on error
      setWatchedSelection((prev) => {
        const next = new Set(prev);
        next.delete(movie.id);
        return next;
      });
    }
  };

  const handleLike = async (movie: Movie) => {
    setLikeLoadingId(movie.id);
    try {
      const res = await fetch("/api/movies/like", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          memberId: selectedMember!.id,
          movie,
          category: activeCategory,
        }),
      });
      const data = await res.json();

      // Replace the liked movie with a new suggestion
      setRecommendations((prev) => {
        const idx = prev.findIndex((m) => m.id === movie.id);
        if (idx === -1) return prev;
        const next = [...prev];
        if (data.replacement) {
          next[idx] = data.replacement;
        } else {
          next.splice(idx, 1);
        }
        return next;
      });

      // Update sidebar
      setCategoryLiked((prev) => [...prev, { title: movie.title }]);

      // Refresh sidebar from server
      if (selectedMember) {
        loadCategoryHistory(selectedMember.id, activeCategory);
      }
    } catch (err) {
      console.error(err);
    }
    setLikeLoadingId(null);
  };

  const handleDislike = async (movie: Movie) => {
    setDislikeLoadingId(movie.id);
    try {
      const res = await fetch("/api/movies/dislike", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          memberId: selectedMember!.id,
          movie,
          category: activeCategory,
        }),
      });
      const data = await res.json();

      setRecommendations((prev) => {
        const updated = prev.filter((m) => m.id !== movie.id);
        if (data.replacement) {
          updated.push(data.replacement);
        }
        return updated;
      });

      // Update sidebar
      setCategoryDisliked((prev) => [...prev, { title: movie.title, tmdb_id: movie.id }]);

      // Refresh sidebar history
      if (selectedMember) {
        loadCategoryHistory(selectedMember.id, activeCategory);
      }
    } catch (err) {
      console.error(err);
    }
    setDislikeLoadingId(null);
  };

  const handleStartFresh = () => {
    setSearchResults([]);
    setSimilarMovies([]);
    setSelectedSearchMovie(null);
    setSelectedSimilar(null);
    setRecommendations([]);
    setWatchedSelection(new Set());
    setActiveCategory("general");
    setCategoryLiked([]);
    setCategoryDisliked([]);
    setStep("search");
  };

  const handleRemoveLike = async (title: string) => {
    setCategoryLiked((prev) => prev.filter((m) => m.title !== title));
    try {
      await fetch("/api/movies/like", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          memberId: selectedMember!.id,
          movieTitle: title,
          category: activeCategory,
        }),
      });
    } catch (err) {
      console.error(err);
    }
  };

  const handleRemoveDislike = async (tmdbId: number) => {
    setCategoryDisliked((prev) => prev.filter((m) => m.tmdb_id !== tmdbId));
    try {
      await fetch("/api/movies/dislike", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          memberId: selectedMember!.id,
          tmdbId,
          category: activeCategory,
        }),
      });
    } catch (err) {
      console.error(err);
    }
  };

  const genreLabel = GENRES.find((g) => g.id === activeCategory)?.label || activeCategory;
  const genreIcon = GENRES.find((g) => g.id === activeCategory)?.icon || "";
  const isCategoryStep = step === "category-recs" || step === "category-returning";
  const sidebarLabel = activeCategory === "general" ? "Your" : genreLabel;
  const showSidebar = categoryLiked.length > 0 || categoryDisliked.length > 0;

  // Shared recommendation grid used in multiple steps
  const renderRecommendationGrid = () => (
    <div className="max-w-6xl mx-auto">
      {/* History tags above the cards */}
      {showSidebar && (
        <div className="mb-6">
          <CategorySidebar
            category={sidebarLabel}
            likedMovies={categoryLiked}
            dislikedMovies={categoryDisliked}
            onRemoveLike={handleRemoveLike}
            onRemoveDislike={handleRemoveDislike}
          />
        </div>
      )}

      {/* Movie row - fixed size cards in a grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
        {recommendations.map((movie) => (
          <MovieCard
            key={movie.id}
            movie={movie}
            watched={watchedSelection.has(movie.id)}
            liked={categoryLiked.some((m) => m.title === movie.title)}
            onClick={() => handleWatched(movie)}
            showLike
            onLike={() => handleLike(movie)}
            likeLoading={likeLoadingId === movie.id}
            showDislike
            onDislike={() => handleDislike(movie)}
            dislikeLoading={dislikeLoadingId === movie.id}
          />
        ))}
      </div>
    </div>
  );

  // Loading state
  if (status === "loading") {
    return (
      <main className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-purple-950 text-white flex items-center justify-center">
        <div className="w-12 h-12 rounded-full border-4 border-gray-700 border-t-purple-500 animate-spin" />
      </main>
    );
  }

  // Not signed in — show landing page
  if (!session) {
    return <LandingPage onSignIn={() => signIn("google")} />;
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-purple-950 text-white">
      {/* Header */}
      <header className="border-b border-gray-800/50 bg-black/20 backdrop-blur sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <button onClick={() => { setStep("select-member"); setSelectedMember(null); setViewingAll(false); }}>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              Next Movie
            </h1>
          </button>
          <div className="flex items-center gap-3">
            {isCategoryStep && (
              <button
                onClick={handleStartFresh}
                className="text-xs bg-gray-800 hover:bg-gray-700 text-gray-300 px-3 py-1.5 rounded-lg transition-colors"
              >
                Change category
              </button>
            )}
            {selectedMember && (
              <div className="flex items-center gap-2 text-sm text-gray-300">
                <span className="text-xl">{selectedMember.avatar}</span>
                <span>{selectedMember.name}</span>
                {(() => {
                  const r = selectedMember.max_rating || (selectedMember.age != null ? (selectedMember.age < 7 ? "G" : selectedMember.age < 10 ? "PG" : selectedMember.age < 14 ? "PG-13" : selectedMember.age < 17 ? "R" : "ALL") : "ALL");
                  const color = r === "G" ? "bg-green-600" : r === "PG" ? "bg-blue-600" : r === "PG-13" ? "bg-yellow-600" : r === "R" ? "bg-red-600" : "bg-purple-600";
                  const label = r === "ALL" ? "All Ratings" : `Rated ${r}`;
                  return (
                    <span className={`${color} text-white text-[11px] font-bold px-2 py-0.5 rounded-full`}>
                      {label}
                    </span>
                  );
                })()}
                <button
                  onClick={() => { setStep("select-member"); setSelectedMember(null); }}
                  className="ml-1 text-purple-400 hover:text-purple-300 underline text-xs"
                >
                  Switch
                </button>
              </div>
            )}
            {session.user?.image && (
              <img
                src={session.user.image}
                alt=""
                className="w-7 h-7 rounded-full"
              />
            )}
            <button
              onClick={() => signOut()}
              className="text-xs text-gray-400 hover:text-white underline"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Error banner */}
        {error && (
          <div className="mb-6 bg-red-900/50 border border-red-700 rounded-xl p-4 flex items-center justify-between">
            <p className="text-red-200 text-sm">{error}</p>
            <button onClick={() => setError(null)} className="text-red-400 hover:text-red-300 ml-4 text-lg">&times;</button>
          </div>
        )}

        {/* STEP: Select Member */}
        {step === "select-member" && (
          <div className="pt-8 sm:pt-16">
            {/* Hero area */}
            <div className="relative text-center mb-16">
              <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-3xl" />
                <div className="absolute top-20 left-1/3 w-[300px] h-[300px] bg-pink-600/8 rounded-full blur-3xl" />
              </div>
              <div className="relative">
                <div className="text-5xl mb-4">🎬</div>
                <h2 className="text-4xl sm:text-5xl font-bold mb-4">
                  <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">Who&apos;s watching</span> tonight?
                </h2>
                <p className="text-gray-400 text-lg max-w-md mx-auto">
                  Pick your profile for personalized picks — or add a family member
                </p>
              </div>
            </div>
            <MemberSelector
              members={members}
              selectedMember={selectedMember}
              onSelect={handleSelectMember}
              onAdd={handleAddMember}
              onDelete={handleDeleteMember}
              onUpdateMember={handleUpdateMember}
              viewingAll={viewingAll}
              onViewAll={handleViewAll}
            />
          </div>
        )}

        {/* STEP: Search */}
        {step === "search" && selectedMember && (
          <div className="pt-8">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold mb-2">
                Hey {selectedMember.name}! {selectedMember.avatar}
              </h2>
              <p className="text-gray-400">Tell us a movie you love and we&apos;ll find your next watch</p>
            </div>

            <SearchBar onSearch={handleSearch} loading={loading} />

            {searchResults.length > 0 && (
              <div className="mt-8">
                <h3 className="text-lg font-medium text-gray-300 mb-4">Select the movie you mean:</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {searchResults.map((movie) => (
                    <MovieCard
                      key={movie.id}
                      movie={movie}
                      selected={selectedSearchMovie?.id === movie.id}
                      onClick={() => handlePickSearchMovie(movie)}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Continue where you left off */}
            {activeCategories.length > 0 && (
              <div className="mt-10 max-w-3xl mx-auto">
                <h3 className="text-center text-gray-400 text-sm mb-4">Continue where you left off</h3>
                <div className="flex flex-wrap justify-center gap-3">
                  {activeCategories.map(({ category, count }) => {
                    const genre = GENRES.find((g) => g.id === category);
                    if (!genre) return null;
                    return (
                      <button
                        key={category}
                        onClick={() => handleSelectCategory(category)}
                        disabled={loading}
                        className="flex items-center gap-2 bg-purple-600/20 hover:bg-purple-600/40 border border-purple-500/40 hover:border-purple-500 text-white px-5 py-3 rounded-xl transition-all hover:scale-105 disabled:opacity-50"
                      >
                        <span className="text-xl">{genre.icon}</span>
                        <span className="font-medium">{genre.label}</span>
                        <span className="text-purple-300 text-xs bg-purple-500/30 px-2 py-0.5 rounded-full">{count} picks</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="mt-10">
              <GenreSelector onSelect={handleSelectCategory} loading={loading} />
            </div>

            {loading && (
              <div className="mt-8">
                <LoadingSpinner />
              </div>
            )}
          </div>
        )}

        {/* STEP: Pick Similar */}
        {step === "pick-similar" && selectedMember && (
          <div className="pt-8">
            <div className="text-center mb-8">
              <p className="text-gray-400 mb-1">
                You liked <span className="text-purple-400 font-medium">{selectedSearchMovie?.title}</span>
              </p>
              <h2 className="text-3xl font-bold mb-2">Which of these do you also like?</h2>
              <p className="text-gray-500 text-sm">Pick one to refine your taste</p>
            </div>

            {loading ? (
              <LoadingSpinner />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-3xl mx-auto">
                {similarMovies.map((movie) => (
                  <MovieCard
                    key={movie.id}
                    movie={movie}
                    selected={selectedSimilar?.id === movie.id}
                    onClick={() => handlePickSimilar(movie)}
                  />
                ))}
              </div>
            )}

            <div className="text-center mt-6">
              <button
                onClick={handleStartFresh}
                className="text-gray-400 hover:text-white text-sm underline"
              >
                Start over with a different movie
              </button>
            </div>
          </div>
        )}

        {/* STEP: Recommendations (general) */}
        {step === "recommendations" && selectedMember && (
          <div className="pt-8">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold mb-2">Your Top Picks</h2>
              <p className="text-gray-400">
              </p>
              <div className="flex items-center justify-center gap-6 mt-3 text-sm">
                <span className="flex items-center gap-1.5 text-gray-400"><span className="bg-green-600 rounded-full w-7 h-7 flex items-center justify-center text-white text-xs">👍</span> Like = more like this</span>
                <span className="flex items-center gap-1.5 text-gray-400"><span className="bg-red-600 rounded-full w-7 h-7 flex items-center justify-center text-white text-xs">👎</span> Dislike = replace it</span>
                <span className="flex items-center gap-1.5 text-gray-400"><span className="bg-purple-600 rounded-full w-7 h-7 flex items-center justify-center text-white text-xs">👆</span> Tap card = watched</span>
              </div>
            </div>

            {loading ? (
              <LoadingSpinner />
            ) : (
              <>
                {renderRecommendationGrid()}

                <div className="flex flex-col items-center gap-4 mt-8">
                  <button
                    onClick={handleStartFresh}
                    className="text-gray-400 hover:text-white text-sm underline"
                  >
                    Start over with a different movie
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {/* STEP: Category Recommendations */}
        {step === "category-recs" && selectedMember && (
          <div className="pt-8">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold mb-2">
                {genreIcon} Top {genreLabel} Picks
              </h2>
              <p className="text-gray-400">
                Like, dislike, or tap to mark watched
              </p>
            </div>

            {loading ? (
              <LoadingSpinner />
            ) : (
              <>
                {renderRecommendationGrid()}

                <div className="flex flex-col items-center gap-4 mt-8">
                  <button
                    onClick={handleStartFresh}
                    className="text-gray-400 hover:text-white text-sm underline"
                  >
                    Browse a different category
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {/* STEP: Returning User (general) */}
        {step === "returning" && selectedMember && (
          <div className="pt-8">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold mb-2">
                Welcome back, {selectedMember.name}! {selectedMember.avatar}
              </h2>
              <p className="text-gray-400">
                Like, dislike, or tap to mark watched
              </p>
            </div>

            {loading ? (
              <LoadingSpinner />
            ) : (
              <>
                {renderRecommendationGrid()}

                <div className="flex flex-col items-center gap-4 mt-8">
                  <button
                    onClick={handleStartFresh}
                    className="text-gray-400 hover:text-white text-sm underline"
                  >
                    Start fresh with a new movie
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {/* STEP: Category Returning */}
        {step === "category-returning" && selectedMember && (
          <div className="pt-8">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold mb-2">
                {genreIcon} Your {genreLabel} List
              </h2>
              <p className="text-gray-400">
                Like, dislike, or tap to mark watched
              </p>
            </div>

            {loading ? (
              <LoadingSpinner />
            ) : (
              <>
                {renderRecommendationGrid()}

                <div className="flex flex-col items-center gap-4 mt-8">
                  <button
                    onClick={handleStartFresh}
                    className="text-gray-400 hover:text-white text-sm underline"
                  >
                    Browse a different category
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {/* STEP: All Members View */}
        {step === "all-members" && (
          <div className="pt-8">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold mb-2">Family Movie Board</h2>
              <p className="text-gray-400">See what everyone is watching</p>
            </div>

            {loading ? (
              <LoadingSpinner />
            ) : (
              <div className="space-y-10">
                {allMembersData.map(({ member, recommendations: recs }) => (
                  <div key={member.id}>
                    <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                      <span className="text-2xl">{member.avatar}</span>
                      {member.name}&apos;s Picks
                    </h3>
                    {recs.length > 0 ? (
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
                        {recs.map((movie) => (
                          <MovieCard key={movie.id} movie={movie} />
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500 italic">
                        No recommendations yet — {member.name} needs to search for a movie first!
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}

            <div className="text-center mt-8">
              <button
                onClick={() => { setStep("select-member"); setViewingAll(false); }}
                className="text-purple-400 hover:text-purple-300 underline"
              >
                Back to member selection
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

function LoadingSpinner() {
  return (
    <div className="flex justify-center py-12">
      <div className="relative">
        <div className="w-12 h-12 rounded-full border-4 border-gray-700 border-t-purple-500 animate-spin" />
      </div>
    </div>
  );
}
