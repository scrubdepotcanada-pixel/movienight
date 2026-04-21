import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import { BLOG_POSTS, getPostBySlug, formatDate, type BlogSection } from "@/lib/blog";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return BLOG_POSTS.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) return {};

  return {
    title: `${post.title} | Next Movie Blog`,
    description: post.description,
    alternates: {
      canonical: `https://nextmovie.app/blog/${post.slug}`,
    },
    openGraph: {
      title: post.title,
      description: post.description,
      url: `https://nextmovie.app/blog/${post.slug}`,
      siteName: "Next Movie",
      locale: "en_US",
      type: "article",
      publishedTime: post.date,
    },
  };
}

function RenderSection({ section }: { section: BlogSection }) {
  switch (section.type) {
    case "h2":
      return (
        <h2 className="text-2xl font-bold text-white mt-10 mb-4">
          {section.text}
        </h2>
      );
    case "h3":
      return (
        <h3 className="text-lg font-bold text-white mt-6 mb-2">
          {section.text}
        </h3>
      );
    case "paragraph":
      return (
        <p className="text-gray-300 leading-relaxed mb-4">{section.text}</p>
      );
    case "ul":
      return (
        <ul className="list-disc list-inside space-y-2 mb-4 text-gray-300">
          {section.items?.map((item, i) => (
            <li key={i} className="leading-relaxed">
              {item}
            </li>
          ))}
        </ul>
      );
    case "ol":
      return (
        <ol className="list-decimal list-inside space-y-2 mb-4 text-gray-300">
          {section.items?.map((item, i) => (
            <li key={i} className="leading-relaxed">
              {item}
            </li>
          ))}
        </ol>
      );
    default:
      return null;
  }
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const post = getPostBySlug(slug);

  if (!post) notFound();

  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.description,
    datePublished: post.date,
    author: {
      "@type": "Organization",
      name: "Next Movie",
      url: "https://nextmovie.app",
    },
    publisher: {
      "@type": "Organization",
      name: "Next Movie",
      url: "https://nextmovie.app",
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `https://nextmovie.app/blog/${post.slug}`,
    },
  };

  const otherPosts = BLOG_POSTS.filter((p) => p.slug !== post.slug).slice(0, 3);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-purple-950 text-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
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
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xs text-gray-500 mb-8">
          <Link href="/blog" className="hover:text-gray-300 transition-colors">
            Blog
          </Link>
          <span>/</span>
          <span className="text-gray-400 truncate">{post.title}</span>
        </div>

        {/* Article header */}
        <div className="mb-10">
          <div className="mb-4">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-purple-400 bg-purple-900/40 px-2 py-0.5 rounded-full">
              {post.category}
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-white leading-tight mb-4">
            {post.title}
          </h1>
          <p className="text-gray-400 text-lg leading-relaxed mb-4">
            {post.description}
          </p>
          <div className="flex items-center gap-3 text-xs text-gray-500">
            <span>{formatDate(post.date)}</span>
            <span>&middot;</span>
            <span>{post.readTime}</span>
          </div>
        </div>

        {/* Hero image */}
        <div className="bg-gray-800/40 border border-gray-700/40 rounded-2xl flex items-center justify-center py-12 mb-10">
          <Image
            src={post.image}
            alt={post.imageAlt}
            width={200}
            height={200}
            className="object-contain drop-shadow-2xl"
            priority
          />
        </div>

        {/* Article body */}
        <article className="prose-invert max-w-none">
          {post.content.map((section, i) => (
            <RenderSection key={i} section={section} />
          ))}
        </article>

        {/* CTA */}
        <div className="mt-12 bg-gradient-to-r from-purple-900/40 to-pink-900/40 border border-purple-700/30 rounded-2xl p-8 text-center">
          <p className="text-lg font-bold text-white mb-2">
            Ready to find your next movie?
          </p>
          <p className="text-gray-400 text-sm mb-6">
            Next Movie is free. AI-powered picks, age-safe filters, and Family Swipe mode.
          </p>
          <Link
            href="/"
            className="inline-block bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white rounded-xl px-8 py-3 font-bold transition-all shadow-md shadow-purple-900/30"
          >
            Start Movie Night — It&apos;s Free
          </Link>
        </div>

        {/* More articles */}
        {otherPosts.length > 0 && (
          <section className="mt-14">
            <h2 className="text-xl font-bold text-white mb-6">More from the blog</h2>
            <div className="space-y-4">
              {otherPosts.map((p) => (
                <Link
                  key={p.slug}
                  href={`/blog/${p.slug}`}
                  className="group flex items-center gap-4 bg-gray-800/40 border border-gray-700/40 rounded-2xl p-4 hover:border-purple-600/40 transition-colors"
                >
                  <div className="w-14 h-14 flex-shrink-0 bg-gray-900/60 rounded-xl flex items-center justify-center">
                    <Image
                      src={p.image}
                      alt={p.imageAlt}
                      width={40}
                      height={40}
                      className="object-contain"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-white group-hover:text-purple-300 transition-colors leading-snug line-clamp-2">
                      {p.title}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">{formatDate(p.date)}</p>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        <div className="text-center mt-10">
          <Link
            href="/blog"
            className="text-gray-500 hover:text-gray-300 text-sm transition-colors"
          >
            &larr; All articles
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
