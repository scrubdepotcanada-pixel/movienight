"use client";

import { usePathname } from "next/navigation";
import Script from "next/script";

const GA_ID = "G-322V3KQPHK";

export default function GoogleAnalytics() {
  const pathname = usePathname();

  // Don't track admin page visits
  if (pathname?.startsWith("/admin")) return null;

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
        strategy="afterInteractive"
      />
      <Script id="gtag-init" strategy="afterInteractive">
        {`window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', '${GA_ID}');`}
      </Script>
    </>
  );
}
