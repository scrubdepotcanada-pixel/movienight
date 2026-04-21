import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Browse Movie Genres — Find the Best Movies by Category",
  description:
    "Explore 12 movie genres on Next Movie. Find the best action, comedy, horror, sci-fi, drama, and family movies. AI-powered picks tailored to your taste.",
  alternates: {
    canonical: "https://nextmovie.app/genres",
  },
  openGraph: {
    title: "Browse Movie Genres — Find the Best Movies by Category",
    description:
      "Explore 12 movie genres on Next Movie. Find the best action, comedy, horror, sci-fi, drama, and family movies. AI-powered picks tailored to your taste.",
    url: "https://nextmovie.app/genres",
    siteName: "Next Movie",
    locale: "en_US",
    type: "website",
  },
};

const GENRES = [
  {
    name: "Action",
    emoji: "💥",
    description:
      "High-energy movies packed with stunts, chases, and fight scenes. Think explosions, heroes on a mission, and edge-of-your-seat thrills from start to finish.",
  },
  {
    name: "Comedy",
    emoji: "😂",
    description:
      "Movies that make you laugh out loud. From slapstick and rom-coms to dry wit and satire, comedy is the perfect pick when you want to unwind and have fun.",
  },
  {
    name: "Drama",
    emoji: "🎭",
    description:
      "Character-driven stories that pull you in emotionally. Drama covers everything from family struggles to courtroom battles, with performances that stick with you long after the credits.",
  },
  {
    name: "Horror",
    emoji: "👻",
    description:
      "Scares, suspense, and things that go bump in the night. Horror movies range from creepy slow burns to jump-scare thrill rides. Not for the faint of heart.",
  },
  {
    name: "Sci-Fi",
    emoji: "🚀",
    description:
      "Futuristic worlds, space travel, and mind-bending technology. Sci-fi movies explore big ideas about humanity, AI, and the unknown. Great for fans of imagination and wonder.",
  },
  {
    name: "Romance",
    emoji: "💕",
    description:
      "Love stories that warm your heart. Whether it is a first crush or a second chance, romance movies deliver butterflies, grand gestures, and happy endings.",
  },
  {
    name: "Thriller",
    emoji: "🔪",
    description:
      "Tense, gripping stories full of twists and suspense. Thrillers keep you guessing until the very last scene. Perfect for movie nights when you want to be on the edge of your seat.",
  },
  {
    name: "Animation",
    emoji: "🎨",
    description:
      "Colorful, creative movies for all ages. From Pixar classics to anime epics, animated films tell powerful stories with stunning visuals. Families love this genre.",
  },
  {
    name: "Documentary",
    emoji: "🎥",
    description:
      "Real stories from the real world. Documentaries cover true crime, nature, history, sports, and more. Learn something new while being thoroughly entertained.",
  },
  {
    name: "Fantasy",
    emoji: "🧙",
    description:
      "Magic, mythical creatures, and epic quests. Fantasy movies transport you to other worlds with rich lore and unforgettable adventures. A favorite for families and dreamers.",
  },
  {
    name: "Family",
    emoji: "👨‍👩‍👧‍👦",
    description:
      "Movies the whole family can enjoy together. Family films are age-appropriate, heartwarming, and fun for kids and adults alike. The go-to genre for movie night.",
  },
  {
    name: "Mystery",
    emoji: "🔍",
    description:
      "Whodunits, puzzles, and hidden clues. Mystery movies challenge you to solve the case before the characters do. Great for viewers who love to think and piece things together.",
  },
];

export default function GenresPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-purple-950 text-white">
      {/* Header */}
      <header className="border-b border-gray-800/50 bg-gray-950/80 backdrop-blur-lg sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              Next Movie
            </span>
          </Link>
          <Link
            href="/"
            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white rounded-xl px-5 py-2 text-sm font-bold transition-all"
          >
            Try It Free
          </Link>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-12">
        {/* Page heading */}
        <div className="text-center mb-12">
          <h1 className="text-4xl sm:text-5xl font-bold mb-4">
            Browse by{" "}
            <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              Genre
            </span>
          </h1>
          <p className="text-gray-400 text-lg max-w-xl mx-auto">
            Pick a genre and let the AI find movies you will love. Next Movie
            learns your taste across all 12 categories.
          </p>
        </div>

        {/* Genre grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-16">
          {GENRES.map((genre) => (
            <div
              key={genre.name}
              className="bg-gray-800/40 border border-gray-700/40 rounded-2xl p-6 hover:border-purple-600/30 transition-colors flex flex-col"
            >
              <div className="flex items-center gap-3 mb-3">
                <span className="text-3xl">{genre.emoji}</span>
                <h2 className="text-lg font-bold text-white">
                  {genre.name} Movies
                </h2>
              </div>
              <p className="text-gray-400 text-sm leading-relaxed mb-4 flex-1">
                {genre.description}
              </p>
              <Link
                href="/"
                className="inline-flex items-center justify-center bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white rounded-xl px-5 py-2.5 text-sm font-bold transition-all shadow-md shadow-purple-900/30"
              >
                Browse {genre.name}
              </Link>
            </div>
          ))}
        </div>

        {/* SEO content */}
        <section className="border-t border-gray-800/50 pt-12 mb-12">
          <h2 className="text-2xl font-bold text-center mb-6">
            Find the best movies in every genre
          </h2>
          <div className="max-w-2xl mx-auto space-y-4 text-gray-400 text-sm leading-relaxed">
            <p>
              Next Movie covers 12 popular genres so you always find something
              worth watching. The AI tracks your taste in each genre
              independently. Love sci-fi but hate horror? It knows the
              difference.
            </p>
            <p>
              Every recommendation is filtered by age rating, so families can
              browse any genre safely. Set each profile to G, PG, PG-13, or R
              and only see movies that fit.
            </p>
            <p>
              Start browsing now at{" "}
              <Link
                href="/"
                className="text-purple-400 hover:text-purple-300 transition-colors"
              >
                nextmovie.app
              </Link>{" "}
              and discover your next favorite movie in seconds.
            </p>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-800/50 py-8 px-4 mt-12">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-sm">🎬</span>
            <span className="text-sm font-semibold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              Next Movie
            </span>
          </Link>
          <p className="text-gray-600 text-xs">
            &copy; {new Date().getFullYear()} nextmovie.app. All rights
            reserved.
          </p>
          <a
            href="https://thewebguys.ca"
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-600 hover:text-purple-400 text-xs transition-colors"
          >
            Built by thewebguys.ca
          </a>
        </div>
      </footer>
    </div>
  );
}
