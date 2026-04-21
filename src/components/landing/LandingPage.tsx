"use client";

import HeroSection from "./HeroSection";
import SocialProofStrip from "./SocialProofStrip";
import HowItWorksSection from "./HowItWorksSection";
import BenefitsSection from "./BenefitsSection";
import ProductPreviewSection from "./ProductPreviewSection";
import FinalCTASection from "./FinalCTASection";

interface LandingPageProps {
  onSignIn: () => void;
  onGuest: () => void;
}

export default function LandingPage({ onSignIn, onGuest }: LandingPageProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-purple-950 text-white">
      {/* Sticky header */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-gray-800/50 bg-gray-950/80 backdrop-blur-lg">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">🎬</span>
            <span className="text-xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              Next Movie
            </span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={onSignIn}
              className="text-sm text-gray-400 hover:text-white transition-colors"
            >
              Sign in
            </button>
            <button
              onClick={onGuest}
              className="cursor-pointer bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white rounded-xl px-5 py-2 text-sm font-bold transition-all shadow-md shadow-purple-900/30"
            >
              Start Movie Night
            </button>
          </div>
        </div>
      </header>

      {/* Page journey: Hero → Social proof → How it works → Benefits → Preview → CTA */}
      <main>
        <HeroSection onSignIn={onSignIn} onGuest={onGuest} />
        <SocialProofStrip />
        <HowItWorksSection />
        <BenefitsSection />
        <ProductPreviewSection />
        <FinalCTASection onSignIn={onSignIn} onGuest={onGuest} />
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-800/50 py-10 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 mb-8">
            <div>
              <p className="text-gray-400 text-xs uppercase tracking-wider font-semibold mb-3">Product</p>
              <nav className="flex flex-col gap-2">
                <a href="/" className="text-gray-500 hover:text-gray-300 text-sm transition-colors">Movie Recommendations</a>
                <a href="/" className="text-gray-500 hover:text-gray-300 text-sm transition-colors">TV Show Recommendations</a>
                <a href="/" className="text-gray-500 hover:text-gray-300 text-sm transition-colors">Family Movie Picker</a>
                <a href="/" className="text-gray-500 hover:text-gray-300 text-sm transition-colors">Family Swipe Mode</a>
              </nav>
            </div>
            <div>
              <p className="text-gray-400 text-xs uppercase tracking-wider font-semibold mb-3">Genres</p>
              <nav className="flex flex-col gap-2">
                <a href="/" className="text-gray-500 hover:text-gray-300 text-sm transition-colors">Action Movies</a>
                <a href="/" className="text-gray-500 hover:text-gray-300 text-sm transition-colors">Comedy Movies</a>
                <a href="/" className="text-gray-500 hover:text-gray-300 text-sm transition-colors">Horror Movies</a>
                <a href="/" className="text-gray-500 hover:text-gray-300 text-sm transition-colors">Sci-Fi Movies</a>
              </nav>
            </div>
            <div>
              <p className="text-gray-400 text-xs uppercase tracking-wider font-semibold mb-3">Streaming</p>
              <nav className="flex flex-col gap-2">
                <a href="/" className="text-gray-500 hover:text-gray-300 text-sm transition-colors">Netflix Movies</a>
                <a href="/" className="text-gray-500 hover:text-gray-300 text-sm transition-colors">Disney+ Movies</a>
                <a href="/" className="text-gray-500 hover:text-gray-300 text-sm transition-colors">Prime Video Movies</a>
                <a href="/" className="text-gray-500 hover:text-gray-300 text-sm transition-colors">Apple TV+ Movies</a>
              </nav>
            </div>
            <div>
              <p className="text-gray-400 text-xs uppercase tracking-wider font-semibold mb-3">Company</p>
              <nav className="flex flex-col gap-2">
                <a href="/" className="text-gray-500 hover:text-gray-300 text-sm transition-colors">About</a>
                <a href="https://thewebguys.ca" target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-gray-300 text-sm transition-colors">The Web Guys</a>
              </nav>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-gray-800/50">
            <div className="flex items-center gap-2">
              <span className="text-sm">🎬</span>
              <span className="text-sm font-semibold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                Next Movie
              </span>
            </div>
            <p className="text-gray-600 text-xs">
              &copy; {new Date().getFullYear()} nextmovie.app. All rights reserved.
            </p>
            <p className="text-gray-600 text-xs">
              Built by{" "}
              <a
                href="https://thewebguys.ca"
                target="_blank"
                rel="noopener noreferrer"
                className="text-purple-400 hover:text-purple-300 transition-colors"
              >
                thewebguys.ca
              </a>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
