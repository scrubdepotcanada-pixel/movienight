"use client";

import Image from "next/image";

interface MovieCardProps {
  movie: {
    id: number;
    title: string;
    poster_path: string | null;
    vote_average: number;
    certification?: string;
    overview?: string;
  };
  selected?: boolean;
  watched?: boolean;
  liked?: boolean;
  onClick?: () => void;
  onDislike?: () => void;
  onLike?: () => void;
  showDislike?: boolean;
  showLike?: boolean;
  dislikeLoading?: boolean;
}

function ratingColor(rating: number): string {
  if (rating >= 7) return "text-green-400";
  if (rating >= 5) return "text-yellow-400";
  return "text-red-400";
}

function certBadgeColor(cert: string): string {
  switch (cert) {
    case "G":
      return "bg-green-600";
    case "PG":
      return "bg-blue-600";
    case "PG-13":
      return "bg-yellow-600";
    case "R":
      return "bg-red-600";
    case "NC-17":
      return "bg-red-800";
    default:
      return "bg-gray-600";
  }
}

export default function MovieCard({
  movie,
  selected,
  watched,
  liked,
  onClick,
  onDislike,
  onLike,
  showDislike,
  showLike,
  dislikeLoading,
}: MovieCardProps) {
  const posterSrc = movie.poster_path
    ? `https://image.tmdb.org/t/p/w342${movie.poster_path}`
    : null;

  return (
    <div
      className={`relative group cursor-pointer transition-transform duration-300
        ${selected ? "scale-105" : "hover:scale-105"}`}
      style={{ perspective: "1000px" }}
      onClick={onClick}
    >
      {/* Flip container */}
      <div
        className="relative w-full transition-transform duration-700"
        style={{
          transformStyle: "preserve-3d",
          transform: watched ? "rotateY(180deg)" : "rotateY(0deg)",
        }}
      >
        {/* Front face - poster */}
        <div
          className={`rounded-xl overflow-hidden bg-gray-800/80 backdrop-blur
            ${selected ? "ring-4 ring-purple-500" : liked ? "ring-2 ring-green-500" : "hover:ring-2 hover:ring-purple-400/50"}`}
          style={{ backfaceVisibility: "hidden" }}
        >
          <div className="relative aspect-[2/3] w-full bg-gray-700">
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

            {/* Rating badge */}
            <div className="absolute top-2 left-2 bg-black/80 rounded-lg px-2 py-1 flex items-center gap-1">
              <svg className="w-3.5 h-3.5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              <span className={`text-xs font-bold ${ratingColor(movie.vote_average)}`}>
                {movie.vote_average.toFixed(1)}
              </span>
            </div>

            {/* Age rating badge */}
            {movie.certification && movie.certification !== "NR" && (
              <div className={`absolute top-2 right-2 ${certBadgeColor(movie.certification)} rounded-md px-1.5 py-0.5`}>
                <span className="text-xs font-bold text-white">{movie.certification}</span>
              </div>
            )}

            {/* Selected checkmark */}
            {selected && (
              <div className="absolute inset-0 bg-purple-500/30 flex items-center justify-center">
                <div className="bg-purple-500 rounded-full p-3">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              </div>
            )}

            {/* Hover overlay with overview */}
            {movie.overview && !selected && (
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-3">
                <p className="text-white text-xs leading-relaxed line-clamp-4">{movie.overview}</p>
              </div>
            )}

            {/* Action buttons - bottom of poster */}
            {(showLike || showDislike) && (
              <div className="absolute bottom-2 right-2 z-10 flex flex-col gap-1.5">
                {showLike && (
                  <button
                    className={`rounded-full p-1.5 transition-colors shadow-lg
                      ${liked ? "bg-green-600 hover:bg-green-700" : "bg-gray-900/80 hover:bg-green-600"}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      onLike?.();
                    }}
                    title={liked ? "Unlike" : "Like this movie"}
                  >
                    <svg className="w-4 h-4 text-white" fill={liked ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.904 0 .715-.211 1.413-.608 2.008L7 11V21m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
                    </svg>
                  </button>
                )}
                {showDislike && (
                  <button
                    className="rounded-full p-1.5 bg-gray-900/80 hover:bg-red-600 transition-colors shadow-lg"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDislike?.();
                    }}
                    disabled={dislikeLoading}
                    title="Don't like this — replace it"
                  >
                    {dislikeLoading ? (
                      <svg className="w-4 h-4 text-white animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14H5.236a2 2 0 01-1.789-2.894l3.5-7A2 2 0 018.736 3h4.018a2 2 0 01.485.06l3.76.94m-7 10v5a2 2 0 002 2h.096c.5 0 .905-.405.905-.904 0-.715.211-1.413.608-2.008L17 13V4m-7 10h2m5-10h2a2 2 0 012 2v6a2 2 0 01-2 2h-2.5" />
                      </svg>
                    )}
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Title */}
          <div className="p-3">
            <h3 className="text-white text-sm font-medium truncate">{movie.title}</h3>
            <div className="flex items-center gap-2 mt-1">
              {movie.certification && (
                <span className="text-gray-400 text-xs">{movie.certification}</span>
              )}
              <span className="text-gray-400 text-xs">
                {movie.vote_average.toFixed(1)}/10
              </span>
            </div>
          </div>
        </div>

        {/* Back face - watched state */}
        <div
          className="absolute inset-0 rounded-xl overflow-hidden bg-gradient-to-br from-green-800 to-green-950 flex flex-col items-center justify-center p-4"
          style={{
            backfaceVisibility: "hidden",
            transform: "rotateY(180deg)",
          }}
        >
          <div className="bg-green-500 rounded-full p-4 mb-3">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <p className="text-white text-lg font-bold mb-1">Watched!</p>
          <p className="text-green-200 text-xs text-center line-clamp-3">{movie.title}</p>
          <p className="text-green-300 text-[10px] uppercase tracking-wider mt-3">Loading next...</p>
        </div>
      </div>
    </div>
  );
}
