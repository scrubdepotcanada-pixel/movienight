"use client";

const GENRES = [
  { id: "action", label: "Action", icon: "💥" },
  { id: "comedy", label: "Comedy", icon: "😂" },
  { id: "drama", label: "Drama", icon: "🎭" },
  { id: "horror", label: "Horror", icon: "👻" },
  { id: "sci-fi", label: "Sci-Fi", icon: "🚀" },
  { id: "romance", label: "Romance", icon: "💕" },
  { id: "thriller", label: "Thriller", icon: "🔪" },
  { id: "animation", label: "Animation", icon: "✨" },
  { id: "documentary", label: "Documentary", icon: "📹" },
  { id: "fantasy", label: "Fantasy", icon: "🧙" },
  { id: "mystery", label: "Mystery", icon: "🔍" },
  { id: "adventure", label: "Adventure", icon: "🗺️" },
];

export { GENRES };

interface GenreSelectorProps {
  onSelect: (genreId: string) => void;
  loading?: boolean;
}

export default function GenreSelector({ onSelect, loading }: GenreSelectorProps) {
  return (
    <div className="w-full max-w-3xl mx-auto">
      <h3 className="text-center text-gray-400 text-sm mb-4">Or browse by category</h3>
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
        {GENRES.map((genre) => (
          <button
            key={genre.id}
            onClick={() => onSelect(genre.id)}
            disabled={loading}
            className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-gray-800/60 hover:bg-purple-600/30 hover:ring-1 hover:ring-purple-500/50 transition-all disabled:opacity-50"
          >
            <span className="text-2xl">{genre.icon}</span>
            <span className="text-white text-xs font-medium">{genre.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
