"use client";

import { useState, useEffect } from "react";
import Image from "next/image";

interface FilmMovie {
  id: number;
  title: string;
  poster_path: string | null;
  vote_average: number;
  certification?: string;
  overview?: string;
  release_date?: string;
}

interface PersonFilmographyProps {
  personId: number;
  personName: string;
  role: string;
  onClose: () => void;
  onSelectMovie?: (movie: FilmMovie) => void;
}

export default function PersonFilmography({ personId, personName, role, onClose, onSelectMovie }: PersonFilmographyProps) {
  const [movies, setMovies] = useState<FilmMovie[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/movies/person?personId=${personId}`)
      .then((r) => r.json())
      .then((d) => { setMovies(Array.isArray(d) ? d : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [personId]);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-gray-900 border border-gray-700/50 rounded-3xl max-w-lg w-full p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-white text-xl">&times;</button>

        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full mb-3">
            Filmography
          </div>
          <h2 className="text-xl font-bold text-white">{personName}</h2>
          <p className="text-gray-400 text-sm">{role}</p>
        </div>

        {loading ? (
          <div className="flex justify-center py-8">
            <div className="w-10 h-10 rounded-full border-4 border-gray-700 border-t-purple-500 animate-spin" />
          </div>
        ) : movies.length === 0 ? (
          <p className="text-center text-gray-400 py-8">No movies found.</p>
        ) : (
          <div className="grid grid-cols-3 gap-3">
            {movies.map((movie) => {
              const posterSrc = movie.poster_path
                ? `https://image.tmdb.org/t/p/w185${movie.poster_path}`
                : null;
              const year = movie.release_date?.slice(0, 4);

              return (
                <button
                  key={movie.id}
                  onClick={() => onSelectMovie?.(movie)}
                  className="group text-left"
                >
                  <div className="relative aspect-[2/3] rounded-xl overflow-hidden bg-gray-800 mb-1.5">
                    {posterSrc ? (
                      <Image src={posterSrc} alt={movie.title} fill className="object-cover group-hover:scale-105 transition-transform" sizes="120px" unoptimized />
                    ) : (
                      <div className="flex items-center justify-center h-full text-gray-500 text-xs text-center p-2">{movie.title}</div>
                    )}
                    <div className="absolute bottom-1 left-1 bg-black/80 rounded px-1.5 py-0.5">
                      <span className="text-yellow-400 text-[10px] font-bold">{movie.vote_average.toFixed(1)}</span>
                    </div>
                  </div>
                  <p className="text-gray-300 text-xs font-medium truncate group-hover:text-white transition-colors">{movie.title}</p>
                  {year && <p className="text-gray-600 text-[10px]">{year}</p>}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
