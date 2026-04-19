"use client";

import { useState } from "react";

interface PremiumModalProps {
  onClose: () => void;
  feature?: string;
}

const FEATURES = [
  { icon: "👨‍👩‍👧‍👦", text: "Unlimited family members" },
  { icon: "🌍", text: "App in your language" },
  { icon: "🎚️", text: "Advanced filters (decade, runtime, rating)" },
  { icon: "📋", text: "Personal watchlist" },
  { icon: "📊", text: "Taste profile & stats" },
  { icon: "🎬", text: "More from this director or actor" },
];

export default function PremiumModal({ onClose, feature }: PremiumModalProps) {
  const [plan, setPlan] = useState<"yearly" | "monthly">("yearly");

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-gray-900 border border-gray-700/50 rounded-3xl max-w-md w-full p-6 shadow-2xl shadow-purple-900/30 max-h-[90vh] overflow-y-auto">
        {/* Close */}
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-white text-xl">
          &times;
        </button>

        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full mb-3">
            Premium
          </div>
          <h2 className="text-2xl font-bold text-white mb-1">Unlock the full experience</h2>
          {feature && (
            <p className="text-gray-400 text-sm">{feature} is a premium feature</p>
          )}
        </div>

        {/* Feature list */}
        <div className="space-y-3 mb-6">
          {FEATURES.map((f) => (
            <div key={f.text} className="flex items-center gap-3">
              <span className="text-lg">{f.icon}</span>
              <span className="text-gray-200 text-sm">{f.text}</span>
            </div>
          ))}
        </div>

        {/* Plan toggle */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <button
            onClick={() => setPlan("yearly")}
            className={`relative p-4 rounded-2xl border-2 transition-all text-left ${
              plan === "yearly"
                ? "border-purple-500 bg-purple-950/40"
                : "border-gray-700 bg-gray-800/40 hover:border-gray-600"
            }`}
          >
            <span className="absolute -top-2.5 left-3 bg-green-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
              Save 17%
            </span>
            <p className="text-white font-bold text-lg">$39.99</p>
            <p className="text-gray-400 text-xs">per year</p>
            <p className="text-gray-500 text-[10px] mt-1">$3.33/month</p>
          </button>
          <button
            onClick={() => setPlan("monthly")}
            className={`p-4 rounded-2xl border-2 transition-all text-left ${
              plan === "monthly"
                ? "border-purple-500 bg-purple-950/40"
                : "border-gray-700 bg-gray-800/40 hover:border-gray-600"
            }`}
          >
            <p className="text-white font-bold text-lg">$3.99</p>
            <p className="text-gray-400 text-xs">per month</p>
            <p className="text-gray-500 text-[10px] mt-1">billed monthly</p>
          </button>
        </div>

        {/* CTA */}
        <button
          className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white py-4 rounded-2xl font-bold text-lg transition-all hover:scale-[1.02] shadow-lg shadow-purple-900/30"
          onClick={() => {
            // Stripe integration will go here
            alert(`Stripe checkout for ${plan} plan coming soon!`);
          }}
        >
          Upgrade to Premium
        </button>
        <p className="text-center text-gray-600 text-xs mt-3">Cancel anytime. No questions asked.</p>
      </div>
    </div>
  );
}
