"use client";

const mockProfiles = [
  { name: "Mom", avatar: "👩" },
  { name: "Dad", avatar: "👨" },
  { name: "Sam", avatar: "🧒" },
  { name: "Lily", avatar: "👧" },
];

const mockGenres = ["Action", "Comedy", "Animated", "Sci-Fi", "Family"];

const mockMovies = [
  {
    title: "Guardians of the Galaxy",
    rating: "8.0",
    certification: "PG-13",
    poster: "https://image.tmdb.org/t/p/w342/r7vmZjiyZw9rpJMQJp0Oz7VnM1g.jpg",
  },
  {
    title: "Up",
    rating: "8.0",
    certification: "PG",
    poster: "https://image.tmdb.org/t/p/w342/vpbaStTMt8qqXaEgnOR2EE4DNJg.jpg",
  },
  {
    title: "Spider-Man: Into the Spider-Verse",
    rating: "8.4",
    certification: "PG",
    poster: "https://image.tmdb.org/t/p/w342/iiZZdoQBEYBv6id8su7ImL0oCbD.jpg",
  },
  {
    title: "Coco",
    rating: "8.2",
    certification: "PG",
    poster: "https://image.tmdb.org/t/p/w342/gGEsBPAijhVUFoiNpgZXqRVWJt2.jpg",
  },
  {
    title: "The Super Mario Bros. Movie",
    rating: "7.6",
    certification: "PG",
    poster: "https://image.tmdb.org/t/p/w342/qNBAXBIQlnOThrVvA6mA2B5ggV6.jpg",
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
                  className="flex items-center gap-2 bg-gray-900/60 border border-gray-700/40 rounded-xl px-4 py-2.5"
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
                  className={`px-4 py-1.5 rounded-full text-sm font-medium ${
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

          {/* Movie recommendation cards with real posters */}
          <div>
            <p className="text-sm text-gray-500 mb-3">
              Your picks are ready
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
              {mockMovies.map((movie) => (
                <div key={movie.title} className="group">
                  <div className="aspect-[2/3] rounded-xl mb-2 relative overflow-hidden bg-gradient-to-br from-purple-900 to-gray-800">
                    <img
                      src={movie.poster}
                      alt={movie.title}
                      className="w-full h-full object-cover"
                      loading="lazy"
                      onError={(e) => { e.currentTarget.style.display = "none"; }}
                    />
                  </div>
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
