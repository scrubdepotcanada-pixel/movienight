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
          <div className="mx-auto mb-6 w-24 h-24">
            <Image src="/popcorn-ticket.png" alt="Your ticket is ready" width={96} height={96} className="w-full h-full object-contain drop-shadow-2xl" />
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4">
            Tonight&apos;s movie is{" "}
            <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              waiting
            </span>
          </h2>
          <p className="text-gray-400 text-lg mb-10 max-w-lg mx-auto">
            No signup. No credit card. Just the perfect movie for your family in 30 seconds.
          </p>
          <button
            onClick={onGuest}
            className="group bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white rounded-2xl px-10 py-5 text-xl font-bold transition-all shadow-xl shadow-purple-900/40 hover:shadow-purple-900/60 hover:scale-105 active:scale-100"
          >
            🍿 Start Movie Night
            <span className="ml-2 inline-block transition-transform group-hover:translate-x-1">
              &rarr;
            </span>
          </button>
          <button
            onClick={onSignIn}
            className="block mx-auto mt-4 text-gray-500 hover:text-gray-300 transition-colors text-sm"
          >
            or <span className="underline">sign in</span> to save your taste
          </button>
        </div>
      </div>
    </section>
  );
}
