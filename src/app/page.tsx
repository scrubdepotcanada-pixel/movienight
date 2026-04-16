"use client";

import { useState, useEffect, useCallback } from "react";
import SearchBar from "@/components/SearchBar";
import MovieCard from "@/components/MovieCard";
import MemberSelector from "@/components/MemberSelector";
import GenreSelector, { GENRES } from "@/components/GenreSelector";
import CategorySidebar from "@/components/CategorySidebar";

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

  // Category state
  const [activeCategory, setActiveCategory] = useState<string>("general");
  const [categoryLiked, setCategoryLiked] = useState<SidebarMovie[]>([]);
  const [categoryDisliked, setCategoryDisliked] = useState<SidebarMovie[]>([]);

  // Load members on mount
  useEffect(() => {
    fetch("/api/members")
      .then((r) => r.json())
      .then(setMembers)
      .catch(console.error);
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
        setRecommendations(recs);
        setActiveCategory("general");
        setStep("returning");
      } else {
        setStep("search");
      }
    } catch (err) {
      console.error(err);
      setStep("search");
    }
    setLoading(false);
  }, []);

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

  const handleAddMember = async (name: string, avatar: string) => {
    try {
      const res = await fetch("/api/members", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, avatar }),
      });
      const member = await res.json();
      setMembers((prev) => [...prev, member]);
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
        setRecommendations(recs);
        setCategoryLiked((sessionData.likedInCategory || []).map((r: Record<string, unknown>) => ({ title: String(r.title) })));
        setCategoryDisliked((sessionData.dislikedInCategory || []).map((r: Record<string, unknown>) => ({ title: String(r.title), tmdb_id: Number(r.tmdb_id) })));
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

  const toggleWatched = (movieId: number) => {
    setWatchedSelection((prev) => {
      const next = new Set(prev);
      if (next.has(movieId)) next.delete(movieId);
      else next.add(movieId);
      return next;
    });
  };

  const handleSubmitWatched = async () => {
    if (watchedSelection.size === 0) return;
    setLoading(true);

    const watchedMovies = recommendations.filter((m) => watchedSelection.has(m.id));

    try {
      await fetch("/api/movies/watched", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          memberId: selectedMember!.id,
          movies: watchedMovies,
        }),
      });

      const res = await fetch("/api/movies/refresh", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          memberId: selectedMember!.id,
          count: watchedSelection.size,
          category: activeCategory,
        }),
      });
      const replacements = await res.json();

      const remaining = recommendations.filter((m) => !watchedSelection.has(m.id));
      setRecommendations([...remaining, ...replacements]);
      setWatchedSelection(new Set());
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const handleReturningWatched = async () => {
    if (watchedSelection.size === 0) {
      setStep(activeCategory !== "general" ? "category-recs" : "recommendations");
      return;
    }
    await handleSubmitWatched();
    setStep(activeCategory !== "general" ? "category-recs" : "recommendations");
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

  const genreLabel = GENRES.find((g) => g.id === activeCategory)?.label || activeCategory;
  const genreIcon = GENRES.find((g) => g.id === activeCategory)?.icon || "";
  const isCategoryStep = step === "category-recs" || step === "category-returning";

  // Shared recommendation grid used in multiple steps
  const renderRecommendationGrid = () => (
    <div className={`flex gap-6 ${isCategoryStep ? "" : "justify-center"}`}>
      {/* Sidebar for category views */}
      {isCategoryStep && (
        <div className="hidden lg:block w-56 flex-shrink-0">
          <CategorySidebar
            category={genreLabel}
            likedMovies={categoryLiked}
            dislikedMovies={categoryDisliked}
          />
        </div>
      )}

      {/* Movie grid */}
      <div className="flex-1 max-w-5xl">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
          {recommendations.map((movie) => (
            <MovieCard
              key={movie.id}
              movie={movie}
              watched={watchedSelection.has(movie.id)}
              onClick={() => toggleWatched(movie.id)}
              showWatchedToggle
              onWatchedToggle={() => toggleWatched(movie.id)}
              showDislike
              onDislike={() => handleDislike(movie)}
              dislikeLoading={dislikeLoadingId === movie.id}
            />
          ))}
        </div>

        {/* Mobile sidebar */}
        {isCategoryStep && (categoryLiked.length > 0 || categoryDisliked.length > 0) && (
          <div className="mt-6 lg:hidden">
            <CategorySidebar
              category={genreLabel}
              likedMovies={categoryLiked}
              dislikedMovies={categoryDisliked}
            />
          </div>
        )}
      </div>
    </div>
  );

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-purple-950 text-white">
      {/* Header */}
      <header className="border-b border-gray-800/50 bg-black/20 backdrop-blur sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <button onClick={() => { setStep("select-member"); setSelectedMember(null); setViewingAll(false); }}>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              MovieNight
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
                <button
                  onClick={() => { setStep("select-member"); setSelectedMember(null); }}
                  className="ml-2 text-purple-400 hover:text-purple-300 underline text-xs"
                >
                  Switch
                </button>
              </div>
            )}
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
          <div className="pt-12">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold mb-3">Welcome to MovieNight</h2>
              <p className="text-gray-400 text-lg">Pick your profile to get personalized recommendations</p>
            </div>
            <MemberSelector
              members={members}
              selectedMember={selectedMember}
              onSelect={handleSelectMember}
              onAdd={handleAddMember}
              onDelete={handleDeleteMember}
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
                Mark watched or dislike to get better suggestions
              </p>
            </div>

            {loading ? (
              <LoadingSpinner />
            ) : (
              <>
                {renderRecommendationGrid()}

                <div className="flex flex-col items-center gap-4 mt-8">
                  {watchedSelection.size > 0 && (
                    <button
                      onClick={handleSubmitWatched}
                      className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-3 rounded-xl font-medium text-lg transition-colors"
                    >
                      I&apos;ve watched {watchedSelection.size} — suggest replacements
                    </button>
                  )}
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
                Mark watched or dislike to get better {genreLabel.toLowerCase()} suggestions
              </p>
            </div>

            {loading ? (
              <LoadingSpinner />
            ) : (
              <>
                {renderRecommendationGrid()}

                <div className="flex flex-col items-center gap-4 mt-8">
                  {watchedSelection.size > 0 && (
                    <button
                      onClick={handleSubmitWatched}
                      className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-3 rounded-xl font-medium text-lg transition-colors"
                    >
                      I&apos;ve watched {watchedSelection.size} — suggest replacements
                    </button>
                  )}
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
                Did you watch any of these? Tap the ones you&apos;ve seen.
              </p>
            </div>

            {loading ? (
              <LoadingSpinner />
            ) : (
              <>
                {renderRecommendationGrid()}

                <div className="flex flex-col items-center gap-4 mt-8">
                  <button
                    onClick={handleReturningWatched}
                    className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-3 rounded-xl font-medium text-lg transition-colors"
                  >
                    {watchedSelection.size > 0
                      ? `I watched ${watchedSelection.size} — update my list`
                      : "I haven't watched any yet"}
                  </button>
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
                Did you watch any of these? Tap the ones you&apos;ve seen.
              </p>
            </div>

            {loading ? (
              <LoadingSpinner />
            ) : (
              <>
                {renderRecommendationGrid()}

                <div className="flex flex-col items-center gap-4 mt-8">
                  <button
                    onClick={handleReturningWatched}
                    className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-3 rounded-xl font-medium text-lg transition-colors"
                  >
                    {watchedSelection.size > 0
                      ? `I watched ${watchedSelection.size} — update my list`
                      : "I haven't watched any yet"}
                  </button>
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
