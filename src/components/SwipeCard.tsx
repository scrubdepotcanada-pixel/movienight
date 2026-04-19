"use client";

import Image from "next/image";

interface SwipeCardMovie {
  id: number;
  title: string;
  poster_path: string | null;
  vote_average: number;
  certification?: string;
  overview?: string;
  release_date?: string;
}

interface SwipeCardProps {
  movie: SwipeCardMovie;
  onYes: () => void;
  onNo: () => void;
  loading?: boolean;
}

function ratingColor(r: number): string {
  return r >= 7 ? "text-green-400" : r >= 5 ? "text-yellow-400" : "text-red-400";
}

function certColor(c: string): string {
  return c === "G"
    ? "bg-green-600"
    : c === "PG"
    ? "bg-blue-600"
    : c === "PG-13"
    ? "bg-yellow-600"
    : c === "R"
    ? "bg-red-600"
    : c === "NC-17"
    ? "bg-red-800"
    : "bg-gray-600";
}

export default function SwipeCard({ movie, onYes, onNo, loading }: SwipeCardProps) {
  const posterSrc = movie.poster_path
    ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
    : null;
  const year = movie.release_date?.slice(0, 4);

  return (
    <div className="flex flex-col items-center w-full max-w-xs mx-auto">
      {/* Poster */}
      <div className="relative aspect-[2/3] w-full rounded-2xl overflow-hidden bg-gray-800 shadow-2xl shadow-purple-900/30">
        {posterSrc ? (
          <Image
            src={posterSrc}
            alt={movie.title}
            fill
            className="object-cover"
            sizes="(max-width: 640px) 80vw, 320px"
            unoptimized
          />
        ) : (
          <div className="flex items-center justify-center h-full text-gray-400 text-lg p-6 text-center">
            {movie.title}
          </div>
        )}

        {/* Rating badge */}
        <div className="absolute top-3 left-3 bg-black/80 backdrop-blur-sm rounded-lg px-2.5 py-1.5 flex items-center gap-1.5">
          <svg className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
          <span className={`text-sm font-bold ${ratingColor(movie.vote_average)}`}>
            {movie.vote_average.toFixed(1)}
          </span>
        </div>

        {/* Certification badge */}
        {movie.certification && movie.certification !== "NR" && (
          <div className={`absolute top-3 right-3 ${certColor(movie.certification)} rounded-md px-2 py-1`}>
            <span className="text-xs font-bold text-white">{movie.certification}</span>
          </div>
        )}
      </div>

      {/* Movie info */}
      <div className="text-center mt-4 w-full px-2">
        <h3 className="text-white text-xl font-bold leading-tight">{movie.title}</h3>
        <div className="flex items-center justify-center gap-2 mt-1.5">
          {year && <span className="text-gray-400 text-sm">{year}</span>}
          {movie.certification && (
            <span className="text-gray-400 text-sm">{movie.certification}</span>
          )}
          <span className="text-gray-400 text-sm">{movie.vote_average.toFixed(1)}/10</span>
        </div>

        {/* Brief overview */}
        {movie.overview && (
          <p className="text-gray-400 text-xs leading-relaxed mt-3 line-clamp-3">
            {movie.overview}
          </p>
        )}
      </div>

      {/* Big action buttons */}
      <div className="flex gap-4 w-full mt-6">
        <button
          onClick={onNo}
          disabled={loading}
          className="flex-1 flex items-center justify-center gap-2 bg-gray-800 hover:bg-red-600 text-white py-4 rounded-2xl text-lg font-bold transition-all active:scale-95 disabled:opacity-50 border border-gray-700 hover:border-red-500"
        >
          <span className="text-2xl">&#x1F44E;</span> Nope
        </button>
        <button
          onClick={onYes}
          disabled={loading}
          className="flex-1 flex items-center justify-center gap-2 bg-gray-800 hover:bg-green-600 text-white py-4 rounded-2xl text-lg font-bold transition-all active:scale-95 disabled:opacity-50 border border-gray-700 hover:border-green-500"
        >
          <span className="text-2xl">&#x1F44D;</span> Yes!
        </button>
      </div>
    </div>
  );
}
