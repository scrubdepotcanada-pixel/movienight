"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";

export default function FeedbackPage() {
  const [rating, setRating] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [whatLove, setWhatLove] = useState("");
  const [whatMissing, setWhatMissing] = useState("");
  const [other, setOther] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rating) { setError("Please pick a star rating first."); return; }
    setError("");
    setSubmitting(true);

    const res = await fetch("/api/feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, rating, whatLove, whatMissing, other }),
    });

    setSubmitting(false);
    if (res.ok) {
      setDone(true);
    } else {
      setError("Something went wrong. Please try again.");
    }
  };

  if (done) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-purple-950 text-white flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center">
          <div className="mx-auto mb-6 w-28 h-28">
            <Image src="/popcorn-peace.png" alt="Thank you" width={112} height={112} className="w-full h-full object-contain drop-shadow-2xl" />
          </div>
          <h1 className="text-3xl font-bold mb-3">Thank you! 🎉</h1>
          <p className="text-gray-400 mb-6">
            Your feedback means a lot — it directly shapes what we build next. Your free month of Premium is already active.
          </p>
          <Link
            href="/"
            className="inline-block bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white rounded-xl px-8 py-3 font-bold transition-all shadow-md shadow-purple-900/30"
          >
            Back to Next Movie
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-purple-950 text-white">
      {/* Header */}
      <header className="border-b border-gray-800/50 bg-gray-950/80 backdrop-blur-lg sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              Next Movie
            </span>
          </Link>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-12">
        {/* Hero */}
        <div className="text-center mb-10">
          <div className="mx-auto mb-5 w-24 h-24">
            <Image
              src="/popcorn--king.png"
              alt="Next Movie mascot"
              width={96}
              height={96}
              className="w-full h-full object-contain drop-shadow-2xl"
              priority
            />
          </div>
          <div className="inline-flex items-center gap-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white text-xs font-bold uppercase tracking-wider px-4 py-1.5 rounded-full mb-4">
            Early Access — Free Month Inside
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold mb-3">
            You&apos;re one of our{" "}
            <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              first users
            </span>
          </h1>
          <p className="text-gray-400 text-base leading-relaxed">
            We&apos;ve gifted you a free month of Premium as a thank-you for trying Next Movie early.
            All we ask is 2 minutes of honest feedback — it directly shapes what we build next.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Star rating */}
          <div className="bg-gray-800/40 border border-gray-700/40 rounded-2xl p-6">
            <label className="block text-sm font-bold text-white mb-4">
              Overall, how would you rate Next Movie?
              <span className="text-red-400 ml-1">*</span>
            </label>
            <div className="flex gap-3 justify-center">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHovered(star)}
                  onMouseLeave={() => setHovered(0)}
                  className="text-4xl transition-transform hover:scale-110 focus:outline-none"
                  aria-label={`${star} star${star !== 1 ? "s" : ""}`}
                >
                  <span className={(hovered || rating) >= star ? "text-yellow-400" : "text-gray-700"}>
                    ★
                  </span>
                </button>
              ))}
            </div>
            {rating > 0 && (
              <p className="text-center text-xs text-gray-500 mt-2">
                {["", "Poor", "Fair", "Good", "Great", "Excellent!"][rating]}
              </p>
            )}
          </div>

          {/* What do you love */}
          <div className="bg-gray-800/40 border border-gray-700/40 rounded-2xl p-6">
            <label className="block text-sm font-bold text-white mb-2">
              What do you love about Next Movie?
            </label>
            <textarea
              value={whatLove}
              onChange={e => setWhatLove(e.target.value)}
              rows={3}
              placeholder="The AI picks, the family profiles, how fast it is..."
              className="w-full bg-gray-900/60 border border-gray-700/50 rounded-xl px-4 py-3 text-white text-sm placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
            />
          </div>

          {/* What's missing */}
          <div className="bg-gray-800/40 border border-gray-700/40 rounded-2xl p-6">
            <label className="block text-sm font-bold text-white mb-2">
              What&apos;s missing or could be better?
            </label>
            <textarea
              value={whatMissing}
              onChange={e => setWhatMissing(e.target.value)}
              rows={3}
              placeholder="Something you expected to find but didn't..."
              className="w-full bg-gray-900/60 border border-gray-700/50 rounded-xl px-4 py-3 text-white text-sm placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
            />
          </div>

          {/* Other */}
          <div className="bg-gray-800/40 border border-gray-700/40 rounded-2xl p-6">
            <label className="block text-sm font-bold text-white mb-2">
              Anything else you want us to know?
            </label>
            <textarea
              value={other}
              onChange={e => setOther(e.target.value)}
              rows={2}
              placeholder="Totally optional..."
              className="w-full bg-gray-900/60 border border-gray-700/50 rounded-xl px-4 py-3 text-white text-sm placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
            />
          </div>

          {/* Name + email */}
          <div className="bg-gray-800/40 border border-gray-700/40 rounded-2xl p-6 space-y-4">
            <p className="text-xs text-gray-500">Optional — only needed if you want us to follow up with you personally.</p>
            <div>
              <label className="block text-sm font-bold text-white mb-2">Your name</label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="First name is fine"
                className="w-full bg-gray-900/60 border border-gray-700/50 rounded-xl px-4 py-3 text-white text-sm placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-white mb-2">Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full bg-gray-900/60 border border-gray-700/50 rounded-xl px-4 py-3 text-white text-sm placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>

          {error && (
            <p className="text-red-400 text-sm text-center">{error}</p>
          )}

          <button
            type="submit"
            disabled={submitting || !rating}
            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl py-4 font-bold text-base transition-all shadow-md shadow-purple-900/30"
          >
            {submitting ? "Sending..." : "Send Feedback →"}
          </button>

          <p className="text-center text-gray-600 text-xs">
            Your feedback is private and only seen by the Next Movie team.
          </p>
        </form>
      </main>
    </div>
  );
}
