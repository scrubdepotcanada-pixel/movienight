"use client";

import { useState } from "react";
import { useSession, signIn } from "next-auth/react";

export default function PricingCards() {
  const { data: session } = useSession();
  const [loading, setLoading] = useState<string | null>(null);

  const handleCheckout = async (plan: string) => {
    if (!session) {
      signIn();
      return;
    }
    setLoading(plan);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert(data.error || "Something went wrong");
      }
    } catch {
      alert("Failed to start checkout");
    }
    setLoading(null);
  };

  const handlePortal = async () => {
    setLoading("portal");
    try {
      const res = await fetch("/api/stripe/portal", { method: "POST" });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch {
      alert("Failed to open billing portal");
    }
    setLoading(null);
  };

  return (
    <div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-3xl mx-auto mb-6">
        {/* Monthly */}
        <div className="bg-gray-800/50 border border-gray-700/50 rounded-2xl p-6 text-center">
          <p className="text-gray-400 text-sm mb-1">Monthly</p>
          <p className="text-white text-4xl font-bold">$4.99</p>
          <p className="text-gray-500 text-xs mt-1 mb-6">per month</p>
          <button
            onClick={() => handleCheckout("monthly")}
            disabled={loading === "monthly"}
            className="w-full bg-gray-700 hover:bg-gray-600 text-white py-3 rounded-xl font-semibold transition-colors disabled:opacity-50"
          >
            {loading === "monthly" ? "..." : session ? "Subscribe" : "Sign in to subscribe"}
          </button>
        </div>

        {/* Yearly — featured */}
        <div className="bg-purple-950/50 border-2 border-purple-500 rounded-2xl p-6 text-center relative">
          <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-green-600 text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">
            Save 17%
          </span>
          <p className="text-purple-300 text-sm mb-1">Yearly</p>
          <p className="text-white text-4xl font-bold">$49.99</p>
          <p className="text-gray-500 text-xs mt-1 mb-1">per year</p>
          <p className="text-purple-400 text-xs mb-5">$4.17/month</p>
          <button
            onClick={() => handleCheckout("yearly")}
            disabled={loading === "yearly"}
            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white py-3 rounded-xl font-bold transition-all hover:scale-[1.02] disabled:opacity-50"
          >
            {loading === "yearly" ? "..." : session ? "Subscribe" : "Sign in to subscribe"}
          </button>
        </div>

        {/* Lifetime */}
        <div className="bg-gray-800/50 border border-gray-700/50 rounded-2xl p-6 text-center">
          <p className="text-gray-400 text-sm mb-1">Lifetime</p>
          <p className="text-white text-4xl font-bold">$99.99</p>
          <p className="text-gray-500 text-xs mt-1 mb-1">one-time</p>
          <p className="text-green-400 text-xs mb-5">Pay once, keep forever</p>
          <button
            onClick={() => handleCheckout("lifetime")}
            disabled={loading === "lifetime"}
            className="w-full bg-gray-700 hover:bg-gray-600 text-white py-3 rounded-xl font-semibold transition-colors disabled:opacity-50"
          >
            {loading === "lifetime" ? "..." : session ? "Buy Lifetime" : "Sign in to buy"}
          </button>
        </div>
      </div>

      <p className="text-center text-gray-600 text-xs">
        Cancel anytime. No questions asked.
        {session && (
          <>
            {" · "}
            <button onClick={handlePortal} className="text-purple-400 hover:text-purple-300 transition-colors">
              Manage billing
            </button>
          </>
        )}
      </p>
    </div>
  );
}
