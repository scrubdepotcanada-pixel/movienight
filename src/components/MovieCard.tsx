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

const PROVIDER_SEARCH_NAMES: Record<number, string> = {
  8: "Netflix", 9: "Amazon Prime Video", 337: "Disney Plus",
  350: "Apple TV", 230: "Crave", 386: "Peacock",
  531: "Paramount Plus", 1899: "Max HBO", 15: "Hulu",
  192: "YouTube", 3: "Google Play Movies", 10: "Amazon Prime Video",
};

const AMAZON_TAG = process.env.NEXT_PUBLIC_AMAZON_TAG || "nextmovie-20";
const APPLE_TOKEN = process.env.NEXT_PUBLIC_APPLE_TOKEN || "";

function getProviderUrl(providerId: number, title: string): string {
  if (providerId === 9 || providerId === 10) {
    return `https://www.amazon.ca/s?k=${encodeURIComponent(title)}&i=instant-video&tag=${AMAZON_TAG}`;
  }
  if (providerId === 350) {
    const base = `https://tv.apple.com/search?term=${encodeURIComponent(title)}`;
    return APPLE_TOKEN ? `${base}&at=${APPLE_TOKEN}` : base;
  }
  const name = PROVIDER_SEARCH_NAMES[providerId];
  const q = name ? `${title} ${name} watch` : `${title} watch online`;
  return `https://www.google.com/search?q=${encodeURIComponent(q)}`;
}

function ratingColor(r: number): string {
  return r >= 7 ? "text-green-400" : r >= 5 ? "text-yellow-400" : "text-red-400";
}

function certColor(c: string): string {
  return c === "G" ? "bg-green-600" : c === "PG" ? "bg-blue-600" : c === "PG-13" ? "bg-yellow-600" : c === "R" ? "bg-red-600" : c === "NC-17" ? "bg-red-800" : "bg-gray-600";
}

function Spinner() {
  return (
    <svg className="w-5 h-5 text-white animate-spin" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}

export default function MovieCard({
  movie, selected, onDislike, onLike, onPass,
  showDislike, showLike, showPass,
  dislikeLoading, likeLoading, passLoading, onClick,
}: MovieCardProps) {
  const [flipped, setFlipped] = useState(false);
  const [showProviders, setShowProviders] = useState(false);
  const [providers, setProviders] = useState<WatchProvider[]>([]);
  const [loadingProviders, setLoadingProviders] = useState(false);

  const posterSrc = movie.poster_path
    ? `https://image.tmdb.org/t/p/w342${movie.poster_path}`
    : null;
  const showActions = showLike || showPass || showDislike;
  const year = movie.release_date?.slice(0, 4);

  useEffect(() => {
    setFlipped(false);
    setShowProviders(false);
    setProviders([]);
  }, [movie.id]);

  const handlePosterClick = () => {
    if (!showActions) {
      onClick?.();
      return;
    }
    setFlipped(!flipped);
  };

  const handleWatchNow = async () => {
    setLoadingProviders(true);
    try {
      const res = await fetch(`/api/movies/providers?movieId=${movie.id}`);
      const data = await res.json();
      const all = [...(data.flatrate || []), ...(data.rent || [])];
      const unique = all.filter((p: WatchProvider, i: number, arr: WatchProvider[]) =>
        arr.findIndex((x) => x.provider_id === p.provider_id) === i
      ).slice(0, 6);
      setProviders(unique);
    } catch {
      setProviders([]);
    }
    setLoadingProviders(false);
    setShowProviders(true);
  };

  const youtubeUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(movie.title + " " + (year || "") + " official trailer")}`;

  return (
    <>
      <div className={`group transition-transform duration-300 ${selected ? "scale-105" : "hover:scale-[1.02]"}`} style={{ perspective: "1000px" }}>
        <div className="relative w-full transition-transform duration-500" style={{ transformStyle: "preserve-3d", transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)" }}>

          {/* FRONT — poster */}
          <div
            className={`rounded-xl overflow-hidden bg-gray-800/80 backdrop-blur cursor-pointer
              ${selected ? "ring-4 ring-purple-500" : "hover:ring-2 hover:ring-purple-400/50"}`}
            style={{ backfaceVisibility: "hidden" }}
            onClick={handlePosterClick}
          >
            <div className="relative aspect-[2/3] w-full bg-gray-700">
              {posterSrc ? (
                <Image src={posterSrc} alt={movie.title} fill className="object-cover" sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw" unoptimized />
              ) : (
                <div className="flex items-center justify-center h-full text-gray-400 text-sm p-4 text-center">{movie.title}</div>
              )}
              <div className="absolute top-2 left-2 bg-black/80 rounded-lg px-2 py-1 flex items-center gap-1">
                <svg className="w-3.5 h-3.5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                <span className={`text-xs font-bold ${ratingColor(movie.vote_average)}`}>{movie.vote_average.toFixed(1)}</span>
              </div>
              {movie.certification && movie.certification !== "NR" && (
                <div className={`absolute top-2 right-2 ${certColor(movie.certification)} rounded-md px-1.5 py-0.5`}>
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
            </div>
            <div className="px-3 pt-2 pb-1">
              <h3 className="text-white text-sm font-medium truncate">{movie.title}</h3>
              <div className="flex items-center gap-2 mt-0.5">
                {year && <span className="text-gray-400 text-xs">{year}</span>}
                {movie.certification && <span className="text-gray-400 text-xs">{movie.certification}</span>}
                <span className="text-gray-400 text-xs">{movie.vote_average.toFixed(1)}/10</span>
              </div>
            </div>
            {showActions && (
              <div className="flex gap-1.5 px-3 pb-3 pt-1">
                {showLike && <button className="flex-1 flex items-center justify-center gap-1 bg-gray-700/80 hover:bg-green-600 text-white py-2 rounded-lg transition-all text-xs font-medium" onClick={(e) => { e.stopPropagation(); onLike?.(); }} disabled={likeLoading}>{likeLoading ? <Spinner /> : <>👍 Liked</>}</button>}
                {showPass && <button className="flex-1 flex items-center justify-center gap-1 bg-gray-700/80 hover:bg-gray-500 text-white py-2 rounded-lg transition-all text-xs font-medium" onClick={(e) => { e.stopPropagation(); onPass?.(); }} disabled={passLoading}>{passLoading ? <Spinner /> : <>⏭ Pass</>}</button>}
                {showDislike && <button className="flex-1 flex items-center justify-center gap-1 bg-gray-700/80 hover:bg-red-600 text-white py-2 rounded-lg transition-all text-xs font-medium" onClick={(e) => { e.stopPropagation(); onDislike?.(); }} disabled={dislikeLoading}>{dislikeLoading ? <Spinner /> : <>👎 Nope</>}</button>}
              </div>
            )}
          </div>

          {/* BACK — synopsis + watch now */}
          <div
            className="absolute inset-0 rounded-xl overflow-hidden bg-gradient-to-br from-gray-900 to-gray-800 border border-gray-700/50 flex flex-col cursor-pointer"
            style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
            onClick={handlePosterClick}
          >
            <div className="flex-1 p-4 overflow-y-auto">
              <h3 className="text-white text-sm font-bold mb-1">{movie.title}</h3>
              <div className="flex items-center gap-2 mb-3">
                {year && <span className="text-gray-400 text-xs">{year}</span>}
                {movie.certification && <span className="text-gray-400 text-xs">{movie.certification}</span>}
                <span className={`text-xs font-bold ${ratingColor(movie.vote_average)}`}>★ {movie.vote_average.toFixed(1)}</span>
              </div>
              <p className="text-gray-300 text-xs leading-relaxed">
                {movie.overview || "No description available."}
              </p>
            </div>

            <div className="px-3 pb-1">
              <button
                onClick={(e) => { e.stopPropagation(); handleWatchNow(); }}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white py-2 rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-1.5"
              >
                {loadingProviders ? <Spinner /> : <>▶ Watch Now</>}
              </button>
            </div>

            {showActions && (
              <div className="flex gap-1.5 px-3 pb-3 pt-1">
                {showLike && <button className="flex-1 flex items-center justify-center gap-1 bg-gray-700/80 hover:bg-green-600 text-white py-2 rounded-lg transition-all text-xs font-medium" onClick={(e) => { e.stopPropagation(); onLike?.(); }} disabled={likeLoading}>{likeLoading ? <Spinner /> : <>👍 Liked</>}</button>}
                {showPass && <button className="flex-1 flex items-center justify-center gap-1 bg-gray-700/80 hover:bg-gray-500 text-white py-2 rounded-lg transition-all text-xs font-medium" onClick={(e) => { e.stopPropagation(); onPass?.(); }} disabled={passLoading}>{passLoading ? <Spinner /> : <>⏭ Pass</>}</button>}
                {showDislike && <button className="flex-1 flex items-center justify-center gap-1 bg-gray-700/80 hover:bg-red-600 text-white py-2 rounded-lg transition-all text-xs font-medium" onClick={(e) => { e.stopPropagation(); onDislike?.(); }} disabled={dislikeLoading}>{dislikeLoading ? <Spinner /> : <>👎 Nope</>}</button>}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Watch Now Modal */}
      {showProviders && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4" onClick={() => setShowProviders(false)}>
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
          <div className="relative bg-gray-900 border border-gray-700 rounded-2xl p-6 shadow-2xl w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setShowProviders(false)} className="absolute top-3 right-3 text-gray-400 hover:text-white text-xl">&times;</button>

            <h3 className="text-white text-lg font-bold mb-1">{movie.title}</h3>
            {year && <p className="text-gray-400 text-sm mb-4">{year}</p>}

            {/* YouTube Trailer */}
            <a
              href={youtubeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full bg-red-600 hover:bg-red-700 text-white py-3 rounded-xl font-semibold transition-colors mb-4"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" /></svg>
              Watch Trailer
            </a>

            {/* Streaming Providers */}
            {providers.length > 0 ? (
              <>
                <p className="text-gray-400 text-xs uppercase tracking-wider font-medium mb-3">Stream or rent</p>
                <div className="grid grid-cols-3 gap-2">
                  {providers.map((p) => (
                    <a
                      key={p.provider_id}
                      href={getProviderUrl(p.provider_id, movie.title)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-gray-800/80 hover:bg-gray-700 transition-colors"
                    >
                      <img src={`https://image.tmdb.org/t/p/w92${p.logo_path}`} alt={p.provider_name} className="w-10 h-10 rounded-lg" />
                      <span className="text-[9px] text-gray-300 text-center leading-tight truncate w-full">{p.provider_name}</span>
                    </a>
                  ))}
                </div>
              </>
            ) : (
              <p className="text-gray-500 text-sm text-center">No streaming options found in your region</p>
            )}
          </div>
        </div>
      )}
    </>
  );
}
