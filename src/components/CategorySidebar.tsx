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
    <div className="w-full">
      <div className="flex flex-wrap items-center gap-2 justify-center">
        <span className="text-xs text-gray-500 uppercase tracking-wider font-medium">
          {category} history:
        </span>

        {likedMovies.map((m, i) => (
          <span
            key={`liked-${i}`}
            className="group inline-flex items-center gap-1 bg-green-900/30 border border-green-700/40 text-green-300 text-xs px-2.5 py-1 rounded-full"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.904 0 .715-.211 1.413-.608 2.008L7 11V21m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
            </svg>
            {m.title}
            {onRemoveLike && (
              <button
                onClick={() => onRemoveLike(m.title)}
                className="text-green-400 hover:text-red-400 transition-colors font-bold text-sm leading-none ml-0.5"
                title="Remove"
              >
                &times;
              </button>
            )}
          </span>
        ))}

        {dislikedMovies.map((m, i) => (
          <span
            key={`disliked-${i}`}
            className="group inline-flex items-center gap-1 bg-red-900/30 border border-red-700/40 text-red-300 text-xs px-2.5 py-1 rounded-full"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14H5.236a2 2 0 01-1.789-2.894l3.5-7A2 2 0 018.736 3h4.018a2 2 0 01.485.06l3.76.94m-7 10v5a2 2 0 002 2h.096c.5 0 .905-.405.905-.904 0-.715.211-1.413.608-2.008L17 13V4m-7 10h2m5-10h2a2 2 0 012 2v6a2 2 0 01-2 2h-2.5" />
            </svg>
            <span className="line-through">{m.title}</span>
            {onRemoveDislike && m.tmdb_id && (
              <button
                onClick={() => onRemoveDislike(m.tmdb_id!)}
                className="text-red-400 hover:text-red-300 transition-colors font-bold text-sm leading-none ml-0.5"
                title="Remove"
              >
                &times;
              </button>
            )}
          </span>
        ))}
      </div>
    </div>
  );
}
