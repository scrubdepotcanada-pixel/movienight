"use client";

import Image from "next/image";

interface HeroSectionProps {
  onSignIn: () => void;
  onGuest: () => void;
}

export default function HeroSection({ onSignIn, onGuest }: HeroSectionProps) {
  return (
    <section className="relative px-4 pt-28 pb-16 sm:pt-36 sm:pb-24 overflow-hidden">
      {/* Background glow effect */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-purple-600/10 rounded-full blur-3xl" />
        <div className="absolute top-1/3 left-1/3 w-[400px] h-[400px] bg-pink-600/10 rounded-full blur-3xl" />
      </div>

      <div className="relative max-w-4xl mx-auto text-center">
        {/* Mascot */}
        <div className="flex justify-center mb-6">
          <Image src="/popcorn-12-peace.png" alt="Reel the popcorn" width={130} height={130} className="drop-shadow-2xl" unoptimized />
        </div>

        {/* Badge */}
        <div className="inline-flex items-center gap-2 bg-gray-800/60 backdrop-blur border border-gray-700/50 rounded-full px-4 py-1.5 mb-8">
          <span className="text-sm text-green-400 font-medium">100% Free</span>
          <span className="text-gray-600 text-sm">·</span>
          <span className="text-sm text-gray-300">No account needed</span>
        </div>

        {/* Headline — emotional, problem-focused */}
        <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold leading-tight mb-6">
          <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            Stop scrolling.
          </span>
          <br />
          Start watching.
        </h1>

        {/* Subheadline — paint the pain */}
        <p className="text-lg sm:text-xl text-gray-300 max-w-2xl mx-auto mb-4 leading-relaxed">
          Everyone wants something different. Nobody can decide.
          <br className="hidden sm:block" />
          <strong className="text-white">We find the one movie your whole family agrees on.</strong>
        </p>

        <p className="text-gray-500 text-sm mb-10 max-w-lg mx-auto">
          Each person picks what they like. Our AI finds the overlap. Done in 30 seconds.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-6">
          <button
            onClick={onGuest}
            className="group relative bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white rounded-xl px-8 py-4 text-lg font-semibold transition-all shadow-lg shadow-purple-900/30 hover:shadow-purple-900/50 hover:scale-105"
          >
            Find Tonight&apos;s Movie
            <span className="ml-2 inline-block transition-transform group-hover:translate-x-1">
              &rarr;
            </span>
          </button>
          <button
            onClick={onSignIn}
            className="text-gray-300 hover:text-white transition-colors text-base font-medium bg-gray-800/60 hover:bg-gray-700/60 border border-gray-700/50 rounded-xl px-6 py-4"
          >
            Sign in to save your taste
          </button>
        </div>

        {/* Social proof */}
        <div className="flex items-center justify-center gap-3 mb-6">
          <div className="flex -space-x-2">
            {["🧑", "👩", "👨", "👧", "🧒"].map((emoji, i) => (
              <div key={i} className="w-8 h-8 rounded-full bg-gray-700 border-2 border-gray-900 flex items-center justify-center text-sm">
                {emoji}
              </div>
            ))}
          </div>
          <p className="text-gray-400 text-sm">
            <strong className="text-white">500+</strong> families already picking smarter
          </p>
        </div>

        {/* Streaming services */}
        <p className="text-gray-600 text-xs">
          Works with Netflix, Disney+, Prime, Crave &amp; more
        </p>
      </div>
    </section>
  );
}
