"use client";

import { useEffect, useRef } from "react";

export const ADSENSE_CLIENT_ID = "ca-pub-7449494514130870";

declare global {
  interface Window {
    adsbygoogle?: unknown[];
  }
}

interface AdBannerProps {
  // The ad unit's slot id from the AdSense dashboard (Ads > By ad unit).
  // Each placement needs its own slot — don't reuse one slot in two spots.
  slot: string;
  // Premium users never see ads — that's part of what they're paying for.
  isPremium: boolean;
  // The viewer's effective rating cap (member's max_rating, or guestMaxRating
  // for guests). Google's ad policies require non-personalized, non-targeted
  // ad serving for anything child-directed — simplest and safest is to show
  // no ads at all under a G/PG cap rather than try to flag the request
  // correctly, since getting that wrong risks the whole AdSense account.
  maxRating?: string | null;
  className?: string;
}

const KID_SAFE_RATINGS = new Set(["G", "PG"]);

export default function AdBanner({ slot, isPremium, maxRating, className }: AdBannerProps) {
  const pushedRef = useRef(false);
  const isKidSafeContext = !!maxRating && KID_SAFE_RATINGS.has(maxRating);
  const shouldRender = !isPremium && !isKidSafeContext;

  useEffect(() => {
    if (!shouldRender || pushedRef.current) return;
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
      pushedRef.current = true;
    } catch {}
  }, [shouldRender]);

  if (!shouldRender) return null;

  return (
    <div className={`text-center ${className || ""}`}>
      <ins
        className="adsbygoogle"
        style={{ display: "block" }}
        data-ad-client={ADSENSE_CLIENT_ID}
        data-ad-slot={slot}
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </div>
  );
}
