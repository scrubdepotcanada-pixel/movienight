"use client";

import { useState } from "react";
import Image from "next/image";

interface ResultMovie {
  tmdb_id: number;
  title: string;
  poster_path: string | null;
  vote_average: number | null;
  certification: string | null;
  overview: string | null;
  release_date: string | null;
  yesCount?: number;
}

interface WatchProvider {
  provider_id: number;
  provider_name: string;
  logo_path: string;
}

interface SwipeResultsProps {
  perfectMatches: ResultMovie[];
  closeMatches: ResultMovie[];
  totalMembers: number;
  onPlayAgain: () => void;
  onGoHome: () => void;
}

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

function Spinner() {
  return (
    <svg className="w-5 h-5 text-white animate-spin" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}

function ResultCard({
  movie,
  totalMembers,
  featured,
}: {
  movie: ResultMovie;
  totalMembers: number;
  featured?: boolean;
}) {
  const [showProviders, setShowProviders] = useState(false);
  const [providers, setProviders] = useState<WatchProvider[]>([]);
  const [loadingProviders, setLoadingProviders] = useState(false);

  const posterSrc = movie.poster_path
    ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
    : null;
  const year = movie.release_date?.slice(0, 4);
  const yesCount = movie.yesCount ?? totalMembers;

  const youtubeUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(
    movie.title + " " + (year || "") + " official trailer"
  )}`;

  const handleWatchNow = async () => {
    setLoadingProviders(true);
    try {
      const res = await fetch(`/api/movies/providers?movieId=${movie.tmdb_id}`);
      const data = await res.json();
      const all = [...(data.flatrate || []), ...(data.rent || [])];
      const unique = all
        .filter(
          (p: WatchProvider, i: number, arr: WatchProvider[]) =>
            arr.findIndex((x) => x.provider_id === p.provider_id) === i
        )
        .slice(0, 6);
      setProviders(unique);
    } catch {
      setProviders([]);
    }
    setLoadingProviders(false);
    setShowProviders(true);
  };

  return (
    <>
      <div
        className={`flex flex-col items-center ${
          featured ? "w-full max-w-xs" : "w-36 sm:w-40"
        }`}
      >
        {/* Poster */}
        <div
          className={`relative w-full rounded-2xl overflow-hidden bg-gray-800 shadow-lg ${
            featured
              ? "aspect-[2/3] shadow-purple-900/40"
              : "aspect-[2/3]"
          }`}
        >
          {posterSrc ? (
            <Image
              src={posterSrc}
              alt={movie.title}
              fill
              className="object-cover"
              sizes={featured ? "(max-width: 640px) 80vw, 320px" : "160px"}
              unoptimized
            />
          ) : (
            <div className="flex items-center justify-center h-full text-gray-400 text-sm p-4 text-center">
              {movie.title}
            </div>
          )}

          {featured && (
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
          )}
        </div>

        {/* Info */}
        <div className={`text-center mt-3 w-full ${featured ? "px-2" : ""}`}>
          <h3
            className={`text-white font-bold leading-tight ${
              featured ? "text-xl" : "text-sm"
            }`}
          >
            {movie.title}
          </h3>
          {year && (
            <p className="text-gray-400 text-xs mt-0.5">{year}</p>
          )}
          <p
            className={`mt-1 font-medium ${
              yesCount >= totalMembers
                ? "text-green-400"
                : "text-yellow-400"
            } ${featured ? "text-sm" : "text-xs"}`}
          >
            {yesCount} of {totalMembers} said yes
          </p>
        </div>

        {/* Watch Now button */}
        <button
          onClick={handleWatchNow}
          disabled={loadingProviders}
          className={`mt-3 flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-semibold transition-all active:scale-95 disabled:opacity-50 ${
            featured
              ? "w-full py-3 text-base"
              : "w-full py-2 text-xs"
          }`}
        >
          {loadingProviders ? (
            <Spinner />
          ) : (
            <>
              <span>&#x25B6;</span> Watch Now
            </>
          )}
        </button>
      </div>

      {/* Provider Modal */}
      {showProviders && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center px-4"
          onClick={() => setShowProviders(false)}
        >
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
          <div
            className="relative bg-gray-900 border border-gray-700 rounded-2xl p-6 shadow-2xl w-full max-w-sm"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowProviders(false)}
              className="absolute top-3 right-3 text-gray-400 hover:text-white text-xl"
            >
              &times;
            </button>

            <h3 className="text-white text-lg font-bold mb-1">
              {movie.title}
            </h3>
            {year && <p className="text-gray-400 text-sm mb-4">{year}</p>}

            {/* YouTube Trailer */}
            <a
              href={youtubeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full bg-red-600 hover:bg-red-700 text-white py-3 rounded-xl font-semibold transition-colors mb-4"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
              </svg>
              Watch Trailer
            </a>

            {/* Streaming Providers */}
            {providers.length > 0 ? (
              <>
                <p className="text-gray-400 text-xs uppercase tracking-wider font-medium mb-3">
                  Stream or rent
                </p>
                <div className="grid grid-cols-3 gap-2">
                  {providers.map((p) => (
                    <a
                      key={p.provider_id}
                      href={getProviderUrl(p.provider_id, movie.title)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-gray-800/80 hover:bg-gray-700 transition-colors"
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
              <p className="text-gray-500 text-sm text-center">
                No streaming options found in your region
              </p>
            )}
          </div>
        </div>
      )}
    </>
  );
}

export default function SwipeResults({
  perfectMatches,
  closeMatches,
  totalMembers,
  onPlayAgain,
  onGoHome,
}: SwipeResultsProps) {
  const hasPerfect = perfectMatches.length > 0;
  const topMatch = hasPerfect ? perfectMatches[0] : null;
  const otherPerfect = hasPerfect ? perfectMatches.slice(1) : [];

  return (
    <div className="flex flex-col items-center px-4 pt-6 pb-12">
      {hasPerfect ? (
        <>
          {/* Confetti headline */}
          <div className="text-center mb-8">
            <div className="text-5xl mb-3">
              &#x1F389; &#x1F37F; &#x1F38A;
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold mb-2">
              <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                Everyone agrees!
              </span>
            </h2>
            <p className="text-gray-300 text-lg">
              {totalMembers} out of {totalMembers} family members said YES
            </p>
          </div>

          {/* Top match as big card */}
          {topMatch && (
            <ResultCard
              movie={topMatch}
              totalMembers={totalMembers}
              featured
            />
          )}

          {/* Other perfect matches */}
          {otherPerfect.length > 0 && (
            <div className="mt-10 w-full">
              <h3 className="text-center text-gray-400 text-sm uppercase tracking-wider mb-4">
                Also unanimous picks
              </h3>
              <div className="flex flex-wrap justify-center gap-4">
                {otherPerfect.map((movie) => (
                  <ResultCard
                    key={movie.tmdb_id}
                    movie={movie}
                    totalMembers={totalMembers}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Close matches below */}
          {closeMatches.length > 0 && (
            <div className="mt-10 w-full">
              <h3 className="text-center text-gray-400 text-sm uppercase tracking-wider mb-4">
                Close runners-up
              </h3>
              <div className="flex flex-wrap justify-center gap-4">
                {closeMatches.map((movie) => (
                  <ResultCard
                    key={movie.tmdb_id}
                    movie={movie}
                    totalMembers={totalMembers}
                  />
                ))}
              </div>
            </div>
          )}
        </>
      ) : (
        <>
          {/* No perfect matches */}
          <div className="text-center mb-8">
            <div className="text-5xl mb-3">
              &#x1F914; &#x1F3AC;
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold mb-2">
              <span className="bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent">
                Almost! Here&apos;s what came closest
              </span>
            </h2>
            <p className="text-gray-300 text-lg">
              No unanimous pick this time, but these were popular
            </p>
          </div>

          {/* Close matches sorted by yes count (already sorted by API) */}
          {closeMatches.length > 0 ? (
            <div className="flex flex-wrap justify-center gap-4">
              {closeMatches.map((movie, i) => (
                <ResultCard
                  key={movie.tmdb_id}
                  movie={movie}
                  totalMembers={totalMembers}
                  featured={i === 0}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-400 text-lg">
                Nobody said yes to the same movies. Try again with different picks!
              </p>
            </div>
          )}
        </>
      )}

      {/* Action buttons */}
      <div className="flex flex-col sm:flex-row gap-3 mt-10 w-full max-w-sm">
        <button
          onClick={onPlayAgain}
          className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white py-4 rounded-2xl text-lg font-bold transition-all hover:scale-105 active:scale-95"
        >
          &#x1F504; Try Again
        </button>
        <button
          onClick={onGoHome}
          className="flex-1 flex items-center justify-center gap-2 bg-gray-800 hover:bg-gray-700 text-white py-4 rounded-2xl text-lg font-bold transition-all border border-gray-700 active:scale-95"
        >
          &#x1F3E0; Back to Home
        </button>
      </div>
    </div>
  );
}
