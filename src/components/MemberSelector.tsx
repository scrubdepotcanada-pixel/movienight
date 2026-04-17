"use client";

import { useState } from "react";

interface Member {
  id: number;
  name: string;
  avatar: string;
  age?: number | null;
  max_rating?: string | null;
}

const AVATARS = ["🎬", "🍿", "🎭", "🎪", "🌟", "🎵", "🎮", "🦸", "👻", "🤖", "🧙", "🐱"];

const RATING_OPTIONS: { value: string; label: string; hint: string; color: string }[] = [
  { value: "G", label: "G", hint: "Kids", color: "bg-green-600" },
  { value: "PG", label: "PG", hint: "Family", color: "bg-blue-600" },
  { value: "PG-13", label: "PG-13", hint: "Teens", color: "bg-yellow-600" },
  { value: "R", label: "R", hint: "Adult", color: "bg-red-600" },
  { value: "ALL", label: "All", hint: "No limit", color: "bg-gray-600" },
];

function defaultMaxRatingForAge(age: number | null): string {
  if (age == null) return "ALL";
  if (age < 7) return "G";
  if (age < 10) return "PG";
  if (age < 14) return "PG-13";
  if (age < 17) return "R";
  return "ALL";
}

function getMaxRating(member: Member): string {
  if (member.max_rating) return member.max_rating;
  return defaultMaxRatingForAge(member.age ?? null);
}

function ratingBadge(rating: string): { color: string; label: string } {
  const opt = RATING_OPTIONS.find((r) => r.value === rating);
  return { color: opt?.color ?? "bg-gray-600", label: opt?.label ?? rating };
}

interface MemberSelectorProps {
  members: Member[];
  selectedMember: Member | null;
  onSelect: (member: Member) => void;
  onAdd: (name: string, avatar: string, age: number | null, maxRating: string) => void;
  onDelete: (memberId: number) => void;
  onUpdateMember: (memberId: number, updates: { age?: number | null; maxRating?: string }) => void;
  viewingAll: boolean;
  onViewAll: () => void;
}

export default function MemberSelector({
  members,
  selectedMember,
  onSelect,
  onAdd,
  onDelete,
  onUpdateMember,
  viewingAll,
  onViewAll,
}: MemberSelectorProps) {
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState("");
  const [selectedAvatar, setSelectedAvatar] = useState("🎬");
  const [newAge, setNewAge] = useState<string>("");
  const [newMaxRating, setNewMaxRating] = useState<string>("ALL");
  const [maxRatingTouched, setMaxRatingTouched] = useState(false);

  const [editingMember, setEditingMember] = useState<number | null>(null);
  const [editAge, setEditAge] = useState<string>("");
  const [editMaxRating, setEditMaxRating] = useState<string>("ALL");

  // Auto-update the default max rating from age, unless user has manually picked one
  const handleAgeChange = (value: string) => {
    setNewAge(value);
    if (!maxRatingTouched) {
      const ageNum = parseInt(value, 10);
      setNewMaxRating(defaultMaxRatingForAge(!isNaN(ageNum) ? ageNum : null));
    }
  };

  const handleAdd = () => {
    if (newName.trim()) {
      const ageNum = newAge.trim() ? parseInt(newAge, 10) : null;
      const validAge = ageNum && !isNaN(ageNum) && ageNum > 0 && ageNum < 130 ? ageNum : null;
      onAdd(newName.trim(), selectedAvatar, validAge, newMaxRating);
      setNewName("");
      setSelectedAvatar("🎬");
      setNewAge("");
      setNewMaxRating("ALL");
      setMaxRatingTouched(false);
      setShowAdd(false);
    }
  };

  const startEditing = (member: Member) => {
    setEditingMember(member.id);
    setEditAge(member.age?.toString() || "");
    setEditMaxRating(getMaxRating(member));
  };

  const saveEdit = (memberId: number) => {
    const ageNum = editAge.trim() ? parseInt(editAge, 10) : null;
    const validAge = ageNum && !isNaN(ageNum) && ageNum > 0 && ageNum < 130 ? ageNum : null;
    onUpdateMember(memberId, { age: validAge, maxRating: editMaxRating });
    setEditingMember(null);
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="flex flex-wrap justify-center gap-6 mb-6">
        {members.map((member) => {
          const badge = ratingBadge(getMaxRating(member));
          return (
            <div key={member.id} className="relative group">
              <button
                onClick={() => onSelect(member)}
                className={`relative flex flex-col items-center gap-3 px-8 py-6 rounded-2xl transition-all border
                  ${selectedMember?.id === member.id && !viewingAll
                    ? "bg-purple-600/20 border-purple-500 ring-2 ring-purple-500/50 scale-105 shadow-lg shadow-purple-900/30"
                    : "bg-gray-800/40 border-gray-700/50 hover:bg-gray-700/40 hover:border-purple-500/50 hover:scale-105 hover:shadow-lg hover:shadow-purple-900/20"}`}
              >
                <span className="text-5xl">{member.avatar}</span>
                <span className="text-white text-base font-semibold">{member.name}</span>
                <div className="flex items-center gap-2">
                  {member.age != null && (
                    <span className="text-gray-400 text-xs">Age {member.age}</span>
                  )}
                  <span className={`${badge.color} text-white text-[10px] font-bold px-2 py-0.5 rounded-full`}>
                    {badge.label}
                  </span>
                </div>
              </button>

              {/* Action buttons */}
              <div className="absolute -top-1 -right-1 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => startEditing(member)}
                  className="bg-blue-600 hover:bg-blue-700 text-white rounded-full w-5 h-5 text-[10px] flex items-center justify-center"
                  title="Edit settings"
                >
                  ✎
                </button>
                <button
                  onClick={() => onDelete(member.id)}
                  className="bg-red-600 hover:bg-red-700 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center"
                  title="Remove member"
                >
                  &times;
                </button>
              </div>

              {/* Edit form */}
              {editingMember === member.id && (
                <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 bg-gray-800 border border-gray-700 rounded-lg p-4 shadow-xl z-20 w-72">
                  <p className="text-white text-sm font-medium mb-3">Edit {member.name}</p>

                  <label className="block text-gray-300 text-xs mb-1 uppercase tracking-wider">Age</label>
                  <input
                    type="number"
                    value={editAge}
                    onChange={(e) => setEditAge(e.target.value)}
                    placeholder="e.g. 12"
                    min="1"
                    max="120"
                    className="w-full px-2 py-1.5 bg-gray-700 border border-gray-600 rounded text-white text-sm placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-purple-500 mb-3"
                  />

                  <label className="block text-gray-300 text-xs mb-2 uppercase tracking-wider">Max rating allowed</label>
                  <div className="grid grid-cols-5 gap-1 mb-3">
                    {RATING_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => setEditMaxRating(opt.value)}
                        className={`px-1 py-1.5 rounded text-xs font-bold transition-all
                          ${editMaxRating === opt.value
                            ? `${opt.color} text-white ring-2 ring-white/50`
                            : "bg-gray-700 text-gray-300 hover:bg-gray-600"}`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => saveEdit(member.id)}
                      className="flex-1 bg-purple-600 hover:bg-purple-700 text-white py-1.5 rounded text-sm font-medium"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => setEditingMember(null)}
                      className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-1.5 rounded text-sm font-medium"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {members.length > 1 && (
          <button
            onClick={onViewAll}
            className={`flex flex-col items-center gap-3 px-8 py-6 rounded-2xl transition-all border
              ${viewingAll
                ? "bg-blue-600/20 border-blue-500 ring-2 ring-blue-500/50 scale-105 shadow-lg"
                : "bg-gray-800/40 border-gray-700/50 hover:bg-gray-700/40 hover:border-blue-500/50 hover:scale-105 hover:shadow-lg"}`}
          >
            <span className="text-5xl">👨‍👩‍👧‍👦</span>
            <span className="text-white text-base font-semibold">Everyone</span>
          </button>
        )}

        <button
          onClick={() => setShowAdd(true)}
          className="flex flex-col items-center gap-3 px-8 py-6 rounded-2xl bg-gray-800/20 hover:bg-gray-700/30 border-2 border-dashed border-gray-600/50 hover:border-purple-500 transition-all hover:scale-105"
        >
          <span className="text-5xl text-gray-500">+</span>
          <span className="text-gray-400 text-base font-semibold">Add Member</span>
        </button>
      </div>

      {/* Add member form */}
      {showAdd && (
        <div className="bg-gray-800/80 backdrop-blur rounded-xl p-6 max-w-sm mx-auto">
          <h3 className="text-white font-medium mb-3">Add Family Member</h3>

          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Name"
            className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 mb-3"
            autoFocus
          />

          <label className="block text-gray-300 text-xs mb-1 uppercase tracking-wider">
            Age (optional)
          </label>
          <input
            type="number"
            value={newAge}
            onChange={(e) => handleAgeChange(e.target.value)}
            placeholder="e.g. 12"
            min="1"
            max="120"
            className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 mb-3"
          />

          <label className="block text-gray-300 text-xs mb-2 uppercase tracking-wider">
            What can they watch?
          </label>
          <div className="grid grid-cols-5 gap-1 mb-2">
            {RATING_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => { setNewMaxRating(opt.value); setMaxRatingTouched(true); }}
                className={`flex flex-col items-center px-1 py-2 rounded text-xs font-bold transition-all
                  ${newMaxRating === opt.value
                    ? `${opt.color} text-white ring-2 ring-white/50`
                    : "bg-gray-700 text-gray-300 hover:bg-gray-600"}`}
              >
                <span>{opt.label}</span>
                <span className="text-[9px] font-normal opacity-75 mt-0.5">{opt.hint}</span>
              </button>
            ))}
          </div>

          <p className="text-gray-400 text-xs mb-4 leading-relaxed">
            {newMaxRating === "G" && "Only G-rated movies will be suggested."}
            {newMaxRating === "PG" && "Only G and PG movies will be suggested."}
            {newMaxRating === "PG-13" && "G, PG, and PG-13 — no R-rated content."}
            {newMaxRating === "R" && "Up to R — no NC-17 explicit content."}
            {newMaxRating === "ALL" && "No content filter applied."}
          </p>

          <div className="flex flex-wrap gap-2 mb-4">
            {AVATARS.map((avatar) => (
              <button
                key={avatar}
                onClick={() => setSelectedAvatar(avatar)}
                className={`text-2xl p-1 rounded-lg transition-all
                  ${selectedAvatar === avatar ? "bg-purple-600 scale-110" : "hover:bg-gray-600"}`}
              >
                {avatar}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleAdd}
              disabled={!newName.trim()}
              className="flex-1 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 text-white py-2 rounded-lg font-medium transition-colors"
            >
              Add
            </button>
            <button
              onClick={() => {
                setShowAdd(false);
                setMaxRatingTouched(false);
              }}
              className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-2 rounded-lg font-medium transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
