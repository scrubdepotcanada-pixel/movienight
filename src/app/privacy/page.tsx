import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "How Next Movie collects, uses, and protects your personal data.",
  alternates: { canonical: "https://nextmovie.app/privacy" },
};

export default function PrivacyPage() {
  const updated = "April 23, 2026";

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-purple-950 text-white">
      <header className="border-b border-gray-800/50 bg-black/20 backdrop-blur sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-3">
          <Link href="/" className="text-xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            🎬 Next Movie
          </Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-12">
        <h1 className="text-3xl sm:text-4xl font-bold mb-2">Privacy Policy</h1>
        <p className="text-gray-400 text-sm mb-10">Last updated: {updated}</p>

        <div className="prose prose-invert prose-gray max-w-none space-y-8 text-gray-300 leading-relaxed">

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">1. Who We Are</h2>
            <p>
              Next Movie (<strong>nextmovie.app</strong>) is a movie and TV recommendation service operated by The Web Guys
              (contact: <a href="mailto:support@nextmovie.app" className="text-purple-400 hover:text-purple-300">support@nextmovie.app</a>).
              This policy explains what personal data we collect, why, and how you can control it.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">2. Data We Collect</h2>
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-white mb-1">When you use the app as a guest</h3>
                <ul className="list-disc list-inside space-y-1 text-gray-400">
                  <li>Your IP address (to group your sessions and remember your name)</li>
                  <li>Member names you enter (e.g. "Dad", "Emma")</li>
                  <li>Movies you liked, disliked, or added to your watchlist</li>
                  <li>Filters and genres you interact with</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold text-white mb-1">When you sign in with Google or Facebook</h3>
                <ul className="list-disc list-inside space-y-1 text-gray-400">
                  <li>Your name and email address from your Google / Facebook profile</li>
                  <li>Your profile picture URL</li>
                  <li>An account identifier from the provider (we never see your password)</li>
                  <li>Everything listed above for guests</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold text-white mb-1">When you subscribe to Premium</h3>
                <ul className="list-disc list-inside space-y-1 text-gray-400">
                  <li>Payment is processed by Stripe — we receive a confirmation and store your subscription status only</li>
                  <li>We never store credit card numbers</li>
                </ul>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">3. How We Use Your Data</h2>
            <ul className="list-disc list-inside space-y-2 text-gray-400">
              <li>To generate personalised movie and TV recommendations</li>
              <li>To remember your taste profile across visits</li>
              <li>To manage your subscription and premium features</li>
              <li>To understand which features people use (aggregate analytics via Google Analytics 4)</li>
              <li>To show you relevant advertising (aggregated ad performance via Meta / Facebook Ads)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">4. Third-Party Services</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-gray-400 border-collapse">
                <thead>
                  <tr className="border-b border-gray-700">
                    <th className="text-left py-2 pr-4 text-gray-300 font-semibold">Service</th>
                    <th className="text-left py-2 pr-4 text-gray-300 font-semibold">Purpose</th>
                    <th className="text-left py-2 text-gray-300 font-semibold">Privacy Policy</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  <tr><td className="py-2 pr-4">Google OAuth</td><td className="py-2 pr-4">Sign-in</td><td className="py-2"><a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" className="text-purple-400 hover:underline">google.com</a></td></tr>
                  <tr><td className="py-2 pr-4">Facebook Login</td><td className="py-2 pr-4">Sign-in</td><td className="py-2"><a href="https://www.facebook.com/privacy/policy/" target="_blank" rel="noopener noreferrer" className="text-purple-400 hover:underline">facebook.com</a></td></tr>
                  <tr><td className="py-2 pr-4">OpenAI</td><td className="py-2 pr-4">AI recommendations</td><td className="py-2"><a href="https://openai.com/privacy" target="_blank" rel="noopener noreferrer" className="text-purple-400 hover:underline">openai.com</a></td></tr>
                  <tr><td className="py-2 pr-4">TMDB</td><td className="py-2 pr-4">Movie data</td><td className="py-2"><a href="https://www.themoviedb.org/privacy-policy" target="_blank" rel="noopener noreferrer" className="text-purple-400 hover:underline">themoviedb.org</a></td></tr>
                  <tr><td className="py-2 pr-4">Stripe</td><td className="py-2 pr-4">Payments</td><td className="py-2"><a href="https://stripe.com/privacy" target="_blank" rel="noopener noreferrer" className="text-purple-400 hover:underline">stripe.com</a></td></tr>
                  <tr><td className="py-2 pr-4">Google Analytics 4</td><td className="py-2 pr-4">Usage analytics</td><td className="py-2"><a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" className="text-purple-400 hover:underline">google.com</a></td></tr>
                  <tr><td className="py-2 pr-4">Turso (libSQL)</td><td className="py-2 pr-4">Database hosting</td><td className="py-2"><a href="https://turso.tech/privacy" target="_blank" rel="noopener noreferrer" className="text-purple-400 hover:underline">turso.tech</a></td></tr>
                </tbody>
              </table>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">5. Cookies &amp; Tracking</h2>
            <p className="text-gray-400">
              We use a session cookie to keep you signed in. Google Analytics 4 places analytics cookies to measure
              aggregate usage. We do not sell your data to advertisers and do not run retargeting ads based on your
              individual browsing history.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">6. Data Retention</h2>
            <p className="text-gray-400">
              Guest data (IP-linked) is kept indefinitely unless you request deletion. Signed-in account data is kept
              as long as your account is active. Payment records are kept for 7 years for legal / tax purposes.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">7. Your Rights</h2>
            <p className="text-gray-400 mb-3">
              Depending on where you live you may have rights to access, correct, export, or delete your data. To exercise
              any of these rights:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-400">
              <li>Email <a href="mailto:support@nextmovie.app" className="text-purple-400 hover:text-purple-300">support@nextmovie.app</a> with your request</li>
              <li>To delete data collected through Facebook Login, see our <Link href="/privacy/data-deletion" className="text-purple-400 hover:text-purple-300">Data Deletion page</Link></li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">8. Children&apos;s Privacy</h2>
            <p className="text-gray-400">
              Next Movie is not directed at children under 13. We do not knowingly collect personal data from children under 13.
              Family member profiles (e.g. "Emma, age 8") are created and managed by adult account holders.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">9. Changes to This Policy</h2>
            <p className="text-gray-400">
              We may update this policy from time to time. The "Last updated" date at the top of this page will reflect the
              most recent revision. Continued use of the service after changes constitutes acceptance.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">10. Contact</h2>
            <p className="text-gray-400">
              Questions about this policy? Email us at{" "}
              <a href="mailto:support@nextmovie.app" className="text-purple-400 hover:text-purple-300">support@nextmovie.app</a>.
            </p>
          </section>

        </div>
      </main>

      <footer className="border-t border-gray-800/50 py-6 px-4 text-center text-gray-600 text-xs">
        &copy; {new Date().getFullYear()} nextmovie.app &middot;{" "}
        <Link href="/" className="hover:text-gray-400 transition-colors">Home</Link>
        {" "}&middot;{" "}
        <Link href="/privacy/data-deletion" className="hover:text-gray-400 transition-colors">Data Deletion</Link>
      </footer>
    </div>
  );
}
