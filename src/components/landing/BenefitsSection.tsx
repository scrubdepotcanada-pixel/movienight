"use client";

const benefits = [
  {
    pain: "\"Everyone wants something different\"",
    solution: "No more fights",
    description:
      "Dad wants action. Mom wants drama. Kids want cartoons. Our AI finds the one film they all say yes to.",
    icon: "🤝",
  },
  {
    pain: "\"We spent 30 minutes just deciding\"",
    solution: "30 seconds, done",
    description:
      "Pick a mood, tap go, get your pick. Most families save half an hour every movie night.",
    icon: "⚡",
  },
  {
    pain: "\"My kid saw something they shouldn't\"",
    solution: "Safe for every age",
    description:
      "Set a rating cap for each person. G for little kids. PG-13 for teens. R for date night. No bad surprises.",
    icon: "🛡️",
  },
  {
    pain: "\"It keeps showing stuff we've seen\"",
    solution: "Gets smarter each time",
    description:
      "Like it, skip it, or mark it watched. Each tap teaches the AI your taste. The more you use it, the better it gets.",
    icon: "🧠",
  },
  {
    pain: "\"I don't know what mood I'm in\"",
    solution: "Moods, themes & vibes",
    description:
      "Feeling cozy? Want a plot twist? Just tap a mood or type what you want. We find the right match.",
    icon: "🎭",
  },
  {
    pain: "\"Where can I actually watch it?\"",
    solution: "Stream links built in",
    description:
      "Each pick shows where to watch it. Netflix, Disney+, Prime, Apple TV+, and more. One tap to play.",
    icon: "📺",
  },
];

export default function BenefitsSection() {
  return (
    <section className="px-4 py-20 sm:py-24">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center mb-14">
          <p className="text-sm font-medium text-purple-400 uppercase tracking-wider mb-3">
            Why families love it
          </p>
          <h2 className="text-3xl sm:text-4xl font-bold">
            Movie night{" "}
            <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              without the drama
            </span>
          </h2>
          <p className="text-gray-400 mt-3 max-w-lg mx-auto">
            Well... unless you pick a drama. Then there&apos;s drama.
          </p>
        </div>

        {/* Benefits grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {benefits.map((b) => (
            <div
              key={b.solution}
              className="bg-gray-800/40 backdrop-blur border border-gray-700/40 rounded-2xl p-6 hover:border-purple-600/30 transition-colors group"
            >
              <div className="text-3xl mb-3">{b.icon}</div>
              <p className="text-gray-500 text-xs font-medium mb-2">{b.pain}</p>
              <h3 className="text-lg font-bold text-white mb-2">{b.solution}</h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                {b.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
