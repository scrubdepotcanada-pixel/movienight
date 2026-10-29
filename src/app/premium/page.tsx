import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import PricingCards from "@/components/PricingCards";
import SiteFooter from "@/components/SiteFooter";

export const metadata: Metadata = {
  title: "Premium Features",
  description:
    "Next Movie Premium adds actor and director search and unlimited family members. Everything else — AI picks, mood search, and more — stays free.",
};

const FEATURES = [
  {
    icon: "🎬",
    title: "Search by Actor or Director",
    description:
      "Love Tom Hanks? Type his name and filter every result to show only his films. Works for directors too.",
    tag: "Filter",
  },
  {
    icon: "👨‍👩‍👧‍👦",
    title: "Unlimited Family Members",
    description:
      "Free users get 2 profiles. Premium lets the whole family join — grandparents, cousins, everyone.",
    tag: "Family",
  },
];

const COMING_SOON = [
  "Language filters — find movies in 20+ languages",
  "Streaming-platform filter — show only movies on a service you pick",
  "Rating and runtime filters",
  "Personal watchlist",
  "Taste profile & stats",
  "Family Swipe Mode — everyone swipes, we find the title you all agree on",
];

const FREE_FEATURES = [
  "AI movie and TV picks from 3–5 movies you love",
  "Mood search and title search",
  "Age-safe rating caps for each family member",
  "Tell us your streaming services — picks you can watch tonight rank first",
  "Decade filter, genre browsing, and a reason on every pick: why we chose it for you",
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
            Everything you love about Next Movie, plus actor and director
            search and room for the whole family.
          </p>
        </div>

        {/* Feature grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-10 max-w-2xl mx-auto">
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

        {/* Coming soon — built, not included yet */}
        <div className="max-w-2xl mx-auto mb-10 bg-gray-800/20 border border-gray-700/30 rounded-2xl p-6">
          <h2 className="text-lg font-bold text-white mb-2">Coming soon</h2>
          <p className="text-gray-500 text-sm mb-4">
            These are built and on the way. They are not included in Premium
            today, and we will not charge you for them as if they were — when
            each one launches, it will be added to Premium at no extra cost.
          </p>
          <ul className="space-y-2">
            {COMING_SOON.map((item) => (
              <li key={item} className="flex items-start gap-2 text-gray-400 text-sm">
                <span className="text-gray-600 mt-0.5">•</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Free for everyone */}
        <div className="max-w-2xl mx-auto mb-16 bg-purple-900/10 border border-purple-700/20 rounded-2xl p-6">
          <h2 className="text-lg font-bold text-white mb-4">
            Free for everyone, no account needed to start
          </h2>
          <ul className="space-y-2">
            {FREE_FEATURES.map((item) => (
              <li key={item} className="flex items-start gap-2 text-gray-300 text-sm">
                <span className="text-green-500 mt-0.5">✓</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Pricing */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-center mb-3">Choose your plan</h2>
          <p className="text-gray-500 text-sm text-center max-w-xl mx-auto mb-8">
            Premium today means: actor and director search, plus unlimited
            family members. Everything in &quot;Free for everyone&quot; stays free.
          </p>
          <PricingCards />
        </div>

        <div className="text-center mb-8">
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
              Premium adds two things today. Search by actor or director, so
              if you love Tom Hanks or Greta Gerwig you can see only their
              films. And unlimited family members, so grandparents, cousins,
              and everyone else get their own profile and taste — free
              covers 2 profiles.
            </p>
            <p>
              More is coming — language and streaming-platform filters, a
              watchlist, taste stats, and Family Swipe Mode are built and on
              the way. They are not included yet, and when they launch they
              will be added to Premium at no extra cost.
            </p>
          </div>
        </section>
      </main>

      {/* Footer */}
      <SiteFooter />
    </div>
  );
}
