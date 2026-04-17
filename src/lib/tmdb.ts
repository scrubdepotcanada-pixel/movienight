const TMDB_BASE = "https://api.themoviedb.org/3";
const TMDB_IMAGE_BASE = "https://image.tmdb.org/t/p";

function headers() {
  return {
    Authorization: `Bearer ${process.env.TMDB_ACCESS_TOKEN}`,
    "Content-Type": "application/json",
  };
}

export interface Movie {
  id: number;
  title: string;
  poster_path: string | null;
  vote_average: number;
  overview: string;
  release_date: string;
  certification?: string;
}

export function posterUrl(path: string | null, size: string = "w342"): string {
  if (!path) return "/no-poster.svg";
  return `${TMDB_IMAGE_BASE}/${size}${path}`;
}

function tmdbLanguage(locale?: string): string {
  return locale === "he" ? "he" : "en-US";
}

export async function searchMovies(query: string, locale?: string): Promise<Movie[]> {
  const res = await fetch(
    `${TMDB_BASE}/search/movie?query=${encodeURIComponent(query)}&include_adult=false&language=${tmdbLanguage(locale)}&page=1`,
    { headers: headers() }
  );
  const data = await res.json();
  return data.results || [];
}


export async function getMovieCertification(movieId: number, _locale?: string): Promise<string> {
  // Certification data is language-independent (always US ratings), so locale is accepted
  // for API consistency but not used in the TMDB call.
  const res = await fetch(
    `${TMDB_BASE}/movie/${movieId}/release_dates`,
    { headers: headers() }
  );
  const data = await res.json();
  const usRelease = data.results?.find(
    (r: { iso_3166_1: string }) => r.iso_3166_1 === "US"
  );
  if (usRelease?.release_dates?.length > 0) {
    const cert = usRelease.release_dates.find(
      (rd: { certification: string }) => rd.certification
    );
    return cert?.certification || "NR";
  }
  return "NR";
}

export async function getMovieDetails(movieId: number, locale?: string): Promise<Movie & { certification: string }> {
  const [movieRes, cert] = await Promise.all([
    fetch(`${TMDB_BASE}/movie/${movieId}?language=${tmdbLanguage(locale)}`, { headers: headers() }),
    getMovieCertification(movieId, locale),
  ]);
  const movie = await movieRes.json();
  return { ...movie, certification: cert };
}

export async function enrichWithCertifications(movies: Movie[], locale?: string): Promise<(Movie & { certification: string })[]> {
  const enriched = await Promise.all(
    movies.map(async (movie) => {
      const cert = await getMovieCertification(movie.id, locale);
      return { ...movie, certification: cert };
    })
  );
  return enriched;
}

/**
 * Look up a movie by title and optional year via TMDB search,
 * then enrich it with certification. Used to hydrate OpenAI suggestions
 * with poster images, ratings, and age ratings.
 */
export async function lookupMovie(
  title: string,
  year?: number,
  locale?: string
): Promise<(Movie & { certification: string }) | null> {
  const yearParam = year ? `&year=${year}` : "";
  const res = await fetch(
    `${TMDB_BASE}/search/movie?query=${encodeURIComponent(title)}${yearParam}&include_adult=false&language=${tmdbLanguage(locale)}&page=1`,
    { headers: headers() }
  );
  const data = await res.json();
  const results: Movie[] = data.results || [];
  if (results.length === 0) return null;

  const movie = results[0];
  const cert = await getMovieCertification(movie.id, locale);
  return { ...movie, certification: cert };
}

/**
 * Take an array of {title, year} from OpenAI and resolve them
 * to full Movie objects with posters, ratings, and certifications.
 */
export async function resolveAISuggestions(
  suggestions: { title: string; year: number }[],
  locale?: string
): Promise<(Movie & { certification: string })[]> {
  const results = await Promise.all(
    suggestions.map((s) => lookupMovie(s.title, s.year, locale))
  );
  return results.filter((m): m is Movie & { certification: string } => m !== null);
}
