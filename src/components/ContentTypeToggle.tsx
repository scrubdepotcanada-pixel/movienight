"use client";

interface ContentTypeToggleProps {
  value: "movie" | "show";
  onChange: (value: "movie" | "show") => void;
}

export default function ContentTypeToggle({ value, onChange }: ContentTypeToggleProps) {
  return (
    <div className="inline-flex bg-gray-800/60 border border-gray-700/50 rounded-full p-1">
      <button
        onClick={() => onChange("movie")}
        className={`px-5 py-2 rounded-full text-sm font-medium transition-all ${
          value === "movie"
            ? "bg-purple-600 text-white shadow-lg shadow-purple-600/30"
            : "text-gray-400 hover:text-white"
        }`}
      >
        Movies
      </button>
      <button
        onClick={() => onChange("show")}
        className={`px-5 py-2 rounded-full text-sm font-medium transition-all ${
          value === "show"
            ? "bg-purple-600 text-white shadow-lg shadow-purple-600/30"
            : "text-gray-400 hover:text-white"
        }`}
      >
        Shows
      </button>
    </div>
  );
}
