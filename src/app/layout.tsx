import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
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
  title: "Next Movie — AI Movie Picks for the Whole Family",
  description:
    "Find your next movie in seconds. AI-powered recommendations with family profiles, age-safe filtering, and taste learning. Free to use.",
  metadataBase: new URL("https://nextmovie.app"),
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
    icon: "/favicon.ico",
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
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
