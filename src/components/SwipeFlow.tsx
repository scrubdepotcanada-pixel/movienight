"use client";

import { useState, useCallback } from "react";
import SwipeCard from "./SwipeCard";

interface Movie {
  id: number;
  title: string;
  poster_path: string | null;
  vote_average: number;
  certification?: string;
  overview?: string;
  release_date?: string;
}

interface SwipeMember {
  id: number | string;
  name: string;
  avatar: string;
}

interface SwipeFlowProps {
  sessionId: string;
  candidates: Movie[];
  members: SwipeMember[];
  onComplete: () => void;
}

type Phase = "swiping" | "handoff" | "done";

export default function SwipeFlow({
  sessionId,
  candidates,
  members,
  onComplete,
}: SwipeFlowProps) {
  const [currentMemberIndex, setCurrentMemberIndex] = useState(0);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [phase, setPhase] = useState<Phase>("swiping");
  const [voteLoading, setVoteLoading] = useState(false);

  const currentMember = members[currentMemberIndex];
  const totalCards = candidates.length;

  const submitVote = useCallback(
    async (vote: "yes" | "no") => {
      if (voteLoading) return;
      const movie = candidates[currentCardIndex];
      if (!movie) return;

      setVoteLoading(true);
      try {
        await fetch("/api/swipe/vote", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sessionId,
            memberId: currentMember.id,
            tmdbId: movie.id,
            vote,
          }),
        });
      } catch (err) {
        console.error("Vote error:", err);
      }
      setVoteLoading(false);

      const nextCard = currentCardIndex + 1;
      if (nextCard >= totalCards) {
        // This member is done
        const nextMember = currentMemberIndex + 1;
        if (nextMember >= members.length) {
          // All members done
          setPhase("done");
          onComplete();
        } else {
          // Show handoff screen
          setPhase("handoff");
        }
      } else {
        setCurrentCardIndex(nextCard);
      }
    },
    [
      voteLoading,
      candidates,
      currentCardIndex,
      sessionId,
      currentMember,
      totalCards,
      currentMemberIndex,
      members.length,
      onComplete,
    ]
  );

  const handleContinueToNextMember = () => {
    setCurrentMemberIndex((prev) => prev + 1);
    setCurrentCardIndex(0);
    setPhase("swiping");
  };

  // Handoff screen between members
  if (phase === "handoff") {
    const nextMember = members[currentMemberIndex + 1];
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center">
        <div className="text-6xl mb-6 animate-bounce">
          {currentMember.avatar}
        </div>
        <h2 className="text-3xl font-bold text-white mb-3">
          {currentMember.name} is done!
        </h2>
        <p className="text-gray-400 text-lg mb-2">
          Great job swiping through {totalCards} movies
        </p>

        {nextMember && (
          <>
            <div className="my-8 flex items-center gap-3 bg-purple-600/20 border border-purple-500/40 rounded-2xl px-6 py-4">
              <span className="text-4xl">{nextMember.avatar}</span>
              <div className="text-left">
                <p className="text-purple-300 text-sm font-medium">Up next</p>
                <p className="text-white text-xl font-bold">{nextMember.name}</p>
              </div>
            </div>

            <p className="text-gray-300 text-lg mb-8">
              Pass the phone to {nextMember.name}!
            </p>

            <button
              onClick={handleContinueToNextMember}
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white px-10 py-4 rounded-2xl text-xl font-bold transition-all hover:scale-105 active:scale-95"
            >
              {nextMember.name}&apos;s Turn
            </button>
          </>
        )}
      </div>
    );
  }

  // Done screen (briefly shown before results load)
  if (phase === "done") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <div className="w-16 h-16 rounded-full border-4 border-gray-700 border-t-purple-500 animate-spin mb-6" />
        <h2 className="text-2xl font-bold text-white">
          Tallying the votes...
        </h2>
        <p className="text-gray-400 mt-2">Finding what everyone agrees on</p>
      </div>
    );
  }

  // Main swiping UI
  const movie = candidates[currentCardIndex];
  if (!movie) return null;

  const progress = ((currentCardIndex + 1) / totalCards) * 100;

  return (
    <div className="flex flex-col items-center px-4 pt-4 pb-8">
      {/* Current member indicator */}
      <div className="flex items-center gap-2 mb-4">
        <span className="text-3xl">{currentMember.avatar}</span>
        <div>
          <p className="text-white text-lg font-bold">
            {currentMember.name}&apos;s turn
          </p>
          <p className="text-purple-300 text-xs">
            {members.length > 1 ? "Pass the phone!" : "Swipe away!"}
          </p>
        </div>
      </div>

      {/* Member dots */}
      {members.length > 1 && (
        <div className="flex items-center gap-2 mb-4">
          {members.map((m, i) => (
            <div
              key={String(m.id)}
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm transition-all ${
                i === currentMemberIndex
                  ? "bg-purple-600 ring-2 ring-purple-400 scale-110"
                  : i < currentMemberIndex
                  ? "bg-green-600/50"
                  : "bg-gray-700"
              }`}
              title={m.name}
            >
              {i < currentMemberIndex ? "\u2713" : m.avatar}
            </div>
          ))}
        </div>
      )}

      {/* Progress bar */}
      <div className="w-full max-w-xs mb-2">
        <div className="flex justify-between text-xs text-gray-400 mb-1.5">
          <span>
            Movie {currentCardIndex + 1} of {totalCards}
          </span>
          <span>{Math.round(progress)}%</span>
        </div>
        <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all duration-300 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Swipe card */}
      <div className="mt-4 w-full">
        <SwipeCard
          movie={movie}
          onYes={() => submitVote("yes")}
          onNo={() => submitVote("no")}
          loading={voteLoading}
        />
      </div>
    </div>
  );
}
