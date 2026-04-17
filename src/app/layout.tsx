import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { SessionProvider } from "next-auth/react";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Next Movie — AI Movie Picks for the Whole Family",
    template: "%s | Next Movie",
  },
  description:
    "Find your next movie in seconds. AI-powered movie recommendations with family profiles, age-safe filtering, and taste learning. Free movie picker for families — no more arguing about what to watch.",
  metadataBase: new URL("https://nextmovie.app"),
  keywords: [
    "movie recommendations",
    "family movie night",
    "what to watch",
    "AI movie picker",
    "movie suggestions",
    "family movie app",
    "movie finder",
    "kids movie recommendations",
    "age appropriate movies",
    "movie night picker",
    "best movies to watch",
    "movie recommendation app",
    "what movie should I watch",
    "family friendly movies",
    "movie ideas for tonight",
  ],
  authors: [{ name: "Next Movie", url: "https://nextmovie.app" }],
  creator: "thewebguys.ca",
  publisher: "Next Movie",
  alternates: {
    canonical: "https://nextmovie.app",
  },
  openGraph: {
    title: "Next Movie — AI Movie Picks for the Whole Family",
    description:
      "Stop scrolling, start watching. Get personalized movie recommendations for every family member — powered by AI, filtered by age. Free.",
    url: "https://nextmovie.app",
    siteName: "Next Movie",
    locale: "en_US",
    type: "website",
    images: [
      {
        url: "/api/og",
        width: 1200,
        height: 630,
        alt: "Next Movie — AI-powered family movie recommendations",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Next Movie — AI Movie Picks for the Whole Family",
    description:
      "Stop scrolling, start watching. Personalized movie recommendations for every family member — free.",
    images: ["/api/og"],
  },
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/favicon.ico", sizes: "32x32" },
    ],
    apple: "/favicon.svg",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    // Add your Google Search Console verification code here
    // google: "your-verification-code",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        {/* Google Analytics */}
        <script async src="https://www.googletagmanager.com/gtag/js?id=G-322V3KQPHK" />
        <script
          dangerouslySetInnerHTML={{
            __html: `window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', 'G-322V3KQPHK');`,
          }}
        />
        {/* JSON-LD Structured Data for SEO + AEO */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebApplication",
              name: "Next Movie",
              url: "https://nextmovie.app",
              description:
                "Free AI-powered movie recommendation app for families. Get personalized movie picks with age-safe filtering, genre browsing, and taste learning. Find your next movie in seconds.",
              applicationCategory: "EntertainmentApplication",
              operatingSystem: "Any",
              offers: {
                "@type": "Offer",
                price: "0",
                priceCurrency: "USD",
              },
              creator: {
                "@type": "Organization",
                name: "thewebguys.ca",
                url: "https://thewebguys.ca",
              },
              featureList: [
                "AI-powered movie recommendations",
                "Family profiles with individual taste preferences",
                "Age-based content filtering (G, PG, PG-13, R)",
                "12 genre categories with independent taste learning",
                "Like, dislike, and pass for smarter suggestions",
                "Where to watch — streaming provider links",
                "Works with Netflix, Disney+, Prime Video, and more",
              ],
            }),
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "FAQPage",
              mainEntity: [
                {
                  "@type": "Question",
                  name: "What is Next Movie?",
                  acceptedAnswer: {
                    "@type": "Answer",
                    text: "Next Movie is a free AI-powered movie recommendation app for families. It suggests movies based on your taste preferences, filters content by age rating (G, PG, PG-13, R), and shows you where to stream each movie.",
                  },
                },
                {
                  "@type": "Question",
                  name: "How does Next Movie recommend movies?",
                  acceptedAnswer: {
                    "@type": "Answer",
                    text: "Next Movie uses OpenAI to analyze your likes and dislikes across different genres. The more you interact (like, dislike, or pass on movies), the smarter the recommendations become. Each family member gets their own taste profile.",
                  },
                },
                {
                  "@type": "Question",
                  name: "Is Next Movie free?",
                  acceptedAnswer: {
                    "@type": "Answer",
                    text: "Yes, Next Movie is 100% free. No credit card required. You can use it as a guest or sign in with Google to save your preferences across devices.",
                  },
                },
                {
                  "@type": "Question",
                  name: "Can I filter movies by age rating for my kids?",
                  acceptedAnswer: {
                    "@type": "Answer",
                    text: "Yes. Each family member can have their own content rating limit — G for young kids, PG for family, PG-13 for teens, or R for adults. The AI only suggests age-appropriate movies for each profile.",
                  },
                },
                {
                  "@type": "Question",
                  name: "What streaming services does Next Movie support?",
                  acceptedAnswer: {
                    "@type": "Answer",
                    text: "Next Movie shows where each movie is available to stream, rent, or buy across Netflix, Disney+, Amazon Prime Video, Apple TV+, Crave, Hulu, and many more services. Availability is shown by country.",
                  },
                },
              ],
            }),
          }}
        />
      </head>
      <body className="min-h-full flex flex-col">
        <SessionProvider>{children}</SessionProvider>
      </body>
    </html>
  );
}
