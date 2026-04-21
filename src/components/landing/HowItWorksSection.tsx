"use client";

import Image from "next/image";

const steps = [
  {
    number: 1,
    title: "Add who\u2019s watching",
    description:
      "Each person gets their own profile. Set age filters so kids see safe picks. Adults see it all.",
    visual: "👨 👩 👦 👧",
  },
  {
    number: 2,
    title: "Set the mood",
    description:
      "Pick a genre or type how you feel. Try \u201Cfunny but not dumb\u201D \u2014 it works.",
    visual: "😂 🧠 💕 😱",
  },
  {
    number: 3,
    title: "Get the pick",
    description:
      "Our AI blends your tastes and finds the best match. Tap to stream it right away.",
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
