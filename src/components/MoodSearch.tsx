"use client";

import { useState } from "react";

const MOOD_PRESETS = [
  { emoji: "😂", label: "Make me laugh", mood: "hilarious comedy that will make me laugh out loud" },
  { emoji: "😭", label: "Make me cry", mood: "emotional and heartwarming movie that will make me cry" },
  { emoji: "🧠", label: "Mind-bending", mood: "mind-bending plot twist movie that makes you think" },
  { emoji: "👨‍👩‍👧‍👦", label: "Family night", mood: "feel-good family movie everyone can enjoy together" },
  { emoji: "💕", label: "Date night", mood: "romantic movie perfect for a date night" },
  { emoji: "😱", label: "Scare me", mood: "scary horror movie that will keep me on the edge of my seat" },
  { emoji: "🚀", label: "Epic adventure", mood: "epic adventure movie with action and a grand journey" },
  { emoji: "🔍", label: "True story", mood: "inspiring true story or biographical movie based on real events" },
  { emoji: "🌙", label: "Cozy & chill", mood: "cozy relaxing movie to unwind at the end of the day" },
  { emoji: "🤯", label: "Hidden gems", mood: "underrated hidden gem movie that most people haven't seen" },
  { emoji: "🎭", label: "Oscar worthy", mood: "critically acclaimed award-winning drama with outstanding performances" },
  { emoji: "⚔️", label: "Action packed", mood: "non-stop action movie with incredible stunts and fight scenes" },
];

interface MoodSearchProps {
  onSearch: (mood: string) => void;
  loading?: boolean;
}

export default function MoodSearch({ onSearch, loading }: MoodSearchProps) {
  const [customMood, setCustomMood] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (customMood.trim()) {
      onSearch(customMood.trim());
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <h3 className="text-center text-gray-400 text-sm mb-4">Or tell us what you&apos;re in the mood for</h3>

      {/* Custom mood input */}
      <form onSubmit={handleSubmit} className="mb-5">
        <div className="relative">
          <input
            type="text"
            value={customMood}
            onChange={(e) => setCustomMood(e.target.value)}
            placeholder="e.g. romantic movie about space..."
            className="w-full px-5 py-3.5 bg-gray-800/80 backdrop-blur border border-gray-600 rounded-2xl text-white text-base placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all pr-24"
            disabled={loading}
          />
          <button
            type="submit"
            disabled={loading || !customMood.trim()}
            className="absolute right-2 top-1/2 -translate-y-1/2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 text-white px-4 py-2 rounded-xl font-medium transition-colors text-sm"
          >
            {loading ? "..." : "Go"}
          </button>
        </div>
      </form>

      {/* Preset mood chips */}
      <div className="flex flex-wrap justify-center gap-2">
        {MOOD_PRESETS.map((preset) => (
          <button
            key={preset.label}
            onClick={() => onSearch(preset.mood)}
            disabled={loading}
            className="flex items-center gap-1.5 bg-gray-800/60 hover:bg-purple-600/30 border border-gray-700/50 hover:border-purple-500/50 text-gray-300 hover:text-white px-3 py-2 rounded-full text-sm transition-all disabled:opacity-50"
          >
            <span>{preset.emoji}</span>
            <span>{preset.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
