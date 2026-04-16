"use client";

const benefits = [
  {
    icon: "✌️",
    title: "Less arguing",
    description:
      "Everyone gets a voice. The AI finds the movie that makes the whole family happy — no more vetoes or meltdowns.",
  },
  {
    icon: "⚡",
    title: "No endless scrolling",
    description:
      "Skip the 30-minute browse session. Get curated picks in seconds, not hours of \"What about this one?\"",
  },
  {
    icon: "🛡️",
    title: "Better picks for mixed ages",
    description:
      "Age-appropriate filters built in. Set each family member's rating limit and relax.",
  },
  {
    icon: "🚀",
    title: "Faster family movie night",
    description:
      "From couch to movie in under a minute. More watching, less deciding.",
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
            Movie night,{" "}
            <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              solved
            </span>
          </h2>
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
              <p className="text-gray-400 leading-relaxed">
                {benefit.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
