import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Premium Features",
  description:
    "Unlock the full Next Movie experience. Language filters, actor search, unlimited history, watchlists, and more — coming soon.",
};

const FEATURES = [
  {
    icon: "🌍",
    title: "Multi-Language Picks",
    description:
      "Find movies in 20+ languages. Korean dramas, French films, Bollywood hits, anime — all in one place.",
    tag: "Filter",
  },
  {
    icon: "🎬",
    title: "Search by Actor or Director",
    description:
      "Love Tom Hanks? Type his name and filter every result to show only his films. Works for directors too.",
    tag: "Filter",
  },
  {
    icon: "📺",
    title: "Filter by Streaming Platform",
    description:
      "Only show movies on Netflix, Disney+, Prime, or whatever you pay for. No more finding a great movie you can't watch.",
    tag: "Filter",
  },
  {
    icon: "🎚️",
    title: "Advanced Filters",
    description:
      "Narrow by decade, minimum rating, or runtime. Want 90s comedies rated 7+? Done in two taps.",
    tag: "Filter",
  },
  {
    icon: "👨‍👩‍👧‍👦",
    title: "Unlimited Family Members",
    description:
      "Free users get 2 profiles. Premium lets the whole family join — grandparents, cousins, everyone.",
    tag: "Family",
  },
  {
    icon: "📋",
    title: "Personal Watchlist",
    description:
      "Save movies for later with one tap. Your list stays with you across devices when you sign in.",
    tag: "Organize",
  },
  {
    icon: "📊",
    title: "Taste Profile & Stats",
    description:
      "See your top genres, how many movies you've rated, and how your taste has changed over time.",
    tag: "Insights",
  },
  {
    icon: "🕰️",
    title: "Unlimited History",
    description:
      "Free users see their last 3 searches. Premium keeps your full history so you can always pick up where you left off.",
    tag: "Organize",
  },
  {
    icon: "🔀",
    title: "Family Swipe Mode",
    description:
      "Everyone in the family swipes on movies. We find the one title you all agree on. No more arguments.",
    tag: "Family",
  },
  {
    icon: "🧠",
    title: "Smarter AI Over Time",
    description:
      "The more you use it, the better it gets. Premium unlocks deeper taste learning across all your sessions.",
    tag: "AI",
  },
];

export default function PremiumPage() {
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
        {/* Hero */}
        <div className="text-center mb-16">
          <div className="mx-auto mb-6 w-32 h-32">
            <Image
              src="/popcorn--king.png"
              alt="Premium popcorn mascot"
              width={128}
              height={128}
              className="w-full h-full object-contain drop-shadow-2xl"
              priority
            />
          </div>
          <div className="inline-flex items-center gap-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white text-xs font-bold uppercase tracking-wider px-4 py-1.5 rounded-full mb-4">
            Premium
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold mb-4">
            Get more from{" "}
            <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              movie night
            </span>
          </h1>
          <p className="text-gray-400 text-lg max-w-xl mx-auto">
            Everything you love about Next Movie, plus powerful filters,
            unlimited history, and tools built for serious movie fans.
          </p>
        </div>

        {/* Feature grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-16">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="bg-gray-800/40 border border-gray-700/40 rounded-2xl p-6 hover:border-purple-600/30 transition-colors"
            >
              <div className="flex items-start gap-4">
                <span className="text-3xl flex-shrink-0">{f.icon}</span>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-white font-bold">{f.title}</h3>
                  </div>
                  <span className="inline-block text-[10px] font-semibold uppercase tracking-wider text-purple-400 bg-purple-900/40 px-2 py-0.5 rounded-full mb-2">
                    {f.tag}
                  </span>
                  <p className="text-gray-400 text-sm leading-relaxed">
                    {f.description}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Coming soon CTA */}
        <div className="max-w-lg mx-auto text-center">
          <div className="bg-purple-950/40 border border-purple-700/30 rounded-2xl p-8 mb-6">
            <h2 className="text-2xl font-bold text-white mb-2">Coming Soon</h2>
            <p className="text-gray-400 mb-6">
              We&apos;re building Premium right now. Sign up for free today
              and you&apos;ll be first to know when it launches.
            </p>
            <Link
              href="/"
              className="inline-block bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white rounded-2xl px-8 py-4 text-lg font-bold transition-all hover:scale-105"
            >
              Start Movie Night — Free
            </Link>
          </div>
          <Link href="/" className="text-gray-500 hover:text-gray-300 text-sm transition-colors">
            &larr; Back to Next Movie
          </Link>
        </div>

        {/* SEO content */}
        <section className="mt-20 border-t border-gray-800/50 pt-12">
          <h2 className="text-2xl font-bold text-center mb-8">
            Why upgrade to Premium?
          </h2>
          <div className="max-w-2xl mx-auto space-y-6 text-gray-400 text-sm leading-relaxed">
            <p>
              The free version of Next Movie gives you smart AI picks, mood search,
              genre browsing, and age-safe filters. It works great for casual movie nights.
            </p>
            <p>
              Premium takes it further. Filter by language to find Korean thrillers
              or French dramas. Search by actor or director to see only their films.
              Pick your streaming platform so every pick is one you can actually watch.
            </p>
            <p>
              Your full search history stays with you. Save movies to a personal
              watchlist. See stats about your taste — which genres you love most,
              how many films you&apos;ve rated, and more.
            </p>
            <p>
              Plus, the AI gets smarter the more you use it. Premium unlocks
              deeper taste learning so your picks keep getting better over time.
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
            &copy; {new Date().getFullYear()} nextmovie.app
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
