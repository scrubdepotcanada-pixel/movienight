"use client";

interface HeroSectionProps {
  onSignIn: () => void;
  onGuest: () => void;
}

export default function HeroSection({ onSignIn, onGuest }: HeroSectionProps) {
  return (
    <section className="relative px-4 pt-32 pb-20 sm:pt-40 sm:pb-28 overflow-hidden">
      {/* Background glow effect */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-purple-600/10 rounded-full blur-3xl" />
        <div className="absolute top-1/3 left-1/3 w-[400px] h-[400px] bg-pink-600/10 rounded-full blur-3xl" />
      </div>

      <div className="relative max-w-4xl mx-auto text-center">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 bg-gray-800/60 backdrop-blur border border-gray-700/50 rounded-full px-4 py-1.5 mb-8">
          <span className="text-sm">🎬</span>
          <span className="text-sm text-gray-300">Powered by AI</span>
          <span className="text-gray-600 text-sm">·</span>
          <span className="text-sm text-green-400 font-medium">100% Free</span>
        </div>

        {/* Headline */}
        <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold leading-tight mb-6">
          <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            AI movie picks
          </span>{" "}
          for the whole family{" "}
          <span className="text-gray-400">&mdash; without the arguing.</span>
        </h1>

        {/* Subheadline */}
        <p className="text-lg sm:text-xl text-gray-400 max-w-2xl mx-auto mb-10 leading-relaxed">
          No more scrolling, no more debates. Just the right movie for
          everyone &mdash; instantly.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
          <button
            onClick={onSignIn}
            className="group relative bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white rounded-xl px-8 py-4 text-lg font-semibold transition-all shadow-lg shadow-purple-900/30 hover:shadow-purple-900/50 hover:scale-105"
          >
            Start Picking
            <span className="ml-2 inline-block transition-transform group-hover:translate-x-1">
              &rarr;
            </span>
          </button>
          <button
            onClick={onGuest}
            className="text-gray-300 hover:text-white transition-colors text-base font-medium bg-gray-800/60 hover:bg-gray-700/60 border border-gray-700/50 rounded-xl px-6 py-4"
          >
            Try as Guest
          </button>
        </div>

        <a
          href="#how-it-works"
          className="text-gray-500 hover:text-gray-300 transition-colors text-sm underline underline-offset-4 decoration-gray-600 hover:decoration-gray-400 mb-4 block"
        >
          See How It Works
        </a>

        {/* Streaming services */}
        <p className="text-gray-500 text-sm">
          Works with Netflix, Disney+, Prime &amp; more · Free forever, no credit card needed
        </p>
      </div>
    </section>
  );
}
