"use client";

interface HeroSectionProps {
  onSignIn: () => void;
  onGuest: () => void;
}

export default function HeroSection({ onSignIn, onGuest }: HeroSectionProps) {
  return (
    <section className="relative px-4 pt-28 pb-16 sm:pt-36 sm:pb-24 overflow-hidden">
      {/* Background glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-purple-600/10 rounded-full blur-3xl" />
        <div className="absolute top-1/3 left-1/3 w-[400px] h-[400px] bg-pink-600/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-[300px] h-[300px] bg-amber-600/5 rounded-full blur-3xl" />
      </div>

      <div className="relative max-w-4xl mx-auto text-center">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 bg-gray-800/60 backdrop-blur border border-gray-700/50 rounded-full px-4 py-1.5 mb-8">
          <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
          <span className="text-sm text-gray-300">Free &middot; No signup required</span>
        </div>

        {/* Headline — conflict-solving angle */}
        <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold leading-[1.1] mb-6">
          Stop arguing about
          <br />
          <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-amber-400 bg-clip-text text-transparent">
            what to watch.
          </span>
        </h1>

        {/* Subheadline */}
        <p className="text-lg sm:text-xl text-gray-300 max-w-2xl mx-auto mb-3 leading-relaxed">
          Everyone wants something different. Nobody can decide.
          <br className="hidden sm:block" />
          <strong className="text-white">We pick the one movie your whole family agrees on.</strong>
        </p>

        <p className="text-gray-500 text-sm mb-10 max-w-lg mx-auto">
          Each person&apos;s taste + AI matching = the perfect pick in 30 seconds.
        </p>

        {/* Single strong CTA */}
        <div className="flex flex-col items-center gap-4 mb-10">
          <button
            onClick={onGuest}
            className="group relative bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white rounded-2xl px-10 py-5 text-xl font-bold transition-all shadow-xl shadow-purple-900/40 hover:shadow-purple-900/60 hover:scale-105 active:scale-100"
          >
            🍿 Start Movie Night
            <span className="ml-2 inline-block transition-transform group-hover:translate-x-1">
              &rarr;
            </span>
          </button>
          <button
            onClick={onSignIn}
            className="text-gray-400 hover:text-white transition-colors text-sm"
          >
            or <span className="underline">sign in</span> to save your taste
          </button>
        </div>

        {/* Social proof */}
        <div className="flex items-center justify-center gap-3">
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
      </div>
    </section>
  );
}
