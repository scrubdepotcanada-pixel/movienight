"use client";

import { useState } from "react";

interface Member {
  id: number;
  name: string;
  avatar: string;
}

const AVATARS = ["🎬", "🍿", "🎭", "🎪", "🌟", "🎵", "🎮", "🦸", "👻", "🤖", "🧙", "🐱"];

interface MemberSelectorProps {
  members: Member[];
  selectedMember: Member | null;
  onSelect: (member: Member) => void;
  onAdd: (name: string, avatar: string) => void;
  onDelete: (memberId: number) => void;
  viewingAll: boolean;
  onViewAll: () => void;
}

export default function MemberSelector({
  members,
  selectedMember,
  onSelect,
  onAdd,
  onDelete,
  viewingAll,
  onViewAll,
}: MemberSelectorProps) {
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState("");
  const [selectedAvatar, setSelectedAvatar] = useState("🎬");

  const handleAdd = () => {
    if (newName.trim()) {
      onAdd(newName.trim(), selectedAvatar);
      setNewName("");
      setSelectedAvatar("🎬");
      setShowAdd(false);
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto">
      <h2 className="text-center text-gray-300 text-sm font-medium mb-4 uppercase tracking-wider">
        Who&apos;s watching?
      </h2>

      <div className="flex flex-wrap justify-center gap-4 mb-4">
        {members.map((member) => (
          <div key={member.id} className="relative group">
            <button
              onClick={() => onSelect(member)}
              className={`flex flex-col items-center gap-2 p-4 rounded-xl transition-all
                ${selectedMember?.id === member.id && !viewingAll
                  ? "bg-purple-600/30 ring-2 ring-purple-500 scale-105"
                  : "bg-gray-800/60 hover:bg-gray-700/60 hover:scale-105"}`}
            >
              <span className="text-4xl">{member.avatar}</span>
              <span className="text-white text-sm font-medium">{member.name}</span>
            </button>
            <button
              onClick={() => onDelete(member.id)}
              className="absolute -top-1 -right-1 bg-red-600 hover:bg-red-700 text-white rounded-full w-5 h-5 text-xs opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
              title="Remove member"
            >
              &times;
            </button>
          </div>
        ))}

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
