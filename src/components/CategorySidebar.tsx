"use client";

interface SidebarMovie {
  title: string;
  tmdb_id?: number;
}

interface CategorySidebarProps {
  category: string;
  likedMovies: SidebarMovie[];
  dislikedMovies: SidebarMovie[];
  onRemoveLike?: (title: string) => void;
  onRemoveDislike?: (tmdbId: number) => void;
}

export default function CategorySidebar({
  category,
  likedMovies,
  dislikedMovies,
  onRemoveLike,
  onRemoveDislike,
}: CategorySidebarProps) {
  if (likedMovies.length === 0 && dislikedMovies.length === 0) {
    return null;
  }

  return (
    <div className="bg-gray-800/50 backdrop-blur rounded-xl p-4 w-full">
      <h4 className="text-sm font-semibold text-gray-300 uppercase tracking-wider mb-3">
        Your {category} history
      </h4>

      {likedMovies.length > 0 && (
        <div className="mb-4">
          <p className="text-xs text-green-400 font-medium mb-1.5 flex items-center gap-1">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.904 0 .715-.211 1.413-.608 2.008L7 11V21m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
            </svg>
            Liked
          </p>
          <ul className="space-y-1">
            {likedMovies.map((m, i) => (
              <li key={i} className="group flex items-center justify-between text-xs text-gray-300 pl-5 pr-1 py-0.5">
                <span className="truncate">{m.title}</span>
                {onRemoveLike && (
                  <button
                    onClick={() => onRemoveLike(m.title)}
                    className="opacity-60 sm:opacity-0 sm:group-hover:opacity-100 text-red-400 hover:text-red-300 transition-all ml-2 flex-shrink-0 text-base font-bold w-5 h-5 flex items-center justify-center rounded hover:bg-red-400/20"
                    title="Remove"
                  >
                    &times;
                  </button>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {dislikedMovies.length > 0 && (
        <div>
          <p className="text-xs text-red-400 font-medium mb-1.5 flex items-center gap-1">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14H5.236a2 2 0 01-1.789-2.894l3.5-7A2 2 0 018.736 3h4.018a2 2 0 01.485.06l3.76.94m-7 10v5a2 2 0 002 2h.096c.5 0 .905-.405.905-.904 0-.715.211-1.413.608-2.008L17 13V4m-7 10h2m5-10h2a2 2 0 012 2v6a2 2 0 01-2 2h-2.5" />
            </svg>
            Disliked
          </p>
          <ul className="space-y-1">
            {dislikedMovies.map((m, i) => (
              <li key={i} className="group flex items-center justify-between text-xs text-gray-400 pl-5 pr-1 py-0.5">
                <span className="truncate line-through">{m.title}</span>
                {onRemoveDislike && m.tmdb_id && (
                  <button
                    onClick={() => onRemoveDislike(m.tmdb_id!)}
                    className="opacity-60 sm:opacity-0 sm:group-hover:opacity-100 text-red-400 hover:text-red-300 transition-all ml-2 flex-shrink-0 text-base font-bold w-5 h-5 flex items-center justify-center rounded hover:bg-red-400/20"
                    title="Remove"
                  >
                    &times;
                  </button>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
