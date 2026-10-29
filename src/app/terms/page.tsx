import type { Metadata } from "next";
import Link from "next/link";
import SiteFooter from "@/components/SiteFooter";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "The terms that govern your use of Next Movie.",
  alternates: { canonical: "https://nextmovie.app/terms" },
};

export default function TermsPage() {
  const updated = "October 29, 2026";

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
        <h1 className="text-3xl sm:text-4xl font-bold mb-2">Terms of Service</h1>
        <p className="text-gray-400 text-sm mb-10">Last updated: {updated}</p>

        <div className="prose prose-invert prose-gray max-w-none space-y-8 text-gray-300 leading-relaxed">

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">1. Agreement to Terms</h2>
            <p>
              Next Movie (<strong>nextmovie.app</strong>) is operated by The Web Guys
              (contact: <a href="mailto:support@nextmovie.app" className="text-purple-400 hover:text-purple-300">support@nextmovie.app</a>).
              By using the site — as a guest or a signed-in account — you agree to these terms. If you do not agree, please
              do not use the service.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">2. The Service</h2>
            <p className="text-gray-400">
              Next Movie suggests movies and TV shows based on your picks and ratings, and shows where titles are available
              to stream, rent, or buy. It is free to use, with an optional Premium subscription for additional features. You
              can use the core experience as a guest, with no account required.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">3. Accounts &amp; Guest Use</h2>
            <ul className="list-disc list-inside space-y-2 text-gray-400">
              <li>You may use Next Movie as a guest, or sign in with Google or Facebook to save your taste across devices.</li>
              <li>You are responsible for keeping any account credentials (via your sign-in provider) secure.</li>
              <li>Family member profiles you create (names, ages, content ratings) must be managed by an adult account holder — see Section 7.</li>
              <li>We may suspend or terminate access for use that violates these terms or abuses the service (see Section 4).</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">4. Acceptable Use</h2>
            <p className="text-gray-400 mb-3">You agree not to:</p>
            <ul className="list-disc list-inside space-y-2 text-gray-400">
              <li>Scrape, bulk-extract, or automate requests against the service outside normal interactive use</li>
              <li>Attempt to bypass rate limits, content rating filters, or Premium feature gates</li>
              <li>Use the service to harass, abuse, or collect data about other users</li>
              <li>Interfere with or disrupt the service's infrastructure or security</li>
              <li>Misrepresent your identity or impersonate another person or entity</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">5. Content &amp; Third-Party Data</h2>
            <p className="text-gray-400">
              Movie and TV data, posters, ratings, and streaming availability are sourced from The Movie Database (TMDB) and
              other third-party providers. Recommendations are generated with AI (OpenAI) based on your picks. We make a
              reasonable effort to keep this accurate, but streaming availability, pricing, and content ratings can change
              or be wrong — always confirm on the streaming service itself before relying on it, especially for content
              rating decisions involving children. Next Movie is not affiliated with TMDB, Netflix, Disney+, or any
              streaming service referenced in the app.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">6. Premium Subscriptions &amp; Billing</h2>
            <ul className="list-disc list-inside space-y-2 text-gray-400">
              <li>Premium plans (monthly, yearly, or lifetime) are billed through Stripe. Pricing is shown on the <Link href="/premium" className="text-purple-400 hover:text-purple-300">Premium page</Link> at checkout.</li>
              <li>Monthly and yearly plans renew automatically until cancelled. You can cancel anytime from the billing portal linked on the Premium page — cancellation takes effect at the end of the current billing period.</li>
              <li>Lifetime plans are a one-time payment with no recurring charge.</li>
              <li>We do not store your card details — Stripe handles payment processing directly.</li>
              <li>Refunds are handled case by case — email <a href="mailto:support@nextmovie.app" className="text-purple-400 hover:text-purple-300">support@nextmovie.app</a>.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">7. Children &amp; Family Profiles</h2>
            <p className="text-gray-400">
              Next Movie is not directed at children under 13, and accounts may only be created by someone 13 or older.
              Family member profiles for children are created and managed by an adult. Content rating filters (G, PG,
              PG-13, R, or a guest's chosen rating cap) are provided as a tool to help filter suggestions — they rely on
              third-party certification data and are not a guarantee of appropriateness for every child. Parents and
              guardians are responsible for supervising what their family watches.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">8. Intellectual Property</h2>
            <p className="text-gray-400">
              The Next Movie name, design, and software are owned by The Web Guys. Movie/TV titles, posters, and metadata
              belong to their respective rightsholders and are used under TMDB's terms. You may not copy, resell, or
              redistribute the service or its underlying code.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">9. Disclaimers &amp; Limitation of Liability</h2>
            <p className="text-gray-400">
              Next Movie is provided &quot;as is&quot; without warranties of any kind. We do not guarantee that
              recommendations, streaming availability, or content ratings are complete, accurate, or uninterrupted. To the
              extent permitted by law, The Web Guys is not liable for indirect, incidental, or consequential damages
              arising from your use of the service.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">10. Termination</h2>
            <p className="text-gray-400">
              You may stop using the service at any time. We may suspend or terminate access for violations of these terms,
              including the acceptable-use rules in Section 4. Sections that by their nature should survive termination
              (intellectual property, disclaimers, limitation of liability) will continue to apply.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">11. Changes to These Terms</h2>
            <p className="text-gray-400">
              We may update these terms from time to time. The &quot;Last updated&quot; date at the top of this page
              reflects the most recent revision. Continued use of the service after changes take effect constitutes
              acceptance of the updated terms.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">12. Contact</h2>
            <p className="text-gray-400">
              Questions about these terms? Email us at{" "}
              <a href="mailto:support@nextmovie.app" className="text-purple-400 hover:text-purple-300">support@nextmovie.app</a>.
              See also our <Link href="/privacy" className="text-purple-400 hover:text-purple-300">Privacy Policy</Link>.
            </p>
          </section>

        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
