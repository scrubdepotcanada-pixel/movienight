"use client";

import { useState, useEffect } from "react";
import Image from "next/image";

interface WatchProvider {
  provider_id: number;
  provider_name: string;
  logo_path: string;
}

interface MovieCardProps {
  movie: {
    id: number;
    title: string;
    poster_path: string | null;
    vote_average: number;
    certification?: string;
    overview?: string;
    release_date?: string;
  };
  selected?: boolean;
  onDislike?: () => void;
  onLike?: () => void;
  onPass?: () => void;
  showDislike?: boolean;
  showLike?: boolean;
  showPass?: boolean;
  dislikeLoading?: boolean;
  likeLoading?: boolean;
  passLoading?: boolean;
  onClick?: () => void;
}

function ratingColor(rating: number): string {
  if (rating >= 7) return "text-green-400";
  if (rating >= 5) return "text-yellow-400";
  return "text-red-400";
}

function certBadgeColor(cert: string): string {
  switch (cert) {
    case "G": return "bg-green-600";
    case "PG": return "bg-blue-600";
    case "PG-13": return "bg-yellow-600";
    case "R": return "bg-red-600";
    case "NC-17": return "bg-red-800";
    default: return "bg-gray-600";
  }
}

// Provider name used in Google search to find the movie on the right service
const PROVIDER_SEARCH_NAMES: Record<number, string> = {
  8: "Netflix",
  9: "Amazon Prime Video",
  337: "Disney Plus",
  350: "Apple TV",
  230: "Crave",
  386: "Peacock",
  531: "Paramount Plus",
  1899: "Max HBO",
  15: "Hulu",
  192: "YouTube",
  3: "Google Play Movies",
  10: "Amazon Prime Video",
};

function getProviderUrl(providerId: number, movieTitle: string): string {
  const serviceName = PROVIDER_SEARCH_NAMES[providerId];
  const query = serviceName
    ? `${movieTitle} ${serviceName} watch`
    : `${movieTitle} watch online`;
  return `https://www.google.com/search?q=${encodeURIComponent(query)}`;
}

function LoadingSpinnerSmall() {
  return (
    <svg className="w-5 h-5 text-white animate-spin" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}

export default function MovieCard({
  movie,
  selected,
  onDislike,
  onLike,
  onPass,
  showDislike,
  showLike,
  showPass,
  dislikeLoading,
  likeLoading,
  passLoading,
  onClick,
}: MovieCardProps) {
  const [flipped, setFlipped] = useState(false);
  const [providers, setProviders] = useState<{
    flatrate?: WatchProvider[];
    rent?: WatchProvider[];
    link?: string;
  } | null>(null);
  const [loadingProviders, setLoadingProviders] = useState(false);

  const posterSrc = movie.poster_path
    ? `https://image.tmdb.org/t/p/w342${movie.poster_path}`
    : null;

  const handlePosterClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (selected) return;

    setLoadingProviders(true);
    try {
      const res = await fetch(`/api/movies/providers?movieId=${movie.id}`);
      const data = await res.json();
      setProviders(data);
    } catch {
      setProviders({});
    }
    setLoadingProviders(false);
    setFlipped(true);
  };

  const handleLikeClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onLike?.();
  };

  // Reset flip when movie changes (card was replaced)
  useEffect(() => {
    setFlipped(false);
    setProviders(null);
  }, [movie.id]);

  const allProviders = [
    ...(providers?.flatrate || []),
    ...(providers?.rent || []),
  ];
  const uniqueProviders = allProviders.filter(
    (p, i, arr) => arr.findIndex((x) => x.provider_id === p.provider_id) === i
  ).slice(0, 6);

  return (
    <div
      className={`group transition-transform duration-300 ${selected ? "scale-105" : "hover:scale-[1.02]"}`}
      style={{ perspective: "1000px" }}
    >
      <div
        className="relative w-full transition-transform duration-700"
        style={{
          transformStyle: "preserve-3d",
          transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)",
        }}
      >
        {/* FRONT — movie poster + buttons */}
        <div
          className={`rounded-xl overflow-hidden bg-gray-800/80 backdrop-blur
            ${selected ? "ring-4 ring-purple-500" : "hover:ring-2 hover:ring-purple-400/50"}`}
          style={{ backfaceVisibility: "hidden" }}
          onClick={onClick}
        >
          <div className="relative aspect-[2/3] w-full bg-gray-700 cursor-pointer" onClick={handlePosterClick}>
            {loadingProviders && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-10">
                <LoadingSpinnerSmall />
              </div>
            )}
            {posterSrc ? (
              <Image
                src={posterSrc}
                alt={movie.title}
                fill
                className="object-cover"
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
                unoptimized
              />
            ) : (
              <div className="flex items-center justify-center h-full text-gray-400 text-sm p-4 text-center">
                {movie.title}
              </div>
            )}

            <div className="absolute top-2 left-2 bg-black/80 rounded-lg px-2 py-1 flex items-center gap-1">
              <svg className="w-3.5 h-3.5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              <span className={`text-xs font-bold ${ratingColor(movie.vote_average)}`}>
                {movie.vote_average.toFixed(1)}
              </span>
            </div>

            {movie.certification && movie.certification !== "NR" && (
              <div className={`absolute top-2 right-2 ${certBadgeColor(movie.certification)} rounded-md px-1.5 py-0.5`}>
                <span className="text-xs font-bold text-white">{movie.certification}</span>
              </div>
            )}

            {selected && (
              <div className="absolute inset-0 bg-purple-500/30 flex items-center justify-center">
                <div className="bg-purple-500 rounded-full p-3">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              </div>
            )}

            {movie.overview && !selected && (
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-3">
                <p className="text-white text-xs leading-relaxed line-clamp-6">{movie.overview}</p>
              </div>
            )}
          </div>

          <div className="px-3 pt-2 pb-1">
            <h3 className="text-white text-sm font-medium truncate">{movie.title}</h3>
            <div className="flex items-center gap-2 mt-0.5">
              {movie.release_date && (
                <span className="text-gray-400 text-xs">{movie.release_date.slice(0, 4)}</span>
              )}
              {movie.certification && (
                <span className="text-gray-400 text-xs">{movie.certification}</span>
              )}
              <span className="text-gray-400 text-xs">{movie.vote_average.toFixed(1)}/10</span>
            </div>
          </div>

          {(showLike || showPass || showDislike) && (
            <div className="flex gap-1.5 px-3 pb-3 pt-1">
              {showLike && (
                <button
                  className="flex-1 flex items-center justify-center gap-1 bg-gray-700/80 hover:bg-green-600 text-white py-2 rounded-lg transition-all text-xs font-medium"
                  onClick={handleLikeClick}
                  disabled={likeLoading}
                >
                  {likeLoading ? <LoadingSpinnerSmall /> : <>👍 Liked</>}
                </button>
              )}
              {showPass && (
                <button
                  className="flex-1 flex items-center justify-center gap-1 bg-gray-700/80 hover:bg-gray-500 text-white py-2 rounded-lg transition-all text-xs font-medium"
                  onClick={(e) => { e.stopPropagation(); onPass?.(); }}
                  disabled={passLoading}
                >
                  {passLoading ? <LoadingSpinnerSmall /> : <>⏭ Pass</>}
                </button>
              )}
              {showDislike && (
                <button
                  className="flex-1 flex items-center justify-center gap-1 bg-gray-700/80 hover:bg-red-600 text-white py-2 rounded-lg transition-all text-xs font-medium"
                  onClick={(e) => { e.stopPropagation(); onDislike?.(); }}
                  disabled={dislikeLoading}
                >
                  {dislikeLoading ? <LoadingSpinnerSmall /> : <>👎 Nope</>}
                </button>
              )}
            </div>
          )}
        </div>

        {/* BACK — Where to Watch */}
        <div
          className="absolute inset-0 rounded-xl overflow-hidden bg-gradient-to-br from-gray-900 to-gray-800 border border-gray-700/50 flex flex-col"
          style={{
            backfaceVisibility: "hidden",
            transform: "rotateY(180deg)",
          }}
        >
          <div className="p-4 flex-1 flex flex-col">
            <div className="text-center mb-3">
              <p className="text-purple-400 text-xs font-semibold uppercase tracking-wider mb-1">🎬 Watch</p>
              <h3 className="text-white text-sm font-bold leading-tight">{movie.title}</h3>
              {movie.release_date && (
                <p className="text-gray-400 text-xs mt-0.5">{movie.release_date.slice(0, 4)}</p>
              )}
            </div>

            <div className="flex-1 flex flex-col justify-center">
              {uniqueProviders.length > 0 ? (
                <>
                  <p className="text-gray-300 text-xs text-center mb-3 font-medium">Where to watch</p>
                  <div className="grid grid-cols-3 gap-2">
                    {uniqueProviders.map((p) => (
                      <a
                        key={p.provider_id}
                        href={getProviderUrl(p.provider_id, movie.title)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex flex-col items-center gap-1 p-2 rounded-lg bg-gray-800/80 hover:bg-gray-700 transition-colors"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <img
                          src={`https://image.tmdb.org/t/p/w92${p.logo_path}`}
                          alt={p.provider_name}
                          className="w-10 h-10 rounded-lg"
                        />
                        <span className="text-[9px] text-gray-300 text-center leading-tight truncate w-full">
                          {p.provider_name}
                        </span>
                      </a>
                    ))}
                  </div>
                </>
              ) : (
                <div className="text-center">
                  <p className="text-gray-400 text-sm mb-2">Not streaming right now</p>
                  <p className="text-gray-500 text-xs">Check back later or rent digitally</p>
                </div>
              )}
            </div>

            <button
              onClick={(e) => { e.stopPropagation(); setFlipped(false); }}
              className="mt-3 w-full bg-gray-700/80 hover:bg-gray-600 text-gray-300 py-2 rounded-lg text-xs font-medium transition-colors"
            >
              ← Back to card
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
