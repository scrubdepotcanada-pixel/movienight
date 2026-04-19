"use client";

import Image from "next/image";
import HeroSection from "./HeroSection";
import ProductPreviewSection from "./ProductPreviewSection";
import BenefitsSection from "./BenefitsSection";
import HowItWorksSection from "./HowItWorksSection";
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
            <Image src="/popcorn-12-peace.png" alt="Reel" width={32} height={32} className="drop-shadow" unoptimized />
            <span className="text-xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              Next Movie
            </span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={onGuest}
              className="cursor-pointer text-gray-400 hover:text-white text-sm font-medium transition-colors"
            >
              Try as Guest
            </button>
            <button
              onClick={onSignIn}
              className="cursor-pointer bg-gray-800/80 hover:bg-gray-700/80 border border-gray-700/50 text-gray-200 rounded-xl px-5 py-2 text-sm font-medium transition-colors"
            >
              Sign In
            </button>
          </div>
        </div>
      </header>

      {/* Page sections */}
      <main>
        <HeroSection onSignIn={onSignIn} onGuest={onGuest} />
        <ProductPreviewSection />
        <BenefitsSection />
        <HowItWorksSection />
        <FinalCTASection onSignIn={onSignIn} onGuest={onGuest} />
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-800/50 py-8 px-4">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Image src="/popcorn-12-peace.png" alt="Reel" width={24} height={24} className="drop-shadow" unoptimized />
            <span className="text-sm font-semibold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              Next Movie
            </span>
          </div>
          <p className="text-gray-600 text-xs">
            &copy; {new Date().getFullYear()} nextmovie.app. All rights
            reserved.
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
      </footer>
    </div>
  );
}
