import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Data Deletion",
  description: "How to request deletion of your Next Movie data.",
  alternates: { canonical: "https://nextmovie.app/privacy/data-deletion" },
};

export default function DataDeletionPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-purple-950 text-white">
      <header className="border-b border-gray-800/50 bg-black/20 backdrop-blur sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-3">
          <Link href="/" className="text-xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            🎬 Next Movie
          </Link>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-12">
        <h1 className="text-3xl sm:text-4xl font-bold mb-2">Data Deletion</h1>
        <p className="text-gray-400 text-sm mb-10">How to remove your Next Movie account and all associated data</p>

        <div className="space-y-8 text-gray-300 leading-relaxed">

          <section className="bg-gray-800/40 border border-gray-700/50 rounded-2xl p-6">
            <h2 className="text-lg font-semibold text-white mb-3">Delete data linked to Facebook Login</h2>
            <p className="text-gray-400 mb-4">
              If you signed in to Next Movie with Facebook, you can request deletion of all data we hold about you:
            </p>
            <ol className="list-decimal list-inside space-y-2 text-gray-400">
              <li>Email <a href="mailto:support@nextmovie.app" className="text-purple-400 hover:text-purple-300">support@nextmovie.app</a> with subject <strong className="text-white">"Delete my data"</strong></li>
              <li>Include the email address or name associated with your Facebook account</li>
              <li>We will delete your account and all associated data within 30 days and send you a confirmation</li>
            </ol>
          </section>

          <section className="bg-gray-800/40 border border-gray-700/50 rounded-2xl p-6">
            <h2 className="text-lg font-semibold text-white mb-3">Delete your account directly</h2>
            <p className="text-gray-400 mb-3">
              You can also revoke Next Movie&apos;s access from within Facebook at any time:
            </p>
            <ol className="list-decimal list-inside space-y-2 text-gray-400">
              <li>Go to <strong className="text-white">Facebook Settings → Apps and Websites</strong></li>
              <li>Find <strong className="text-white">Next Movie</strong> in the list</li>
              <li>Click <strong className="text-white">Remove</strong></li>
            </ol>
            <p className="text-gray-500 text-sm mt-3">
              Removing access from Facebook revokes the login token. To fully delete your stored data (taste profile, watchlist, etc.) please also email us as above.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">What data gets deleted</h2>
            <ul className="list-disc list-inside space-y-2 text-gray-400">
              <li>Your account (name, email, profile picture)</li>
              <li>All family member profiles you created</li>
              <li>Your movie likes, dislikes, watchlist, and history</li>
              <li>Your recommendation history</li>
              <li>Your subscription record (but payment records are kept 7 years for legal / tax reasons)</li>
            </ul>
          </section>

          <p className="text-gray-500 text-sm">
            Questions? <a href="mailto:support@nextmovie.app" className="text-purple-400 hover:text-purple-300">support@nextmovie.app</a>
            {" "}&middot;{" "}
            <Link href="/privacy" className="text-purple-400 hover:text-purple-300">Privacy Policy</Link>
          </p>

        </div>
      </main>
    </div>
  );
}
