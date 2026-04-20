"use client";

import Image from "next/image";

const steps = [
  {
    number: 1,
    title: "Add who\u2019s watching",
    description:
      "Everyone on the couch gets their own profile with age-appropriate filters. G for the kids, R for date night.",
    visual: "👨 👩 👦 👧",
  },
  {
    number: 2,
    title: "Set tonight\u2019s mood",
    description:
      "Pick a genre, tap a mood, or just type what you\u2019re feeling. \u201CSomething funny but not dumb\u201D works too.",
    visual: "😂 🧠 💕 😱",
  },
  {
    number: 3,
    title: "Get the one movie",
    description:
      "Our AI merges everyone\u2019s taste, finds the overlap, and serves up picks the whole family will love. Tap to stream.",
    visual: "peace",
  },
];

export default function HowItWorksSection() {
  return (
    <section id="how-it-works" className="px-4 py-20 sm:py-24 bg-gray-900/30">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-14">
          <p className="text-sm font-medium text-purple-400 uppercase tracking-wider mb-3">
            Dead simple
          </p>
          <h2 className="text-3xl sm:text-4xl font-bold">
            From couch to movie in{" "}
            <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              3 taps
            </span>
          </h2>
        </div>

        {/* Steps */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {steps.map((step) => (
            <div
              key={step.number}
              className="bg-gray-800/30 border border-gray-700/30 rounded-2xl p-6 text-center"
            >
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center text-2xl font-bold shadow-lg shadow-purple-900/30 mx-auto mb-4">
                {step.number}
              </div>
              <h3 className="text-lg font-bold mb-2">{step.title}</h3>
              <p className="text-gray-400 text-sm leading-relaxed mb-3">
                {step.description}
              </p>
              {step.visual === "peace" ? (
                <div className="flex justify-center">
                  <Image src="/popcorn-peace.png" alt="Everyone agrees" width={64} height={64} className="w-16 h-16 object-contain" />
                </div>
              ) : (
                <div className="text-2xl tracking-wider">{step.visual}</div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
