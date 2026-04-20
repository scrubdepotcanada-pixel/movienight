"use client";

import { useState, useEffect } from "react";

const MOOD_PRESETS = [
  { emoji: "😂", label: "Make me laugh", mood: "hilarious comedy that will make me laugh out loud" },
  { emoji: "😭", label: "Make me cry", mood: "emotional and heartwarming movie that will make me cry" },
  { emoji: "😱", label: "Scare me", mood: "scary horror movie that will keep me on the edge of my seat" },
  { emoji: "💕", label: "Date night", mood: "romantic movie perfect for a date night" },
  { emoji: "🌙", label: "Cozy & chill", mood: "cozy relaxing movie to unwind at the end of the day" },
  { emoji: "🧠", label: "Mind-bending", mood: "mind-bending plot twist movie that makes you think" },
];

const THEME_PRESETS = [
  { emoji: "👑", label: "Rise & fall", mood: "movie about someone who rises to power and faces the consequences or downfall" },
  { emoji: "🔥", label: "Revenge", mood: "revenge movie where the main character seeks justice or vengeance" },
  { emoji: "🕵️", label: "Whodunit", mood: "mystery whodunit movie with twists and suspects" },
  { emoji: "🏃", label: "Survival", mood: "survival movie where characters must endure extreme situations against all odds" },
  { emoji: "🔍", label: "True story", mood: "inspiring true story or biographical movie based on real events" },
  { emoji: "🤝", label: "Unlikely duo", mood: "movie about two very different people who are forced to work together" },
  { emoji: "⏳", label: "Time travel", mood: "time travel movie with clever twists and paradoxes" },
  { emoji: "🏝️", label: "Escape", mood: "movie about escaping captivity, prison, or a dangerous situation" },
  { emoji: "🎭", label: "Oscar worthy", mood: "critically acclaimed award-winning drama with outstanding performances" },
  { emoji: "💎", label: "Heist", mood: "clever heist or con artist movie with an elaborate plan" },
  { emoji: "🚀", label: "Epic adventure", mood: "epic adventure movie with action and a grand journey" },
  { emoji: "🤯", label: "Hidden gems", mood: "underrated hidden gem movie that most people haven't seen" },
];

const PLACEHOLDER_EXAMPLES = [
  "a movie about giving up power...",
  "revenge thriller set in winter...",
  "two strangers stuck together...",
  "underdog sports story...",
  "lonely astronaut in deep space...",
  "con artist who gets conned...",
  "family road trip gone wrong...",
];

interface MoodSearchProps {
  onSearch: (mood: string, category: string) => void;
  loading?: boolean;
}

export default function MoodSearch({ onSearch, loading }: MoodSearchProps) {
  const [customMood, setCustomMood] = useState("");
  const [placeholder, setPlaceholder] = useState(PLACEHOLDER_EXAMPLES[0]);

  useEffect(() => {
    const idx = Math.floor(Math.random() * PLACEHOLDER_EXAMPLES.length);
    setPlaceholder(PLACEHOLDER_EXAMPLES[idx]);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const text = customMood.trim();
    if (text) {
      onSearch(text, text.slice(0, 30));
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto space-y-4">
      {/* Describe it yourself */}
      <div className="bg-gray-800/40 border border-gray-700/40 rounded-2xl p-4">
        <p className="text-center text-gray-400 text-xs uppercase tracking-wider mb-3">Describe what you want</p>
        <form onSubmit={handleSubmit}>
          <div className="relative">
            <input
              type="text"
              value={customMood}
              onChange={(e) => setCustomMood(e.target.value)}
              placeholder={`e.g. ${placeholder}`}
              className="w-full px-5 py-3.5 bg-gray-900/60 border border-gray-600/50 rounded-xl text-white text-base placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all pr-24"
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
      </div>

      {/* Mood presets */}
      <div className="bg-purple-950/30 border border-purple-800/30 rounded-2xl p-4">
        <p className="text-center text-purple-400 text-xs uppercase tracking-wider mb-3">How are you feeling?</p>
        <div className="flex flex-wrap justify-center gap-2">
          {MOOD_PRESETS.map((preset) => (
            <button
              key={preset.label}
              onClick={() => onSearch(preset.mood, preset.label)}
              disabled={loading}
              className="flex items-center gap-1.5 bg-purple-900/30 hover:bg-purple-600/40 border border-purple-700/40 hover:border-purple-500/60 text-gray-200 hover:text-white px-3 py-2 rounded-full text-sm transition-all disabled:opacity-50"
            >
              <span>{preset.emoji}</span>
              <span>{preset.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Theme presets */}
      <div className="bg-pink-950/20 border border-pink-800/25 rounded-2xl p-4">
        <p className="text-center text-pink-400 text-xs uppercase tracking-wider mb-3">Pick a theme</p>
        <div className="flex flex-wrap justify-center gap-2">
          {THEME_PRESETS.map((preset) => (
            <button
              key={preset.label}
              onClick={() => onSearch(preset.mood, preset.label)}
              disabled={loading}
              className="flex items-center gap-1.5 bg-pink-900/20 hover:bg-pink-600/30 border border-pink-700/30 hover:border-pink-500/50 text-gray-200 hover:text-white px-3 py-2 rounded-full text-sm transition-all disabled:opacity-50"
            >
              <span>{preset.emoji}</span>
              <span>{preset.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
