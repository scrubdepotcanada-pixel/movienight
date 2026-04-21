import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "FAQ — Common Questions About Next Movie",
  description:
    "Answers to the most common questions about Next Movie. Learn how the free AI movie picker works, what streaming services it supports, and how families use it.",
  alternates: {
    canonical: "https://nextmovie.app/faq",
  },
  openGraph: {
    title: "FAQ — Common Questions About Next Movie",
    description:
      "Answers to the most common questions about Next Movie. Learn how the free AI movie picker works, what streaming services it supports, and how families use it.",
    url: "https://nextmovie.app/faq",
    siteName: "Next Movie",
    locale: "en_US",
    type: "website",
  },
};

const FAQS = [
  {
    question: "What is Next Movie and how does it work?",
    answer:
      "Next Movie is a free AI movie picker that helps you decide what to watch. You tell it your mood, pick a genre, and it suggests movies the whole family will enjoy. Each person gets their own taste profile, so the AI learns what you like over time. Visit nextmovie.app to try it right now.",
  },
  {
    question: "Is Next Movie really free?",
    answer:
      "Yes, Next Movie is 100% free. You do not need a credit card or even an account to start. Just open nextmovie.app, pick a genre, and get recommendations instantly. There is an optional Premium plan with extra filters, but the core experience costs nothing.",
  },
  {
    question: "How is Next Movie different from JustWatch or IMDb?",
    answer:
      "JustWatch and IMDb are great for browsing catalogs, but they do not learn your taste. Next Movie uses AI to study what you like and dislike. It gets smarter every time you rate a movie. It also filters by age rating, which makes it ideal for families.",
  },
  {
    question: "Can I use Next Movie to find family-friendly movies in Canada?",
    answer:
      "Absolutely. Next Movie works in any country, including Canada. You can set each family member's age rating to G, PG, PG-13, or R. The AI only suggests movies that fit each person's rating. Streaming links show Canadian availability too.",
  },
  {
    question: "How does the AI learn what movies I like?",
    answer:
      "Every time you like, dislike, or skip a movie, the AI updates your taste profile. It tracks your preferences across 12 genres independently. So if you love comedies but hate horror, it knows the difference. The more you use nextmovie.app, the better your picks get.",
  },
  {
    question: "Can I filter movies by age rating for my kids?",
    answer:
      "Yes. Each family member gets their own profile with a content rating limit. Set it to G for young children, PG for the whole family, or PG-13 for teens. The AI respects these limits and only shows age-appropriate movies.",
  },
  {
    question: "What streaming services does Next Movie work with?",
    answer:
      "Next Movie shows where each movie is available across Netflix, Disney+, Amazon Prime Video, Apple TV+, Crave, Hulu, and many more. Availability is shown by country, so you always know if you can watch it on a service you already pay for.",
  },
  {
    question: "Is there a Next Movie app I can download?",
    answer:
      "Next Movie is a web app, so there is nothing to download. Just open nextmovie.app in your phone or tablet browser and it works like a native app. You can add it to your home screen for quick access. It loads fast on any device.",
  },
  {
    question: "How does Next Movie compare to Letterboxd for families?",
    answer:
      "Letterboxd is great for movie logging and reviews. Next Movie focuses on finding your next watch as a family. It adds AI taste learning, age-based filters, and Family Swipe mode so everyone agrees on a movie. Think of it as a family-first movie picker rather than a social film diary.",
  },
  {
    question: "Can I find movies in other languages like Korean or French?",
    answer:
      "Yes. With Next Movie Premium, you can filter by language. Find Korean thrillers, French dramas, Bollywood hits, anime, and more. The AI still learns your taste within each language, so your picks stay personal.",
  },
  {
    question: "What is Family Swipe mode?",
    answer:
      "Family Swipe mode lets every family member swipe on movie suggestions, like a group vote. Next Movie finds the title that everyone agrees on. It is the fastest way to end the 'what should we watch' debate. This feature is available on nextmovie.app Premium.",
  },
  {
    question: "Does Next Movie have a premium version?",
    answer:
      "Yes. Next Movie Premium adds language filters, actor and director search, streaming platform filters, unlimited history, personal watchlists, and Family Swipe mode. The free version still gives you AI picks, genre browsing, and age-safe filters at no cost.",
  },
];

export default function FAQPage() {
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQS.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-purple-950 text-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />

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

      <main className="max-w-3xl mx-auto px-4 py-12">
        {/* Page heading */}
        <div className="text-center mb-12">
          <h1 className="text-4xl sm:text-5xl font-bold mb-4">
            Frequently Asked{" "}
            <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              Questions
            </span>
          </h1>
          <p className="text-gray-400 text-lg max-w-xl mx-auto">
            Everything you want to know about Next Movie, the free AI movie
            picker for families.
          </p>
        </div>

        {/* FAQ list */}
        <div className="space-y-6">
          {FAQS.map((faq) => (
            <div
              key={faq.question}
              className="bg-gray-800/40 border border-gray-700/40 rounded-2xl p-6 hover:border-purple-600/30 transition-colors"
            >
              <h2 className="text-lg font-bold text-white mb-3">
                {faq.question}
              </h2>
              <p className="text-gray-400 text-sm leading-relaxed">
                {faq.answer}
              </p>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="text-center mt-12">
          <p className="text-gray-400 mb-4">
            Still have questions? Try Next Movie for free and see for yourself.
          </p>
          <Link
            href="/"
            className="inline-block bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white rounded-xl px-8 py-3 font-bold transition-all shadow-md shadow-purple-900/30"
          >
            Start Movie Night
          </Link>
        </div>
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
          <div className="flex items-center gap-4 text-gray-600 text-xs">
            <Link href="/genres" className="hover:text-gray-400 transition-colors">Genres</Link>
            <Link href="/premium" className="hover:text-gray-400 transition-colors">Premium</Link>
            <a href="mailto:support@nextmovie.app" className="hover:text-gray-400 transition-colors">Contact</a>
          </div>
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
