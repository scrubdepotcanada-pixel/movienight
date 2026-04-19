"use client";

const steps = [
  {
    number: 1,
    title: "Pick who\u2019s watching",
    description:
      "Add everyone on the couch. Each person gets their own taste profile and age-appropriate filter.",
    visual: "👨 👩 👦 👧",
  },
  {
    number: 2,
    title: "Tell us the vibe",
    description:
      "Feeling funny? Want something mind-bending? Just tap a mood or pick a genre. Or type exactly what you want.",
    visual: "😂 🧠 💕 😱",
  },
  {
    number: 3,
    title: "Get THE movie",
    description:
      "Our AI matches everyone\u2019s tastes, checks age ratings, and serves up picks you\u2019ll all love. Tap to see where to stream it.",
    visual: "🎬 ✅",
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
              30 seconds
            </span>
          </h2>
        </div>

        {/* Steps */}
        <div className="space-y-8 sm:space-y-12">
          {steps.map((step, i) => (
            <div
              key={step.number}
              className="flex gap-5 items-start bg-gray-800/30 border border-gray-700/30 rounded-2xl p-5 sm:p-8"
            >
              {/* Number badge */}
              <div className="flex-shrink-0">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center text-xl font-bold shadow-lg shadow-purple-900/30">
                  {step.number}
                </div>
              </div>

              {/* Content */}
              <div className="flex-1">
                <h3 className="text-xl sm:text-2xl font-semibold mb-2">
                  {step.title}
                </h3>
                <p className="text-gray-400 leading-relaxed mb-3">
                  {step.description}
                </p>
                <div className="text-2xl tracking-wider">{step.visual}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
