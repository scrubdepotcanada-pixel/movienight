import ClientPage from "./ClientPage";

export default function Home() {
  return (
    <>
      <ClientPage />

      {/* Server-rendered SEO content — visible to crawlers, hidden from users */}
      <div className="sr-only" aria-hidden="true">
        <h1>Next Movie — Smart Movie Picks for Families</h1>
        <p>
          Next Movie helps your family pick a movie fast.
          No more fights over what to watch.
          Just open the app, and our AI finds the right film for everyone.
        </p>
        <p>
          It works for all ages. Set a rating for each person.
          Kids get kid-safe picks. Teens get teen-safe picks.
          Adults see it all. Simple.
        </p>

        <h2>How It Works</h2>
        <ol>
          <li>Make a profile for each family member.</li>
          <li>Pick a genre, type what you want, or search by name.</li>
          <li>Like or skip movies. The AI learns what you love.</li>
          <li>See where to watch — Netflix, Disney+, Prime, and more.</li>
        </ol>

        <h2>What You Get</h2>
        <ul>
          <li>Smart movie and TV show picks</li>
          <li>Age-safe filters — G, PG, PG-13, R</li>
          <li>One profile per family member</li>
          <li>12 genres — Action, Comedy, Drama, Horror, Sci-Fi, and more</li>
          <li>Mood search — tell us how you feel, we find the match</li>
          <li>Family Swipe — everyone swipes, we find the one you all like</li>
          <li>Stream links — see where to watch on Netflix, Disney+, Prime, Apple TV+</li>
          <li>Works on any phone or laptop — no app to install</li>
        </ul>

        <h2>Browse by Genre</h2>
        <nav>
          <a href="/">Action Movies</a>
          <a href="/">Comedy Movies</a>
          <a href="/">Drama Movies</a>
          <a href="/">Horror Movies</a>
          <a href="/">Sci-Fi Movies</a>
          <a href="/">Romance Movies</a>
          <a href="/">Thriller Movies</a>
          <a href="/">Kids Movies</a>
          <a href="/">Docs and True Stories</a>
          <a href="/">Fantasy Movies</a>
          <a href="/">Mystery Movies</a>
          <a href="/">Adventure Movies</a>
        </nav>

        <h2>Common Questions</h2>
        <h3>What is Next Movie?</h3>
        <p>
          Next Movie is a free movie picker for families.
          It uses AI to suggest films based on what you like.
          Plus, it filters by age so kids only see safe picks.
        </p>
        <h3>Is it really free?</h3>
        <p>
          Yes — 100% free. No credit card needed.
          Use it as a guest or sign in with Google to save your picks.
        </p>
        <h3>How does it learn my taste?</h3>
        <p>
          Each time you like or skip a movie, the AI gets smarter.
          It tracks each person in your family on their own.
          So your picks stay yours.
        </p>
        <h3>Can I set age limits?</h3>
        <p>
          Yes. Each person gets their own rating cap.
          G for little kids. PG for family. PG-13 for teens. R for adults.
          The AI only shows what fits.
        </p>
        <h3>What apps does it work with?</h3>
        <p>
          We show where to watch each movie.
          That includes Netflix, Disney+, Prime Video, Apple TV+, Crave, Hulu, and more.
        </p>
      </div>
    </>
  );
}
