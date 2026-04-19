"use client";

const benefits = [
  {
    icon: "🤝",
    title: "No more arguing",
    description:
      "Dad wants action. Mom wants drama. The kid wants animation. Our AI finds the movie that makes everyone happy.",
    highlight: "The #1 reason families use us",
  },
  {
    icon: "⚡",
    title: "30 seconds, not 30 minutes",
    description:
      "The average family spends 30 minutes deciding what to watch. With us? Pick a mood, tap a poster, done.",
    highlight: "More watching, less scrolling",
  },
  {
    icon: "🛡️",
    title: "Safe for every age",
    description:
      "Set each person's rating limit — G for the kids, PG-13 for the teens, R for date night. No awkward moments.",
    highlight: "Per-person content filtering",
  },
  {
    icon: "🧠",
    title: "Gets smarter every time",
    description:
      "Like it? Nope it? Pass? Every tap teaches us your taste. The more you use it, the better the picks get.",
    highlight: "Your personal taste engine",
  },
];

export default function BenefitsSection() {
  return (
    <section className="px-4 py-20 sm:py-24">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center mb-14">
          <p className="text-sm font-medium text-purple-400 uppercase tracking-wider mb-3">
            Why it works
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
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {benefits.map((benefit) => (
            <div
              key={benefit.title}
              className="bg-gray-800/50 backdrop-blur border border-gray-700/50 rounded-2xl p-6 sm:p-8 hover:border-purple-600/30 transition-colors"
            >
              <div className="text-4xl mb-4">{benefit.icon}</div>
              <h3 className="text-xl font-semibold mb-2">{benefit.title}</h3>
              <p className="text-gray-400 leading-relaxed mb-3">
                {benefit.description}
              </p>
              <p className="text-purple-400 text-xs font-medium uppercase tracking-wider">
                {benefit.highlight}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
