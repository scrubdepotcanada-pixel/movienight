import ClientPage from "./ClientPage";

export default function Home() {
  return (
    <>
      <ClientPage />

      {/* Server-rendered SEO content — visible to crawlers, hidden from users */}
      <div className="sr-only" aria-hidden="true">
        <h1>Next Movie — AI Movie Recommendations for Families</h1>
        <p>
          Next Movie is a free AI-powered movie recommendation app designed for families.
          Stop arguing about what to watch — get personalized movie picks for every family member
          based on their unique taste, filtered by age rating, and powered by artificial intelligence.
        </p>

        <h2>How It Works</h2>
        <ol>
          <li>Create a profile for each family member with their age and preferences.</li>
          <li>Browse by genre, describe what you want, or search by title.</li>
          <li>Like or dislike recommendations — the AI learns your taste over time.</li>
          <li>Find where to stream each movie on Netflix, Disney+, Prime Video, and more.</li>
        </ol>

        <h2>Features</h2>
        <ul>
          <li>AI-powered movie and TV show recommendations</li>
          <li>Age-safe content filtering (G, PG, PG-13, R ratings)</li>
          <li>Family profiles with individual taste learning</li>
          <li>12 genre categories including Action, Comedy, Drama, Horror, Sci-Fi, and more</li>
          <li>Mood-based discovery — tell the AI how you feel and get matching picks</li>
          <li>Family Swipe mode — everyone swipes, we find the movie you all agree on</li>
          <li>Streaming provider links — see where to watch on Netflix, Disney+, Amazon Prime, Apple TV+, Crave, Hulu</li>
          <li>Works on desktop and mobile — no app download required</li>
        </ul>

        <h2>Popular Genres</h2>
        <nav>
          <a href="/">Action Movies</a>
          <a href="/">Comedy Movies</a>
          <a href="/">Drama Movies</a>
          <a href="/">Horror Movies</a>
          <a href="/">Sci-Fi Movies</a>
          <a href="/">Romance Movies</a>
          <a href="/">Thriller Movies</a>
          <a href="/">Animation Movies</a>
          <a href="/">Documentary Films</a>
          <a href="/">Fantasy Movies</a>
          <a href="/">Mystery Movies</a>
          <a href="/">Adventure Movies</a>
        </nav>

        <h2>Frequently Asked Questions</h2>
        <h3>What is Next Movie?</h3>
        <p>
          Next Movie is a free AI-powered movie recommendation app for families. It suggests movies
          based on your taste preferences, filters content by age rating, and shows you where to stream each movie.
        </p>
        <h3>Is Next Movie free?</h3>
        <p>
          Yes, Next Movie is 100% free. No credit card required. Use it as a guest or sign in with Google to save your preferences.
        </p>
        <h3>How does the AI learn my taste?</h3>
        <p>
          Every time you like or dislike a recommendation, the AI adjusts future suggestions to better match your preferences.
          Each family member has their own independent taste profile.
        </p>
        <h3>Can I filter movies by age rating?</h3>
        <p>
          Yes. Each family member can have their own content rating limit — G for young kids, PG for family,
          PG-13 for teens, or R for adults. The AI only suggests age-appropriate movies for each profile.
        </p>
        <h3>What streaming services does Next Movie support?</h3>
        <p>
          Next Movie shows where each movie is available across Netflix, Disney+, Amazon Prime Video,
          Apple TV+, Crave, Hulu, Paramount+, and many more services.
        </p>
      </div>
    </>
  );
}
