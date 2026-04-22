import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { SessionProvider } from "next-auth/react";
import "./globals.css";
import GoogleAnalytics from "@/components/GoogleAnalytics";

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
    "Free AI movie picker for families. Get smart picks for every age, see where to stream, and stop fighting over what to watch.",
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
      "Stop scrolling, start watching. Smart movie picks for every family member — filtered by age, free to use.",
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
      "Stop scrolling, start watching. Smart movie picks for every family member — free.",
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
        {/* JSON-LD Structured Data for SEO + AEO */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebApplication",
              name: "Next Movie",
              alternateName: "NextMovie",
              url: "https://nextmovie.app",
              description:
                "Free AI movie picker for families. Get smart picks with age-safe filters and taste learning. Find your next movie in seconds.",
              applicationCategory: "EntertainmentApplication",
              operatingSystem: "Any",
              browserRequirements: "Requires a modern web browser",
              availableOnDevice: "Desktop, Mobile, Tablet",
              inLanguage: "en",
              isAccessibleForFree: true,
              offers: [
                {
                  "@type": "Offer",
                  price: "0",
                  priceCurrency: "USD",
                  description: "Free plan with AI movie picks, mood search, and genre browsing",
                },
                {
                  "@type": "Offer",
                  price: "4.99",
                  priceCurrency: "USD",
                  description: "Premium monthly plan with advanced filters, language search, and unlimited history",
                  priceValidUntil: "2027-12-31",
                },
                {
                  "@type": "Offer",
                  price: "49.99",
                  priceCurrency: "USD",
                  description: "Premium yearly plan — save 17%",
                  priceValidUntil: "2027-12-31",
                },
              ],
              creator: {
                "@type": "Organization",
                name: "The Web Guys",
                url: "https://thewebguys.ca",
              },
              featureList: [
                "AI-powered movie and TV show recommendations",
                "Family profiles with individual taste learning",
                "Age-based content filtering (G, PG, PG-13, R)",
                "12 genre categories with mood and theme search",
                "Family Swipe mode — everyone swipes, find the match",
                "Where to watch — Netflix, Disney+, Prime Video, Apple TV+, Crave, Hulu",
                "Multi-language movie search (20+ languages including Korean, French, Hindi)",
                "Search by actor or director name",
                "Filter by streaming platform, decade, rating, and runtime",
                "Personal watchlist and taste profile stats",
                "Works in Canada, USA, UK, Australia, and 50+ countries",
                "No app download required — works in any browser",
              ],
              audience: {
                "@type": "PeopleAudience",
                suggestedMinAge: 0,
                audienceType: "Families, Parents, Movie lovers",
              },
              screenshot: "https://nextmovie.app/api/og",
              softwareVersion: "1.0",
              keywords: "movie recommendation app, family movie picker, AI movie suggestions, what to watch tonight, movies for kids, age appropriate movies, movie finder Canada, JustWatch alternative, Letterboxd for families, best movie app",
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
        <GoogleAnalytics />
        <SessionProvider>{children}</SessionProvider>
      </body>
    </html>
  );
}
