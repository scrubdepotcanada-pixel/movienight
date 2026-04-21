"use client";

import { useRouter } from "next/navigation";

interface PremiumModalProps {
  onClose: () => void;
  feature?: string;
}

export default function PremiumModal({ onClose, feature }: PremiumModalProps) {
  const router = useRouter();

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-gray-900 border border-gray-700/50 rounded-3xl max-w-sm w-full p-6 shadow-2xl shadow-purple-900/30">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-white text-xl">
          &times;
        </button>

        <div className="text-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/popcorn--king.png" alt="" className="w-24 h-24 mx-auto mb-3 object-contain" />
          <div className="inline-flex items-center gap-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full mb-3">
            Premium
          </div>
          <h2 className="text-xl font-bold text-white mb-1">Premium is coming soon</h2>
          {feature && (
            <p className="text-gray-400 text-sm mb-4">{feature} will be a premium feature</p>
          )}
          {!feature && <div className="mb-4" />}

          <button
            onClick={() => { onClose(); router.push("/premium"); }}
            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white py-3 rounded-2xl font-bold transition-all hover:scale-[1.02] mb-3"
          >
            See All Features &rarr;
          </button>
          <button
            onClick={onClose}
            className="w-full bg-gray-800 hover:bg-gray-700 text-gray-300 py-2.5 rounded-2xl text-sm transition-colors"
          >
            Maybe later
          </button>
        </div>
      </div>
    </div>
  );
}
