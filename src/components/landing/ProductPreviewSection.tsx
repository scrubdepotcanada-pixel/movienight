"use client";

const mockProfiles = [
  { name: "Mom", avatar: "👩", color: "from-purple-500 to-pink-500" },
  { name: "Dad", avatar: "👨", color: "from-blue-500 to-cyan-500" },
  { name: "Sam", avatar: "🧒", color: "from-green-500 to-emerald-500" },
  { name: "Lily", avatar: "👧", color: "from-yellow-500 to-orange-500" },
];

const mockGenres = ["Action", "Comedy", "Animated", "Sci-Fi", "Family"];

const mockMovies = [
  {
    title: "The Grand Adventure",
    rating: "8.4",
    certification: "PG",
    gradient: "from-indigo-800 to-purple-900",
  },
  {
    title: "Starlight Express",
    rating: "7.9",
    certification: "PG",
    gradient: "from-pink-800 to-rose-900",
  },
  {
    title: "Laugh Factory",
    rating: "8.1",
    certification: "PG",
    gradient: "from-amber-800 to-orange-900",
  },
  {
    title: "Ocean Explorers",
    rating: "8.7",
    certification: "G",
    gradient: "from-teal-800 to-cyan-900",
  },
  {
    title: "Secret Kingdom",
    rating: "7.6",
    certification: "PG",
    gradient: "from-emerald-800 to-green-900",
  },
];

export default function ProductPreviewSection() {
  return (
    <section className="px-4 py-20 sm:py-24">
      <div className="max-w-5xl mx-auto">
        {/* Section label */}
        <div className="text-center mb-12">
          <p className="text-sm font-medium text-purple-400 uppercase tracking-wider mb-3">
            See it in action
          </p>
          <h2 className="text-3xl sm:text-4xl font-bold">
            Your family&apos;s new{" "}
            <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              movie command center
            </span>
          </h2>
        </div>

        {/* Mock UI */}
        <div className="relative bg-gray-800/50 backdrop-blur border border-gray-700/50 rounded-2xl p-6 sm:p-8 shadow-2xl shadow-purple-900/10">
          {/* Fake browser chrome */}
          <div className="flex items-center gap-2 mb-6 pb-4 border-b border-gray-700/50">
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full bg-red-500/60" />
              <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
              <div className="w-3 h-3 rounded-full bg-green-500/60" />
            </div>
            <div className="flex-1 flex justify-center">
              <div className="bg-gray-900/80 rounded-lg px-4 py-1 text-xs text-gray-500 border border-gray-700/30">
                nextmovie.app
              </div>
            </div>
          </div>

          {/* Profiles row */}
          <div className="mb-6">
            <p className="text-sm text-gray-500 mb-3">Who&apos;s watching?</p>
            <div className="flex gap-3 flex-wrap">
              {mockProfiles.map((profile) => (
                <div
                  key={profile.name}
                  className="flex items-center gap-2 bg-gray-900/60 border border-gray-700/40 rounded-xl px-4 py-2.5 hover:border-purple-500/50 transition-colors"
                >
                  <span className="text-xl">{profile.avatar}</span>
                  <span className="text-sm font-medium text-gray-300">
                    {profile.name}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Genre pills */}
          <div className="mb-6">
            <p className="text-sm text-gray-500 mb-3">Set the vibe</p>
            <div className="flex gap-2 flex-wrap">
              {mockGenres.map((genre, i) => (
                <span
                  key={genre}
                  className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                    i === 0
                      ? "bg-purple-600/30 text-purple-300 border border-purple-500/40"
                      : "bg-gray-900/60 text-gray-400 border border-gray-700/40"
                  }`}
                >
                  {genre}
                </span>
              ))}
            </div>
          </div>

          {/* Movie recommendation cards */}
          <div>
            <p className="text-sm text-gray-500 mb-3">
              Your picks are ready
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
              {mockMovies.map((movie) => (
                <div key={movie.title} className="group">
                  {/* Poster placeholder */}
                  <div
                    className={`aspect-[2/3] rounded-xl bg-gradient-to-br ${movie.gradient} mb-2 flex items-end p-3 relative overflow-hidden`}
                  >
                    {/* Film grain texture effect */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                    <div className="relative w-full">
                      <p className="text-xs font-semibold text-white leading-tight">
                        {movie.title}
                      </p>
                    </div>
                  </div>
                  {/* Meta info */}
                  <div className="flex items-center justify-between px-1">
                    <span className="text-xs text-yellow-400">
                      ★ {movie.rating}
                    </span>
                    <span className="text-xs text-gray-500 bg-gray-800 rounded px-1.5 py-0.5">
                      {movie.certification}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
