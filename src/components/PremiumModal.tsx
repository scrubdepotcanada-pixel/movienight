"use client";

import { useState } from "react";

interface PremiumModalProps {
  onClose: () => void;
  feature?: string;
}

const FEATURES = [
  { icon: "👨‍👩‍👧‍👦", text: "Unlimited family members" },
  { icon: "🌍", text: "Multi-language recommendations" },
  { icon: "📺", text: "Filter by streaming platform (Netflix, Disney+...)" },
  { icon: "🎚️", text: "Advanced filters (decade, runtime, rating)" },
  { icon: "📋", text: "Personal watchlist" },
  { icon: "📊", text: "Taste profile & stats" },
  { icon: "🎬", text: "More from this director or actor" },
];

export default function PremiumModal({ onClose, feature }: PremiumModalProps) {
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
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/popcorn--king.png" alt="" className="w-28 h-28 mx-auto mb-3 object-contain" />
          <div className="inline-flex items-center gap-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full mb-3">
            Premium
          </div>
          <h2 className="text-2xl font-bold text-white mb-1">Premium is coming soon</h2>
          {feature && (
            <p className="text-gray-400 text-sm">{feature} will be a premium feature</p>
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

        {/* Coming soon notice */}
        <div className="bg-purple-950/40 border border-purple-700/30 rounded-2xl p-4 text-center">
          <p className="text-purple-300 font-semibold mb-1">Stay tuned!</p>
          <p className="text-gray-400 text-sm">We&apos;re working hard to bring you these features. Premium will be available soon.</p>
        </div>

        <button
          onClick={onClose}
          className="w-full mt-4 bg-gray-800 hover:bg-gray-700 text-white py-3 rounded-2xl font-semibold transition-colors"
        >
          Got it
        </button>
      </div>
    </div>
  );
}
