"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession, signIn, signOut } from "next-auth/react";
import SearchBar from "@/components/SearchBar";
import MovieCard from "@/components/MovieCard";
import MemberSelector from "@/components/MemberSelector";
import GenreSelector, { GENRES } from "@/components/GenreSelector";
import CategorySidebar from "@/components/CategorySidebar";
import ContentTypeToggle from "@/components/ContentTypeToggle";
import MoodSearch from "@/components/MoodSearch";
import SwipeFlow from "@/components/SwipeFlow";
import SwipeResults from "@/components/SwipeResults";
import InlineFilters from "@/components/InlineFilters";
import PremiumModal from "@/components/PremiumModal";
import PremiumMenu from "@/components/PremiumMenu";
import TasteProfile from "@/components/TasteProfile";
import Watchlist from "@/components/Watchlist";
import AdvancedFilters from "@/components/AdvancedFilters";
import PersonFilmography from "@/components/PersonFilmography";
import { useLocale } from "@/lib/i18n";
import LandingPage from "@/components/landing/LandingPage";

interface Movie {
  id: number;
  title: string;
  poster_path: string | null;
  vote_average: number;
  certification?: string;
  overview?: string;
  release_date?: string;
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
  | "recommendations"
  | "returning"
  | "all-members"
  | "category-recs"
  | "category-returning"
  | "swipe-setup"
  | "swiping"
  | "swipe-results";

export default function ClientPage() {
  const { data: session, status } = useSession();
  const { locale, dir } = useLocale();
  const [guestMode, setGuestMode] = useState(false);
  const [members, setMembers] = useState<Member[]>([]);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [viewingAll, setViewingAll] = useState(false);
  const [allMembersData, setAllMembersData] = useState<
    { member: Member; recommendations: Movie[] }[]
  >([]);

  const [step, setStep] = useState<Step>("select-member");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Scroll to top on step change or entering the app
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [step, guestMode, status]);

  // Search state
  const [searchResults, setSearchResults] = useState<Movie[]>([]);
  const [searchTab, setSearchTab] = useState<"search" | "mood" | "category">("search");
  const [selectedSearchId, setSelectedSearchId] = useState<number | null>(null);

  // Recommendations state
  const [recommendations, setRecommendations] = useState<Movie[]>([]);
  const [watchedSelection, setWatchedSelection] = useState<Set<number>>(new Set());
  const [dislikeLoadingId, setDislikeLoadingId] = useState<number | null>(null);
  const [likeLoadingId, setLikeLoadingId] = useState<number | null>(null);
  const [passLoadingId, setPassLoadingId] = useState<number | null>(null);

  // Category state
  const [activeCategory, setActiveCategory] = useState<string>("general");
  const [categoryLiked, setCategoryLiked] = useState<SidebarMovie[]>([]);
  const [categoryDisliked, setCategoryDisliked] = useState<SidebarMovie[]>([]);
  const [activeCategories, setActiveCategories] = useState<{ category: string; count: number }[]>([]);

  // Content type state (movies vs shows)
  const [contentType, setContentType] = useState<"movie" | "show">("movie");

  // Premium state
  const [isPremium, setIsPremium] = useState(false);
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [premiumFeature, setPremiumFeature] = useState<string>("");
  const [showTasteProfile, setShowTasteProfile] = useState(false);
  const [showWatchlist, setShowWatchlist] = useState(false);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [filmographyPerson, setFilmographyPerson] = useState<{ id: number; name: string; role: string } | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [activeFilters, setActiveFilters] = useState<{
    genre?: string; decade?: string; minRating?: number; maxRuntime?: number;
    providerId?: number; providerName?: string; region?: string;
    personId?: number; personName?: string;
    language?: string; languageName?: string;
  }>({});

  const [watchlistIds, setWatchlistIds] = useState<Set<number>>(new Set());

  // Swipe state
  const [swipeSessionId, setSwipeSessionId] = useState<string | null>(null);
  const [swipeCandidates, setSwipeCandidates] = useState<Movie[]>([]);
  const [swipeMembers, setSwipeMembers] = useState<{ id: number | string; name: string; avatar: string }[]>([]);
  const [swipeResults, setSwipeResults] = useState<{
    perfectMatches: Array<{
      tmdb_id: number; title: string; poster_path: string | null;
      vote_average: number | null; certification: string | null;
      overview: string | null; release_date: string | null;
    }>;
    closeMatches: Array<{
      tmdb_id: number; title: string; poster_path: string | null;
      vote_average: number | null; certification: string | null;
      overview: string | null; release_date: string | null;
      yesCount: number;
    }>;
    totalMembers: number;
  } | null>(null);

  // Load members + premium status when signed in or in guest mode
  useEffect(() => {
    if (status !== "authenticated" && !guestMode) return;
    fetch("/api/premium")
      .then((r) => r.json())
      .then((d) => { setIsPremium(!!d.isPremium); setIsAdmin(!!d.isAdmin); })
      .catch(() => {});
    fetch("/api/members")
      .then((r) => r.json())
      .then(setMembers)
      .catch(console.error);
  }, [status, guestMode]);

  // Top up recommendations to 5 if some were lost to dedup/filtering
  const topUpRecommendations = useCallback(async (currentRecs: Movie[], memberId: number, category: string, type: "movie" | "show" = "movie") => {
    const missing = 6 - currentRecs.length;
    if (missing <= 0) return currentRecs;

    const refreshUrl = type === "show" ? "/api/shows/refresh" : "/api/movies/refresh";

    try {
      const res = await fetch(refreshUrl, {
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
          release_date: r.release_date ? String(r.release_date) : undefined,
        }));
        setActiveCategory("general");
        await loadCategoryHistory(member.id, "general");
        const filled = await topUpRecommendations(recs, member.id, "general");
        setRecommendations(filled);
      }

      // Always go to search — user can see history via "continue where you left off"
      try {
        const catRes = await fetch(`/api/session/categories?memberId=${member.id}`);
        const cats = await catRes.json();
        setActiveCategories(Array.isArray(cats) ? cats.map((c: Record<string, unknown>) => ({ category: String(c.category), count: Number(c.count) })) : []);
      } catch {
        setActiveCategories([]);
      }
      setStep("search");
    } catch (err) {
      console.error(err);
      setStep("search");
    }
    setLoading(false);
  }, [loadCategoryHistory, topUpRecommendations]);

  const loadWatchlistIds = async (memberId: number) => {
    if (!isPremium) return;
    try {
      const res = await fetch(`/api/watchlist?memberId=${memberId}`);
      const rows = await res.json();
      if (Array.isArray(rows)) {
        setWatchlistIds(new Set(rows.map((r: { tmdb_id: number }) => Number(r.tmdb_id))));
      }
    } catch { /* silent */ }
  };

  const handleSelectMember = (member: Member) => {
    setSelectedMember(member);
    setViewingAll(false);
    setWatchedSelection(new Set());
    setSearchResults([]);
    setActiveCategory("general");
    setCategoryLiked([]);
    setCategoryDisliked([]);
    setContentType("movie");
    loadMemberSession(member);
    loadWatchlistIds(member.id);
  };

  // Auto-select guest's single member — disabled, always show setup
  // Guests always see the setup form or search page fresh

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
          release_date: r.release_date ? String(r.release_date) : undefined,
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

  const openPremiumModal = (feature: string) => {
    setPremiumFeature(feature);
    setShowPremiumModal(true);
  };

  const handleAddMember = async (name: string, avatar: string, age: number | null, maxRating: string) => {
    try {
      const res = await fetch("/api/members", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, avatar, age, maxRating }),
      });
      if (res.status === 403) {
        openPremiumModal("Unlimited family members");
        return;
      }
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
      const searchUrl = contentType === "show"
        ? `/api/shows/search?q=${encodeURIComponent(query)}`
        : `/api/movies/search?q=${encodeURIComponent(query)}`;
      const res = await fetch(searchUrl);
      const data = await res.json();
      setSearchResults(data);
      setSelectedSearchId(null);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const handleSelectSearchMovie = (movie: Movie) => {
    setSelectedSearchId((prev) => prev === movie.id ? null : movie.id);
  };

  const handleConfirmPick = async () => {
    const movie = searchResults.find((m) => m.id === selectedSearchId);
    if (!movie) return;
    setSearchResults([]);
    setSelectedSearchId(null);

    // If filters are active, apply them (filters take precedence over movie pick)
    if (hasMeaningfulFilters(activeFilters)) {
      await handleDiscoverApply(activeFilters);
      return;
    }

    const searchCategory = `Like ${movie.title}`;
    setStep("recommendations");
    setLoading(true);
    setActiveCategory(searchCategory);
    try {
      const recUrl = contentType === "show"
        ? `/api/shows/category?category=${encodeURIComponent(searchCategory)}&memberId=${selectedMember!.id}`
        : `/api/movies/recommendations?likedMovie1=${encodeURIComponent(movie.title)}&likedMovie2=&memberId=${selectedMember!.id}&category=${encodeURIComponent(searchCategory)}`;
      const res = await fetch(recUrl);
      const data = await res.json();
      setRecommendations(data.movies || []);
      setWatchedSelection(new Set());
      await loadCategoryHistory(selectedMember!.id, searchCategory);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const handleMoodSearch = async (mood: string, category: string) => {
    setSearchResults([]);
    setSelectedSearchId(null);

    // If filters are active, keep them applied
    if (hasMeaningfulFilters(activeFilters)) {
      await handleDiscoverApply(activeFilters);
      return;
    }

    setStep("recommendations");
    setLoading(true);
    setActiveCategory(category);
    try {
      const res = await fetch("/api/movies/mood", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          memberId: selectedMember!.id,
          mood,
          category,
          contentType,
        }),
      });
      const data = await res.json();
      setRecommendations(data.movies || []);
      setWatchedSelection(new Set());
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  // Category selection
  const handleSelectCategory = async (genreId: string) => {
    setActiveCategory(genreId);

    // If premium filters are active, use discover API with genre override
    if (hasMeaningfulFilters(activeFilters)) {
      await handleDiscoverApply({ ...activeFilters, genre: genreId });
      return;
    }

    setLoading(true);
    setError(null);
    setCategoryLiked([]);
    setCategoryDisliked([]);
    setStep("category-recs");

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
          release_date: r.release_date ? String(r.release_date) : undefined,
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
        const categoryUrl = contentType === "show"
          ? `/api/shows/category?category=${encodeURIComponent(genreId)}&memberId=${selectedMember!.id}`
          : `/api/movies/category?category=${encodeURIComponent(genreId)}&memberId=${selectedMember!.id}`;
        const res = await fetch(categoryUrl);

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
      const watchedUrl = contentType === "show" ? "/api/shows/watched" : "/api/movies/watched";
      const res = await fetch(watchedUrl, {
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
      const likeUrl = contentType === "show" ? "/api/shows/like" : "/api/movies/like";
      const res = await fetch(likeUrl, {
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
        if (!data.replacement) return prev;
        if (prev.some((m, i2) => i2 !== idx && m.title.toLowerCase() === data.replacement.title.toLowerCase())) return prev;
        const next = [...prev];
        next[idx] = data.replacement;
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

  // Pass = skip without affecting taste. Marks as watched so it won't return.
  const handlePass = async (movie: Movie) => {
    setPassLoadingId(movie.id);
    try {
      const passUrl = contentType === "show" ? "/api/shows/watched" : "/api/movies/watched";
      const res = await fetch(passUrl, {
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
        const idx = prev.findIndex((m) => m.id === movie.id);
        if (idx === -1) return prev;
        if (!data.replacement) return prev;
        if (prev.some((m, i2) => i2 !== idx && m.title.toLowerCase() === data.replacement.title.toLowerCase())) return prev;
        const next = [...prev];
        next[idx] = data.replacement;
        return next;
      });
    } catch (err) {
      console.error(err);
    }
    setPassLoadingId(null);
  };

  const handleDislike = async (movie: Movie) => {
    setDislikeLoadingId(movie.id);
    try {
      const dislikeUrl = contentType === "show" ? "/api/shows/dislike" : "/api/movies/dislike";
      const res = await fetch(dislikeUrl, {
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
        const idx = prev.findIndex((m) => m.id === movie.id);
        if (idx === -1) return prev;
        if (!data.replacement) return prev;
        if (prev.some((m, i2) => i2 !== idx && m.title.toLowerCase() === data.replacement.title.toLowerCase())) return prev;
        const next = [...prev];
        next[idx] = data.replacement;
        return next;
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

  const hasMeaningfulFilters = (f: typeof activeFilters) => {
    const { region, ...rest } = f;
    return Object.values(rest).some(v => v !== undefined);
  };

  const handleStartFresh = () => {
    setSearchResults([]);
    setRecommendations([]);
    setWatchedSelection(new Set());
    setActiveCategory("general");
    setCategoryLiked([]);
    setCategoryDisliked([]);
    setContentType("movie");
    setStep("search");
    if (selectedMember) {
      fetch(`/api/session/categories?memberId=${selectedMember.id}`)
        .then(r => r.json())
        .then(cats => {
          setActiveCategories(Array.isArray(cats) ? cats.map((c: Record<string, unknown>) => ({ category: String(c.category), count: Number(c.count) })) : []);
        })
        .catch(() => setActiveCategories([]));
    }
  };

  const handleStartSwipe = async () => {
    if (members.length < 2) return;
    setLoading(true);
    setStep("swiping");
    try {
      // Fetch the familyId from the server
      const familyRes = await fetch("/api/family");
      const familyData = await familyRes.json();
      if (!familyData.familyId) throw new Error("Could not get family ID");

      const res = await fetch("/api/swipe/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ familyId: familyData.familyId }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);

      setSwipeSessionId(data.sessionId);
      setSwipeCandidates(
        data.candidates.map((c: Record<string, unknown>) => ({
          id: Number(c.tmdb_id),
          title: String(c.title),
          poster_path: c.poster_path ? String(c.poster_path) : null,
          vote_average: Number(c.vote_average),
          certification: c.certification ? String(c.certification) : undefined,
          overview: c.overview ? String(c.overview) : undefined,
          release_date: c.release_date ? String(c.release_date) : undefined,
        }))
      );
      setSwipeMembers(
        data.members.map((m: Record<string, unknown>) => ({
          id: m.id,
          name: String(m.name),
          avatar: String(m.avatar),
        }))
      );
    } catch (err) {
      console.error("Swipe creation error:", err);
      setError("Failed to create swipe session. Please try again.");
      setStep("select-member");
    }
    setLoading(false);
  };

  const handleSwipeComplete = async () => {
    if (!swipeSessionId) return;
    try {
      const res = await fetch(`/api/swipe/results?sessionId=${swipeSessionId}`);
      const data = await res.json();
      setSwipeResults(data);
      setStep("swipe-results");
    } catch (err) {
      console.error("Swipe results error:", err);
      setError("Failed to load results.");
      setStep("select-member");
    }
  };

  const handleRemoveLike = async (title: string) => {
    setCategoryLiked((prev) => prev.filter((m) => m.title !== title));
    try {
      const removeLikeUrl = contentType === "show" ? "/api/shows/like" : "/api/movies/like";
      await fetch(removeLikeUrl, {
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
      const removeDislikeUrl = contentType === "show" ? "/api/shows/dislike" : "/api/movies/dislike";
      await fetch(removeDislikeUrl, {
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

  const handlePersonClick = (person: { id: number; name: string; role: string }) => {
    if (!isPremium && !isGuest) {
      openPremiumModal("More from this director or actor");
      return;
    }
    if (isPremium) {
      setFilmographyPerson(person);
    }
  };

  const handleAddToWatchlist = async (movie: { id: number; title: string; poster_path: string | null; vote_average: number; certification?: string; overview?: string; release_date?: string }) => {
    if (!isPremium && !isGuest) {
      openPremiumModal("Personal watchlist");
      return;
    }
    if (!isPremium || !selectedMember) return;
    const res = await fetch("/api/watchlist", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        memberId: selectedMember.id,
        tmdbId: movie.id,
        title: movie.title,
        posterPath: movie.poster_path,
        voteAverage: movie.vote_average,
        certification: movie.certification,
        overview: movie.overview,
        releaseDate: movie.release_date,
        contentType,
      }),
    });
    if (res.ok) {
      setWatchlistIds(prev => new Set([...prev, movie.id]));
    }
  };

  const handleDiscoverApply = async (filters: { genre?: string; decade?: string; minRating?: number; maxRuntime?: number; providerId?: number; providerName?: string; region?: string; personId?: number; personName?: string; language?: string; languageName?: string }) => {
    setLoading(true);
    setShowAdvancedFilters(false);
    try {
      const params = new URLSearchParams();
      if (filters.genre) params.set("genre", filters.genre);
      if (filters.decade) params.set("decade", filters.decade);
      if (filters.minRating) params.set("minRating", String(filters.minRating));
      if (filters.maxRuntime) params.set("maxRuntime", String(filters.maxRuntime));
      if (filters.providerId) params.set("providerId", String(filters.providerId));
      if (filters.region) params.set("region", filters.region);
      if (filters.personId) params.set("personId", String(filters.personId));
      if (filters.language) params.set("language", filters.language);
      const res = await fetch(`/api/movies/discover?${params}`);
      if (res.status === 403) {
        openPremiumModal("Advanced filters");
        setLoading(false);
        return;
      }
      const movies = await res.json();
      setActiveFilters(filters);
      setRecommendations(movies);
      setStep("recommendations");
    } catch {
      setError("Failed to discover movies");
    }
    setLoading(false);
  };

  const clearFilter = (key: keyof typeof activeFilters) => {
    const updated = { ...activeFilters };
    delete updated[key];
    if (key === "providerId") { delete updated.providerName; delete updated.region; }
    if (key === "personId") { delete updated.personName; }
    if (key === "language") { delete updated.languageName; }
    handleDiscoverApply(updated);
  };

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

      {/* Movie/Show row - 6 cards, deduped */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
        {(() => {
          const seen = new Set<string>();
          return recommendations
            .filter((m) => {
              // Remove liked movies
              if (categoryLiked.some((l) => l.title === m.title)) return false;
              // Dedup by title (case-insensitive)
              const key = m.title.toLowerCase();
              if (seen.has(key)) return false;
              seen.add(key);
              return true;
            })
            .slice(0, 6)
            .map((movie) => (
          <MovieCard
            key={movie.id}
            movie={movie}
            showLike
            onLike={() => handleLike(movie)}
            likeLoading={likeLoadingId === movie.id}
            showPass
            onPass={() => handlePass(movie)}
            passLoading={passLoadingId === movie.id}
            showDislike
            onDislike={() => handleDislike(movie)}
            dislikeLoading={dislikeLoadingId === movie.id}
            contentType={contentType}
            onPersonClick={!isGuest ? handlePersonClick : undefined}
            onAddToWatchlist={!isGuest && isPremium ? () => handleAddToWatchlist(movie) : undefined}
            isOnWatchlist={watchlistIds.has(movie.id)}
          />
        ));
        })()}
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

  // Not signed in and not guest — show landing page
  if (!session && !guestMode) {
    return <LandingPage onSignIn={() => signIn("google")} onGuest={async () => {
      // Clear any old guest session so it's fresh
      await fetch("/api/guest/clear", { method: "POST" });
      setMembers([]);
      setGuestMode(true);
    }} />;
  }

  const isGuest = !session;

  return (
    <main dir={dir} className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-purple-950 text-white">
      {/* Header */}
      <header className="border-b border-gray-800/50 bg-black/20 backdrop-blur sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-3 py-2 sm:px-4 sm:py-3">
          <div className="flex items-center justify-between">
            <button onClick={() => { setStep("select-member"); setSelectedMember(null); setViewingAll(false); }} className="flex-shrink-0">
              <h1 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                Next Movie
              </h1>
            </button>
            <div className="flex items-center gap-2">
              {selectedMember && (
                <button
                  onClick={handleStartFresh}
                  className="flex items-center gap-1.5 text-sm font-semibold bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white px-3 py-1.5 rounded-xl shadow-md shadow-purple-900/30 transition-all hover:scale-105 active:scale-100"
                >
                  <span>🎬</span>
                  <span className="hidden sm:inline">New Movie</span>
                </button>
              )}
              {selectedMember && (
                <>
                  <span className="text-base hidden sm:inline">{selectedMember.avatar}</span>
                  {(() => {
                    const r = selectedMember.max_rating || (selectedMember.age != null ? (selectedMember.age < 7 ? "G" : selectedMember.age < 10 ? "PG" : selectedMember.age < 14 ? "PG-13" : selectedMember.age < 17 ? "R" : "ALL") : "ALL");
                    const color = r === "G" ? "bg-green-600" : r === "PG" ? "bg-blue-600" : r === "PG-13" ? "bg-yellow-600" : r === "R" ? "bg-red-600" : "bg-purple-600";
                    const label = r === "ALL" ? "All" : r;
                    return (
                      <span className={`${color} text-white text-[11px] font-bold px-1.5 py-0.5 rounded hidden sm:inline`}>
                        {label}
                      </span>
                    );
                  })()}
                  {!isGuest && isPremium && selectedMember && (
                    <PremiumMenu
                      isAdmin={isAdmin}
                      onWatchlist={() => setShowWatchlist(true)}
                      onTasteProfile={() => setShowTasteProfile(true)}
                      onAdvancedFilters={() => setShowAdvancedFilters(true)}
                    />
                  )}
                  <button
                    onClick={async () => {
                      if (isGuest) {
                        await fetch("/api/guest/clear", { method: "POST" });
                        setMembers([]);
                        setGuestMode(false);
                      }
                      setSelectedMember(null);
                      setRecommendations([]);
                      setSearchResults([]);
                      setCategoryLiked([]);
                      setCategoryDisliked([]);
                      setActiveCategories([]);
                      setStep("select-member");
                    }}
                    className="text-xs bg-gray-700 hover:bg-gray-600 text-gray-200 px-2 py-1 rounded-lg"
                  >
                    {isGuest ? "Restart" : "Switch"}
                  </button>
                </>
              )}
              {!isGuest && isPremium && !selectedMember && (
                <PremiumMenu
                  isAdmin={isAdmin}
                  onWatchlist={() => setShowWatchlist(true)}
                  onTasteProfile={() => setShowTasteProfile(true)}
                  onAdvancedFilters={() => setShowAdvancedFilters(true)}
                />
              )}
              {!isGuest && !isPremium && (
                <button
                  onClick={() => openPremiumModal("")}
                  className="text-[10px] bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white px-2 py-1 rounded-lg font-bold"
                >
                  Upgrade
                </button>
              )}
              {isGuest ? (
                <button
                  onClick={() => signIn("google")}
                  className="text-xs bg-purple-600 hover:bg-purple-700 text-white px-2.5 py-1 rounded-lg"
                >
                  Sign in
                </button>
              ) : (
                <>
                  {session?.user?.image && (
                    <img src={session.user.image} alt="" className="w-6 h-6 rounded-full" />
                  )}
                  <button onClick={() => signOut()} className="text-xs bg-gray-700 hover:bg-gray-600 text-gray-200 px-2 py-1 rounded-lg">
                    Sign out
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Error banner */}
        {error && (
          <div className="mb-6 bg-red-900/50 border border-red-700 rounded-xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img src="/popcorn--sad-film.png" alt="" className="w-10 h-10 object-contain flex-shrink-0" />
              <p className="text-red-200 text-sm">{error}</p>
            </div>
            <button onClick={() => setError(null)} className="text-red-400 hover:text-red-300 ml-4 text-lg">&times;</button>
          </div>
        )}

        {/* STEP: Select Member */}
        {step === "select-member" && (
          <div className="pt-2">
            {isGuest ? (
              <GuestSetup
                existingMember={null}
                onDone={async (name, age, maxRating) => {
                  try {
                    const res = await fetch("/api/members", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ name, avatar: "🎬", age, maxRating }),
                    });
                    const member = await res.json();
                    setMembers([member]);
                    setSelectedMember(member);
                    setStep("search");
                  } catch (err) {
                    console.error(err);
                  }
                }}
              />
            ) : (
              <>
                <div className="relative text-center mb-16">
                  <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-3xl" />
                    <div className="absolute top-20 left-1/3 w-[300px] h-[300px] bg-pink-600/8 rounded-full blur-3xl" />
                  </div>
                  <div className="relative">
                    <div className="flex items-center justify-center gap-4 mb-4">
                      <img src="/popcorn-clapperboard.png" alt="" className="w-20 h-20 sm:w-28 sm:h-28 object-contain flex-shrink-0" />
                      <div className="text-left">
                        <h2 className="text-4xl sm:text-5xl font-bold mb-2">
                          <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">Who&apos;s watching</span> tonight?
                        </h2>
                        <p className="text-gray-400 text-lg">
                          Pick your profile for personalized picks — or add a family member
                        </p>
                      </div>
                    </div>
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

                {/* Family Swipe button — only for signed-in users with 2+ members */}
                {!isGuest && members.length >= 2 && (
                  <div className="mt-10 text-center">
                    <button
                      onClick={handleStartSwipe}
                      disabled={loading}
                      className="inline-flex items-center gap-3 bg-gradient-to-r from-purple-600 via-pink-600 to-orange-500 hover:from-purple-500 hover:via-pink-500 hover:to-orange-400 text-white px-8 py-4 rounded-2xl text-lg font-bold transition-all hover:scale-105 active:scale-95 shadow-lg shadow-purple-900/40 disabled:opacity-50"
                    >
                      <span className="text-2xl">&#x1F3AC;</span>
                      Find a movie everyone agrees on
                    </button>
                    <p className="text-gray-500 text-sm mt-2">
                      Everyone swipes, we find the match
                    </p>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* STEP: Search */}
        {step === "search" && selectedMember && (
          <div className="pt-2">
            {/* Greeting */}
            <div className="flex items-center justify-center gap-4 mb-4">
              <img src="/popcorn--surprised.png" alt="" className="w-20 h-20 sm:w-28 sm:h-28 object-contain flex-shrink-0" />
              <div>
                <h2 className="text-2xl sm:text-3xl font-bold mb-1">
                  Hey {selectedMember.name}! {selectedMember.avatar}
                </h2>
                <p className="text-gray-300 text-lg">What are you looking for?</p>
              </div>
            </div>

            {/* Movies / Shows toggle */}
            <div className="flex justify-center mb-6">
              <ContentTypeToggle value={contentType} onChange={(v) => { setContentType(v); setSearchResults([]); setSelectedSearchId(null); }} />
            </div>

            {/* Search by title — primary */}
            <div className="max-w-xl mx-auto mb-6">
              <h3 className="text-center text-gray-400 text-sm mb-3">Know what you like? Search by title</h3>
              <SearchBar onSearch={handleSearch} loading={loading} />

              {searchResults.length > 0 && (
                  <div className="mt-6">
                    <h3 className="text-lg font-medium text-gray-300 mb-4">
                      {selectedSearchId
                        ? "Tap again to deselect, or confirm below:"
                        : contentType === "show" ? "Tap the show you love:" : "Tap the movie you love:"}
                    </h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                      {searchResults.map((movie) => (
                        <MovieCard
                          key={movie.id}
                          movie={movie}
                          selected={selectedSearchId === movie.id}
                          onClick={() => handleSelectSearchMovie(movie)}
                          contentType={contentType}
                        />
                      ))}
                    </div>
                    {selectedSearchId && (
                      <div className="mt-6 text-center">
                        <button
                          onClick={handleConfirmPick}
                          disabled={loading}
                          className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white px-8 py-3 rounded-xl text-lg font-semibold transition-all hover:scale-105"
                        >
                          {contentType === "show" ? "Find Shows Like This" : "Find Movies Like This"} →
                        </button>
                      </div>
                    )}
                  </div>
                )}
            </div>

            {/* Pick up where you left off */}
            {activeCategories.filter(({ category }) => category !== "general").length > 0 && (
              <div className="mb-8 max-w-3xl mx-auto">
                <h3 className="text-center text-gray-400 text-xs uppercase tracking-wider mb-3">Pick up where you left off</h3>
                <div className="flex flex-wrap justify-center gap-2">
                  {activeCategories.map(({ category, count }) => {
                    if (category === "general") return null;
                    const genre = GENRES.find((g) => g.id === category);
                    const icon = genre?.icon ?? "🎬";
                    const label = genre?.label ?? category;
                    return (
                      <button
                        key={category}
                        onClick={() => handleSelectCategory(category)}
                        disabled={loading}
                        className="flex items-center gap-1.5 bg-purple-600/20 hover:bg-purple-600/40 border border-purple-500/40 hover:border-purple-500 text-white px-4 py-2.5 rounded-xl transition-all text-sm disabled:opacity-50"
                      >
                        <span>{icon}</span>
                        <span>{label}</span>
                        <span className="text-purple-300 text-[10px] bg-purple-500/30 px-1.5 py-0.5 rounded-full">{count}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Describe what you want — mood or theme */}
            <MoodSearch onSearch={handleMoodSearch} loading={loading} />

            {/* Category grid */}
            <div className="mt-8">
              <h3 className="text-center text-gray-400 text-sm mb-4">Or pick a genre</h3>
              <GenreSelector onSelect={handleSelectCategory} loading={loading} />
            </div>

            {/* Advanced Filters — premium */}
            {!isGuest && (
              <div className="mt-6 text-center">
                <button
                  onClick={() => isPremium ? setShowAdvancedFilters(true) : openPremiumModal("Advanced filters")}
                  className="inline-flex items-center gap-2 text-gray-400 hover:text-white text-sm transition-colors"
                >
                  <span>🎚️</span>
                  <span>Advanced Filters</span>
                  {!isPremium && <span className="text-[9px] bg-gradient-to-r from-purple-600 to-pink-600 text-white px-1.5 py-0.5 rounded-full font-bold">PRO</span>}
                </button>
              </div>
            )}

            {loading && (
              <div className="mt-8">
                <LoadingSpinner />
              </div>
            )}
          </div>
        )}

        {/* STEP: Recommendations (general) */}
        {step === "recommendations" && selectedMember && (
          <div className="pt-2">
            <div className="mb-4">
              <div className="flex items-center justify-center gap-4 mb-4">
                <img src="/popcorn-peace.png" alt="" className="w-16 h-16 sm:w-20 sm:h-20 object-contain flex-shrink-0" />
                <h2 className="text-2xl sm:text-3xl font-bold">
                  <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">Here&apos;s what you should watch</span>
                </h2>
              </div>

              {/* How to use — big and obvious */}
              <div className="max-w-lg mx-auto bg-gray-800/50 border border-gray-700/50 rounded-2xl p-4 mb-2">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="flex items-center gap-2 bg-gray-900/50 rounded-xl px-3 py-2.5">
                    <span className="text-xl">👆</span>
                    <span className="text-gray-300 text-left"><strong className="text-white">Tap poster</strong> to read about it</span>
                  </div>
                  <div className="flex items-center gap-2 bg-gray-900/50 rounded-xl px-3 py-2.5">
                    <span className="text-xl">▶️</span>
                    <span className="text-gray-300 text-left"><strong className="text-white">Watch Now</strong> to find where to stream</span>
                  </div>
                  <div className="flex items-center gap-2 bg-green-900/30 rounded-xl px-3 py-2.5">
                    <span className="text-xl">👍</span>
                    <span className="text-gray-300 text-left"><strong className="text-green-400">Liked</strong> — show me more like this</span>
                  </div>
                  <div className="flex items-center gap-2 bg-red-900/30 rounded-xl px-3 py-2.5">
                    <span className="text-xl">👎</span>
                    <span className="text-gray-300 text-left"><strong className="text-red-400">Nope</strong> — avoid movies like this</span>
                  </div>
                </div>
              </div>
            </div>

            {loading ? (
              <MovieLoadingScreen />
            ) : (
              <>
                {/* Inline filters right above posters */}
                {isPremium && (
                  <InlineFilters
                    filters={activeFilters}
                    onChange={(f) => handleDiscoverApply(f)}
                    onClear={() => { setActiveFilters({}); handleStartFresh(); }}
                    isPremium={isPremium}
                    onUpgrade={() => openPremiumModal("Actor / Director filter")}
                  />
                )}

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
          <div className="pt-2">
            <div className="mb-6">
              <div className="flex items-center justify-center gap-4 mb-2">
                <img src="/popcorn-clapperboard.png" alt="" className="w-16 h-16 sm:w-20 sm:h-20 object-contain flex-shrink-0" />
                <div>
                  <h2 className="text-3xl sm:text-4xl font-bold">
                    <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">{genreIcon} {genreLabel} We Recommend</span>
                  </h2>
                  <p className="text-gray-300 mt-1">Tap a poster to read about it. Like or dislike to get better picks.</p>
                </div>
              </div>
            </div>

            {loading ? (
              <MovieLoadingScreen />
            ) : (
              <>
                {isPremium && (
                  <InlineFilters
                    filters={activeFilters}
                    onChange={(f) => handleDiscoverApply(f)}
                    onClear={() => { setActiveFilters({}); handleStartFresh(); }}
                    isPremium={isPremium}
                    onUpgrade={() => openPremiumModal("Actor / Director filter")}
                  />
                )}
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
          <div className="pt-2">
            <div className="mb-6">
              <div className="flex items-center justify-center gap-4 mb-2">
                <img src="/popcorn-drink.png" alt="" className="w-16 h-16 sm:w-20 sm:h-20 object-contain flex-shrink-0" />
                <div>
                  <h2 className="text-3xl font-bold mb-1">
                    Welcome back, {selectedMember.name}! {selectedMember.avatar}
                  </h2>
                  <p className="text-gray-400">
                    Tap a poster to learn more, then like or dislike
                  </p>
                </div>
              </div>
            </div>

            {loading ? (
              <MovieLoadingScreen />
            ) : (
              <>
                {isPremium && (
                  <InlineFilters
                    filters={activeFilters}
                    onChange={(f) => handleDiscoverApply(f)}
                    onClear={() => { setActiveFilters({}); handleStartFresh(); }}
                    isPremium={isPremium}
                    onUpgrade={() => openPremiumModal("Actor / Director filter")}
                  />
                )}
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
          <div className="pt-2">
            <div className="mb-6">
              <div className="flex items-center justify-center gap-4 mb-2">
                <img src="/popcorn-drink.png" alt="" className="w-16 h-16 sm:w-20 sm:h-20 object-contain flex-shrink-0" />
                <div>
                  <h2 className="text-3xl font-bold mb-1">
                    {genreIcon} Your {genreLabel} List
                  </h2>
                  <p className="text-gray-400">Tap a poster to learn more, then like or dislike</p>
                </div>
              </div>
            </div>

            {loading ? (
              <MovieLoadingScreen />
            ) : (
              <>
                {isPremium && (
                  <InlineFilters
                    filters={activeFilters}
                    onChange={(f) => handleDiscoverApply(f)}
                    onClear={() => { setActiveFilters({}); handleStartFresh(); }}
                    isPremium={isPremium}
                    onUpgrade={() => openPremiumModal("Actor / Director filter")}
                  />
                )}
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
          <div className="pt-2">
            <div className="mb-6">
              <div className="flex items-center justify-center gap-4">
                <img src="/popcorn-peace.png" alt="" className="w-16 h-16 sm:w-20 sm:h-20 object-contain flex-shrink-0" />
                <div>
                  <h2 className="text-3xl font-bold mb-1">Family Movie Board</h2>
                  <p className="text-gray-400">See what everyone is watching</p>
                </div>
              </div>
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
                      <div className="flex items-center gap-3 py-4">
                        <img src="/popcorn--confused.png" alt="" className="w-12 h-12 object-contain opacity-60" />
                        <p className="text-gray-500 italic">
                          No recommendations yet — {member.name} needs to search for a movie first!
                        </p>
                      </div>
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

        {/* STEP: Swiping */}
        {step === "swiping" && (
          <div className="pt-4">
            {loading || !swipeSessionId || swipeCandidates.length === 0 ? (
              <div className="text-center py-16 max-w-md mx-auto">
                <div className="flex items-center justify-center gap-4 mb-4">
                  <img src="/popcorn-clapperboard.png" alt="" className="w-16 h-16 sm:w-20 sm:h-20 animate-bounce object-contain flex-shrink-0" />
                  <h3 className="text-2xl sm:text-3xl font-bold text-white">
                    Setting up family swipe...
                  </h3>
                </div>
                <p className="text-gray-300 text-base mb-8">
                  Our AI is picking movies for the whole family
                </p>
                <div className="w-14 h-14 mx-auto rounded-full border-4 border-gray-700 border-t-purple-500 animate-spin" />
              </div>
            ) : (
              <SwipeFlow
                sessionId={swipeSessionId}
                candidates={swipeCandidates}
                members={swipeMembers}
                onComplete={handleSwipeComplete}
              />
            )}
          </div>
        )}

        {/* STEP: Swipe Results */}
        {step === "swipe-results" && swipeResults && (
          <div className="pt-4">
            <SwipeResults
              perfectMatches={swipeResults.perfectMatches}
              closeMatches={swipeResults.closeMatches}
              totalMembers={swipeResults.totalMembers}
              onPlayAgain={() => {
                setSwipeSessionId(null);
                setSwipeCandidates([]);
                setSwipeMembers([]);
                setSwipeResults(null);
                handleStartSwipe();
              }}
              onGoHome={() => {
                setSwipeSessionId(null);
                setSwipeCandidates([]);
                setSwipeMembers([]);
                setSwipeResults(null);
                setStep("select-member");
                setSelectedMember(null);
              }}
            />
          </div>
        )}
      </div>

      {/* Premium modals */}
      {showPremiumModal && (
        <PremiumModal onClose={() => setShowPremiumModal(false)} feature={premiumFeature || undefined} />
      )}
      {showTasteProfile && selectedMember && (
        <TasteProfile memberId={selectedMember.id} memberName={selectedMember.name} onClose={() => setShowTasteProfile(false)} />
      )}
      {showWatchlist && selectedMember && (
        <Watchlist memberId={selectedMember.id} memberName={selectedMember.name} onClose={() => setShowWatchlist(false)} />
      )}
      {showAdvancedFilters && (
        <AdvancedFilters onApply={handleDiscoverApply} loading={loading} onClose={() => setShowAdvancedFilters(false)} />
      )}
      {filmographyPerson && (
        <PersonFilmography
          personId={filmographyPerson.id}
          personName={filmographyPerson.name}
          role={filmographyPerson.role}
          onClose={() => setFilmographyPerson(null)}
        />
      )}
    </main>
  );
}

const RATING_OPTIONS = [
  { value: "G", label: "G", hint: "Kids", color: "bg-green-600" },
  { value: "PG", label: "PG", hint: "Family", color: "bg-blue-600" },
  { value: "PG-13", label: "PG-13", hint: "Teens", color: "bg-yellow-600" },
  { value: "R", label: "R", hint: "Adult", color: "bg-red-600" },
  { value: "ALL", label: "All", hint: "No limit", color: "bg-gray-600" },
];

const FUNNY_NAMES = [
  "Popcorn Pete", "Sofa Sam", "Binge Betty", "Remote Randy",
  "Couch Potato", "Snack Attack", "Lazy Llama", "Movie Mochi",
  "Captain Chill", "Sir Streams-a-Lot", "Blanket Burrito",
  "Pixel Panda", "Nacho Ninja", "Rewind Rex", "Drama Llama",
  "Flick Fox", "Screen Bean", "Plot Twist", "Cliffhanger Carl",
];

function getRandomFunnyName(): string {
  return FUNNY_NAMES[Math.floor(Math.random() * FUNNY_NAMES.length)];
}

function GuestSetup({ onDone }: { existingMember: Member | null; onDone: (name: string, age: number | null, maxRating: string) => void }) {
  const [maxRating, setMaxRating] = useState("ALL");

  const handleSubmit = () => {
    onDone(getRandomFunnyName(), null, maxRating);
  };

  return (
    <div className="relative text-center">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-3xl" />
      </div>
      <div className="relative max-w-sm mx-auto">
        <div className="flex items-center justify-center gap-4 mb-6">
          <img src="/popcorn--surprised.png" alt="" className="w-16 h-16 sm:w-20 sm:h-20 object-contain flex-shrink-0" />
          <div>
            <h2 className="text-3xl sm:text-4xl font-bold mb-1">
              <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">What can you watch?</span>
            </h2>
            <p className="text-gray-400">Pick your content rating and let&apos;s go</p>
          </div>
        </div>

        <div className="bg-gray-800/50 border border-gray-700/50 rounded-2xl p-6">
          <div className="grid grid-cols-5 gap-2 mb-3">
            {RATING_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setMaxRating(opt.value)}
                className={`flex flex-col items-center px-1 py-3.5 rounded-xl text-sm font-bold transition-all
                  ${maxRating === opt.value
                    ? `${opt.color} text-white ring-2 ring-white/40 scale-105`
                    : "bg-gray-900 text-gray-300 hover:bg-gray-700 border border-gray-700"}`}
              >
                <span>{opt.label}</span>
                <span className="text-[10px] font-normal opacity-75 mt-0.5">{opt.hint}</span>
              </button>
            ))}
          </div>
          <p className="text-gray-500 text-sm mb-6">
            {maxRating === "G" && "Only G-rated movies — safe for little ones."}
            {maxRating === "PG" && "G and PG — family-friendly picks."}
            {maxRating === "PG-13" && "Up to PG-13 — no R-rated content."}
            {maxRating === "R" && "Up to R — no explicit adult content."}
            {maxRating === "ALL" && "Everything goes — no filter."}
          </p>

          <button
            onClick={handleSubmit}
            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white py-4 rounded-xl text-lg font-semibold transition-all hover:scale-[1.02]"
          >
            Start Picking Movies 🍿
          </button>
        </div>
      </div>
    </div>
  );
}

function MovieLoadingScreen() {
  return (
    <div className="text-center py-10 max-w-md mx-auto">
      <div className="mx-auto mb-6 w-24 h-24 animate-bounce">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/popcorn-drink.png" alt="Finding your picks..." className="w-full h-full object-contain drop-shadow-2xl" />
      </div>
      <h3 className="text-2xl sm:text-3xl font-bold text-white mb-3">Finding your perfect picks...</h3>
      <p className="text-gray-300 text-base mb-8">This takes a few seconds — our AI is matching your taste</p>

      <div className="w-14 h-14 mx-auto rounded-full border-4 border-gray-700 border-t-purple-500 animate-spin mb-10" />

      {/* How it works — teach while they wait */}
      <div className="bg-gray-800/50 border border-gray-700/50 rounded-2xl p-5 text-left">
        <p className="text-purple-400 text-sm font-bold uppercase tracking-wider mb-4 text-center">Teach us what you like</p>
        <div className="space-y-4">
          <div className="flex gap-3 items-start">
            <span className="text-2xl flex-shrink-0">👆</span>
            <div>
              <p className="text-white font-semibold text-sm">Tap any poster</p>
              <p className="text-gray-400 text-xs">Read what it&apos;s about and find where to watch</p>
            </div>
          </div>
          <div className="flex gap-3 items-start">
            <span className="text-2xl flex-shrink-0">👍</span>
            <div>
              <p className="text-green-400 font-semibold text-sm">Loved it? Tap &quot;Liked&quot;</p>
              <p className="text-gray-400 text-xs">We&apos;ll learn your taste and suggest more like it</p>
            </div>
          </div>
          <div className="flex gap-3 items-start">
            <span className="text-2xl flex-shrink-0">👎</span>
            <div>
              <p className="text-red-400 font-semibold text-sm">Not for you? Tap &quot;Nope&quot;</p>
              <p className="text-gray-400 text-xs">We&apos;ll stop recommending movies like it</p>
            </div>
          </div>
          <div className="flex gap-3 items-start">
            <span className="text-2xl flex-shrink-0">⏭</span>
            <div>
              <p className="text-gray-300 font-semibold text-sm">Haven&apos;t seen it? Tap &quot;Pass&quot;</p>
              <p className="text-gray-400 text-xs">Skip it — we won&apos;t judge</p>
            </div>
          </div>
        </div>
      </div>
    </div>
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
