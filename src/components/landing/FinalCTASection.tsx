"use client";

import Image from "next/image";

interface FinalCTASectionProps {
  onSignIn: () => void;
  onGuest: () => void;
}

export default function FinalCTASection({ onSignIn, onGuest }: FinalCTASectionProps) {
  return (
    <section className="px-4 py-20 sm:py-28">
      <div className="max-w-3xl mx-auto text-center relative">
        {/* Background glow */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] bg-purple-600/10 rounded-full blur-3xl" />
        </div>

        <div className="relative">
          <div className="flex justify-center mb-6">
            <Image src="/popcorn-12-peace.png" alt="Reel" width={110} height={110} className="drop-shadow-lg" unoptimized />
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4">
            Tonight&apos;s movie is{" "}
            <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              waiting
            </span>
          </h2>
          <p className="text-gray-400 text-lg mb-10 max-w-lg mx-auto">
            Stop scrolling Netflix for 30 minutes. Get the perfect pick in 30 seconds.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={onGuest}
              className="group bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white rounded-xl px-8 py-4 text-lg font-semibold transition-all shadow-lg shadow-purple-900/30 hover:shadow-purple-900/50 hover:scale-105"
            >
              Find Tonight&apos;s Movie
              <span className="ml-2 inline-block transition-transform group-hover:translate-x-1">
                &rarr;
              </span>
            </button>
            <button
              onClick={onSignIn}
              className="text-gray-400 hover:text-white transition-colors text-sm underline"
            >
              Or sign in to save your taste
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
