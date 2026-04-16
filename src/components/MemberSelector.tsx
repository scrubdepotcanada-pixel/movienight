"use client";

import { useState } from "react";

interface Member {
  id: number;
  name: string;
  avatar: string;
  age?: number | null;
}

const AVATARS = ["🎬", "🍿", "🎭", "🎪", "🌟", "🎵", "🎮", "🦸", "👻", "🤖", "🧙", "🐱"];

function ageBadge(age: number | null | undefined): { label: string; color: string } | null {
  if (age == null) return null;
  if (age < 7) return { label: "G", color: "bg-green-600" };
  if (age < 13) return { label: "PG", color: "bg-blue-600" };
  if (age < 17) return { label: "PG-13", color: "bg-yellow-600" };
  return { label: "All", color: "bg-gray-600" };
}

interface MemberSelectorProps {
  members: Member[];
  selectedMember: Member | null;
  onSelect: (member: Member) => void;
  onAdd: (name: string, avatar: string, age: number | null) => void;
  onDelete: (memberId: number) => void;
  onUpdateAge: (memberId: number, age: number | null) => void;
  viewingAll: boolean;
  onViewAll: () => void;
}

export default function MemberSelector({
  members,
  selectedMember,
  onSelect,
  onAdd,
  onDelete,
  onUpdateAge,
  viewingAll,
  onViewAll,
}: MemberSelectorProps) {
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState("");
  const [selectedAvatar, setSelectedAvatar] = useState("🎬");
  const [newAge, setNewAge] = useState<string>("");
  const [editingAgeFor, setEditingAgeFor] = useState<number | null>(null);
  const [editAge, setEditAge] = useState<string>("");

  const handleAdd = () => {
    if (newName.trim()) {
      const ageNum = newAge.trim() ? parseInt(newAge, 10) : null;
      const validAge = ageNum && !isNaN(ageNum) && ageNum > 0 && ageNum < 130 ? ageNum : null;
      onAdd(newName.trim(), selectedAvatar, validAge);
      setNewName("");
      setSelectedAvatar("🎬");
      setNewAge("");
      setShowAdd(false);
    }
  };

  const handleSaveAge = (memberId: number) => {
    const ageNum = editAge.trim() ? parseInt(editAge, 10) : null;
    const validAge = ageNum && !isNaN(ageNum) && ageNum > 0 && ageNum < 130 ? ageNum : null;
    onUpdateAge(memberId, validAge);
    setEditingAgeFor(null);
    setEditAge("");
  };

  return (
    <div className="w-full max-w-3xl mx-auto">
      <h2 className="text-center text-gray-300 text-sm font-medium mb-4 uppercase tracking-wider">
        Who&apos;s watching?
      </h2>

      <div className="flex flex-wrap justify-center gap-4 mb-4">
        {members.map((member) => {
          const badge = ageBadge(member.age);
          return (
            <div key={member.id} className="relative group">
              <button
                onClick={() => onSelect(member)}
                className={`relative flex flex-col items-center gap-2 p-4 rounded-xl transition-all
                  ${selectedMember?.id === member.id && !viewingAll
                    ? "bg-purple-600/30 ring-2 ring-purple-500 scale-105"
                    : "bg-gray-800/60 hover:bg-gray-700/60 hover:scale-105"}`}
              >
                <span className="text-4xl">{member.avatar}</span>
                <span className="text-white text-sm font-medium">{member.name}</span>
                {member.age != null && (
                  <span className="text-gray-400 text-xs">Age {member.age}</span>
                )}
                {badge && (
                  <span className={`absolute -top-1 -left-1 ${badge.color} text-white text-[10px] font-bold px-1.5 py-0.5 rounded-md shadow`}>
                    {badge.label}
                  </span>
                )}
              </button>

              {/* Action buttons */}
              <div className="absolute -top-1 -right-1 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => {
                    setEditingAgeFor(member.id);
                    setEditAge(member.age?.toString() || "");
                  }}
                  className="bg-blue-600 hover:bg-blue-700 text-white rounded-full w-5 h-5 text-[10px] flex items-center justify-center"
                  title="Edit age"
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

              {/* Edit age inline form */}
              {editingAgeFor === member.id && (
                <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 bg-gray-800 border border-gray-700 rounded-lg p-3 shadow-xl z-10 w-56">
                  <p className="text-gray-300 text-xs mb-2">Set age for {member.name}</p>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      value={editAge}
                      onChange={(e) => setEditAge(e.target.value)}
                      placeholder="Age"
                      min="1"
                      max="120"
                      className="w-full px-2 py-1.5 bg-gray-700 border border-gray-600 rounded text-white text-sm placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                      autoFocus
                      onKeyDown={(e) => e.key === "Enter" && handleSaveAge(member.id)}
                    />
                    <button
                      onClick={() => handleSaveAge(member.id)}
                      className="bg-purple-600 hover:bg-purple-700 text-white px-2 py-1 rounded text-xs font-medium"
                    >
                      Save
                    </button>
                  </div>
                  <button
                    onClick={() => { setEditingAgeFor(null); setEditAge(""); }}
                    className="text-gray-400 hover:text-white text-xs mt-2 underline"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
          );
        })}

        {/* View All button */}
        {members.length > 1 && (
          <button
            onClick={onViewAll}
            className={`flex flex-col items-center gap-2 p-4 rounded-xl transition-all
              ${viewingAll
                ? "bg-blue-600/30 ring-2 ring-blue-500 scale-105"
                : "bg-gray-800/60 hover:bg-gray-700/60 hover:scale-105"}`}
          >
            <span className="text-4xl">👨‍👩‍👧‍👦</span>
            <span className="text-white text-sm font-medium">Everyone</span>
          </button>
        )}

        {/* Add member button */}
        <button
          onClick={() => setShowAdd(true)}
          className="flex flex-col items-center gap-2 p-4 rounded-xl bg-gray-800/40 hover:bg-gray-700/40 border-2 border-dashed border-gray-600 hover:border-purple-500 transition-all"
        >
          <span className="text-4xl text-gray-400">+</span>
          <span className="text-gray-400 text-sm font-medium">Add</span>
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
            onKeyDown={(e) => e.key === "Enter" && handleAdd()}
            autoFocus
          />

          <label className="block text-gray-300 text-xs mb-1 uppercase tracking-wider">
            Age (keeps recommendations age-appropriate)
          </label>
          <input
            type="number"
            value={newAge}
            onChange={(e) => setNewAge(e.target.value)}
            placeholder="e.g. 12"
            min="1"
            max="120"
            className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 mb-3"
            onKeyDown={(e) => e.key === "Enter" && handleAdd()}
          />

          <p className="text-gray-400 text-xs mb-3 leading-relaxed">
            {newAge && !isNaN(parseInt(newAge, 10)) ? (
              parseInt(newAge, 10) < 7 ? "Only G-rated movies will be suggested." :
              parseInt(newAge, 10) < 13 ? "Only G and PG movies will be suggested." :
              parseInt(newAge, 10) < 17 ? "G, PG, and PG-13 movies only — no R-rated content." :
              "All movie ratings allowed."
            ) : "No age filter (adult account)."}
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
              onClick={() => setShowAdd(false)}
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
