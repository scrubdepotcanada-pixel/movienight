import Link from "next/link";

export default function SiteFooter() {
  return (
    <footer className="border-t border-gray-800/50 py-8 px-4 mt-12">
      <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-sm">🎬</span>
          <span className="text-sm font-semibold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            Next Movie
          </span>
        </Link>
        <div className="flex items-center flex-wrap justify-center gap-x-4 gap-y-1 text-gray-600 text-xs">
          <Link href="/faq" className="hover:text-gray-400 transition-colors">FAQ</Link>
          <Link href="/genres" className="hover:text-gray-400 transition-colors">Genres</Link>
          <Link href="/premium" className="hover:text-gray-400 transition-colors">Premium</Link>
          <Link href="/privacy" className="hover:text-gray-400 transition-colors">Privacy</Link>
          <Link href="/terms" className="hover:text-gray-400 transition-colors">Terms</Link>
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
  );
}
