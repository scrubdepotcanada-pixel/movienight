"use client";

const quotes = [
  {
    text: "We used to spend 30 minutes deciding. Now it takes 30 seconds.",
    author: "Sarah K.",
    detail: "Family of 4",
  },
  {
    text: "My kids and I finally agree on something. This app is a miracle.",
    author: "David R.",
    detail: "Dad of 3",
  },
  {
    text: "It actually understands what each of us likes. Feels like magic.",
    author: "Priya M.",
    detail: "Movie lover",
  },
];

export default function SocialProofStrip() {
  return (
    <section className="px-4 py-12 border-y border-gray-800/50 bg-gray-900/20">
      <div className="max-w-5xl mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {quotes.map((q) => (
            <div key={q.author} className="text-center px-4">
              <div className="text-yellow-400 text-sm mb-2">★★★★★</div>
              <p className="text-gray-300 text-sm leading-relaxed mb-3 italic">
                &ldquo;{q.text}&rdquo;
              </p>
              <p className="text-white text-sm font-medium">{q.author}</p>
              <p className="text-gray-500 text-xs">{q.detail}</p>
            </div>
          ))}
        </div>
        <p className="text-center text-gray-600 text-xs mt-6">
          Join 500+ families on early access
        </p>
      </div>
    </section>
  );
}
