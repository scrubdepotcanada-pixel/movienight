"use client";

interface FinalCTASectionProps {
  onSignIn: () => void;
}

export default function FinalCTASection({ onSignIn }: FinalCTASectionProps) {
  return (
    <section className="px-4 py-20 sm:py-28">
      <div className="max-w-3xl mx-auto text-center relative">
        {/* Background glow */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] bg-purple-600/10 rounded-full blur-3xl" />
        </div>

        <div className="relative">
          <div className="text-5xl mb-6">🍿</div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4">
            Ready for{" "}
            <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              movie night?
            </span>
          </h2>
          <p className="text-gray-400 text-lg mb-10 max-w-lg mx-auto">
            Join families who have already ditched the endless scroll. Free
            forever &mdash; no credit card needed.
          </p>
          <button
            onClick={onSignIn}
            className="group bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white rounded-xl px-8 py-4 text-lg font-semibold transition-all shadow-lg shadow-purple-900/30 hover:shadow-purple-900/50 hover:scale-105"
          >
            Start Picking Tonight
            <span className="ml-2 inline-block transition-transform group-hover:translate-x-1">
              &rarr;
            </span>
          </button>
        </div>
      </div>
    </section>
  );
}
