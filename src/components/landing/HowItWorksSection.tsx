"use client";

const steps = [
  {
    number: 1,
    title: "Pick who\u2019s watching",
    description:
      "Create profiles for each family member with their age and rating preferences. Everyone gets their own taste profile that improves over time.",
  },
  {
    number: 2,
    title: "Set the vibe",
    description:
      "Choose a genre, pick a mood, or tell us a movie you already love. We\u2019ll figure out what the group wants tonight.",
  },
  {
    number: 3,
    title: "Get instant movie picks",
    description:
      "Our AI cross-references everyone\u2019s tastes and age limits to serve up picks the whole family will enjoy. Tap to mark watched and we\u2019ll keep learning.",
  },
];

export default function HowItWorksSection() {
  return (
    <section id="how-it-works" className="px-4 py-20 sm:py-24">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-14">
          <p className="text-sm font-medium text-purple-400 uppercase tracking-wider mb-3">
            How it works
          </p>
          <h2 className="text-3xl sm:text-4xl font-bold">
            Three steps to{" "}
            <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              the perfect movie
            </span>
          </h2>
        </div>

        {/* Steps */}
        <div className="space-y-12 sm:space-y-16">
          {steps.map((step, i) => (
            <div
              key={step.number}
              className="flex gap-6 items-start"
            >
              {/* Number badge */}
              <div className="flex-shrink-0">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center text-xl font-bold shadow-lg shadow-purple-900/30">
                  {step.number}
                </div>
                {/* Connecting line */}
                {i < steps.length - 1 && (
                  <div className="w-px h-12 sm:h-16 bg-gradient-to-b from-purple-600/40 to-transparent mx-auto mt-3" />
                )}
              </div>

              {/* Content */}
              <div className="pt-1">
                <h3 className="text-xl sm:text-2xl font-semibold mb-2">
                  {step.title}
                </h3>
                <p className="text-gray-400 leading-relaxed max-w-xl">
                  {step.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
