import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import { BLOG_POSTS, formatDate } from "@/lib/blog";

export const metadata: Metadata = {
  title: "Blog — Movie Tips, Reviews & Family Picks | Next Movie",
  description:
    "Movie night tips, family film guides, AI recommendation insights, and world cinema picks. The Next Movie blog helps families find great movies faster.",
  alternates: {
    canonical: "https://nextmovie.app/blog",
  },
  openGraph: {
    title: "Blog — Movie Tips, Reviews & Family Picks | Next Movie",
    description:
      "Movie night tips, family film guides, AI recommendation insights, and world cinema picks. The Next Movie blog helps families find great movies faster.",
    url: "https://nextmovie.app/blog",
    siteName: "Next Movie",
    locale: "en_US",
    type: "website",
  },
};

export default function BlogPage() {
  const [featured, ...rest] = BLOG_POSTS;

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
        {/* Heading */}
        <div className="text-center mb-12">
          <h1 className="text-4xl sm:text-5xl font-bold mb-4">
            The Next Movie{" "}
            <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              Blog
            </span>
          </h1>
          <p className="text-gray-400 text-lg max-w-xl mx-auto">
            Movie night tips, family film guides, and picks from world cinema.
          </p>
        </div>

        {/* Featured post */}
        <Link
          href={`/blog/${featured.slug}`}
          className="group block bg-gray-800/40 border border-gray-700/40 rounded-2xl overflow-hidden hover:border-purple-600/40 transition-colors mb-10"
        >
          <div className="sm:flex">
            <div className="sm:w-64 sm:flex-shrink-0 bg-gray-900/60 flex items-center justify-center p-8">
              <Image
                src={featured.image}
                alt={featured.imageAlt}
                width={160}
                height={160}
                className="object-contain drop-shadow-xl"
              />
            </div>
            <div className="p-6 flex flex-col justify-center">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-purple-400 bg-purple-900/40 px-2 py-0.5 rounded-full">
                  {featured.category}
                </span>
                <span className="text-gray-500 text-xs">Featured</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-white mb-3 group-hover:text-purple-300 transition-colors">
                {featured.title}
              </h2>
              <p className="text-gray-400 text-sm leading-relaxed mb-4">
                {featured.description}
              </p>
              <div className="flex items-center gap-3 text-xs text-gray-500">
                <span>{formatDate(featured.date)}</span>
                <span>&middot;</span>
                <span>{featured.readTime}</span>
              </div>
            </div>
          </div>
        </Link>

        {/* Article grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {rest.map((post) => (
            <Link
              key={post.slug}
              href={`/blog/${post.slug}`}
              className="group bg-gray-800/40 border border-gray-700/40 rounded-2xl overflow-hidden hover:border-purple-600/40 transition-colors flex flex-col"
            >
              <div className="bg-gray-900/60 flex items-center justify-center py-8">
                <Image
                  src={post.image}
                  alt={post.imageAlt}
                  width={120}
                  height={120}
                  className="object-contain drop-shadow-lg"
                />
              </div>
              <div className="p-5 flex flex-col flex-1">
                <div className="mb-2">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-purple-400 bg-purple-900/40 px-2 py-0.5 rounded-full">
                    {post.category}
                  </span>
                </div>
                <h2 className="text-base font-bold text-white mb-2 group-hover:text-purple-300 transition-colors leading-snug">
                  {post.title}
                </h2>
                <p className="text-gray-400 text-sm leading-relaxed flex-1 mb-4">
                  {post.description}
                </p>
                <div className="flex items-center gap-3 text-xs text-gray-500 mt-auto">
                  <span>{formatDate(post.date)}</span>
                  <span>&middot;</span>
                  <span>{post.readTime}</span>
                </div>
              </div>
            </Link>
          ))}
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
            <Link href="/faq" className="hover:text-gray-400 transition-colors">FAQ</Link>
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
