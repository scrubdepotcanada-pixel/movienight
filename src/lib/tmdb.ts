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
  genre_ids?: number[];
}

export function posterUrl(path: string | null, size: string = "w342"): string {
  if (!path) return "/no-poster.svg";
  return `${TMDB_IMAGE_BASE}/${size}${path}`;
}

function tmdbLanguage(locale?: string): string {
  const map: Record<string, string> = {
    en: "en-US", he: "he", fr: "fr-FR", es: "es-MX", ar: "ar", ru: "ru-RU", de: "de-DE",
  };
  return (locale && map[locale]) || "en-US";
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

export async function getMovieGenreIds(movieId: number): Promise<number[]> {
  const res = await fetch(`${TMDB_BASE}/movie/${movieId}?language=en-US`, { headers: headers() });
  const data = await res.json();
  return Array.isArray(data.genres) ? data.genres.map((g: { id: number }) => Number(g.id)) : [];
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

export interface WatchProvider {
  provider_id: number;
  provider_name: string;
  logo_path: string;
}

export interface WatchProviders {
  flatrate?: WatchProvider[]; // subscription streaming
  rent?: WatchProvider[];     // rentable
  buy?: WatchProvider[];      // purchasable
  link?: string;              // TMDB JustWatch link
}

export async function getWatchProviders(movieId: number, region: string = "CA"): Promise<WatchProviders> {
  const res = await fetch(
    `${TMDB_BASE}/movie/${movieId}/watch/providers`,
    { headers: headers() }
  );
  const data = await res.json();
  const countryData = data.results?.[region];
  if (!countryData) return {};
  return {
    flatrate: countryData.flatrate || [],
    rent: countryData.rent || [],
    buy: countryData.buy || [],
    link: countryData.link,
  };
}

export function providerLogoUrl(path: string): string {
  return `${TMDB_IMAGE_BASE}/w92${path}`;
}

export async function getPopularMovies(page = 1, locale?: string): Promise<Movie[]> {
  const res = await fetch(
    `${TMDB_BASE}/movie/popular?language=${tmdbLanguage(locale)}&page=${page}`,
    { headers: headers() }
  );
  const data = await res.json();
  return (data.results || []).map((m: Record<string, unknown>) => ({
    id: Number(m.id),
    title: String(m.title || ""),
    poster_path: m.poster_path ? String(m.poster_path) : null,
    vote_average: Number(m.vote_average || 0),
    overview: String(m.overview || ""),
    release_date: String(m.release_date || ""),
    genre_ids: Array.isArray(m.genre_ids) ? m.genre_ids.map(Number) : [],
  }));
}

export async function getTopRatedMovies(page = 1, locale?: string): Promise<Movie[]> {
  const res = await fetch(
    `${TMDB_BASE}/movie/top_rated?language=${tmdbLanguage(locale)}&page=${page}`,
    { headers: headers() }
  );
  const data = await res.json();
  return (data.results || []).map((m: Record<string, unknown>) => ({
    id: Number(m.id),
    title: String(m.title || ""),
    poster_path: m.poster_path ? String(m.poster_path) : null,
    vote_average: Number(m.vote_average || 0),
    overview: String(m.overview || ""),
    release_date: String(m.release_date || ""),
    genre_ids: Array.isArray(m.genre_ids) ? m.genre_ids.map(Number) : [],
  }));
}

export async function getTrendingMovies(page = 1, locale?: string): Promise<Movie[]> {
  const res = await fetch(
    `${TMDB_BASE}/trending/movie/week?language=${tmdbLanguage(locale)}&page=${page}`,
    { headers: headers() }
  );
  const data = await res.json();
  return (data.results || []).map((m: Record<string, unknown>) => ({
    id: Number(m.id),
    title: String(m.title || ""),
    poster_path: m.poster_path ? String(m.poster_path) : null,
    vote_average: Number(m.vote_average || 0),
    overview: String(m.overview || ""),
    release_date: String(m.release_date || ""),
    genre_ids: Array.isArray(m.genre_ids) ? m.genre_ids.map(Number) : [],
  }));
}

// ── Credits & Person ────────────────────────────────────────────

export interface CastMember {
  id: number;
  name: string;
  character: string;
  profile_path: string | null;
  order: number;
}

export interface CrewMember {
  id: number;
  name: string;
  job: string;
  department: string;
  profile_path: string | null;
}

export interface MovieCredits {
  cast: CastMember[];
  crew: CrewMember[];
  director: CrewMember | null;
}

export async function getMovieCredits(movieId: number): Promise<MovieCredits> {
  const res = await fetch(`${TMDB_BASE}/movie/${movieId}/credits`, { headers: headers() });
  const data = await res.json();
  const cast = (data.cast || []).slice(0, 10).map((c: Record<string, unknown>) => ({
    id: Number(c.id),
    name: String(c.name),
    character: String(c.character || ""),
    profile_path: c.profile_path ? String(c.profile_path) : null,
    order: Number(c.order || 0),
  }));
  const crew = (data.crew || []).map((c: Record<string, unknown>) => ({
    id: Number(c.id),
    name: String(c.name),
    job: String(c.job || ""),
    department: String(c.department || ""),
    profile_path: c.profile_path ? String(c.profile_path) : null,
  }));
  const director = crew.find((c: CrewMember) => c.job === "Director") || null;
  return { cast, crew, director };
}

export async function getPersonMovies(personId: number, locale?: string): Promise<Movie[]> {
  const res = await fetch(
    `${TMDB_BASE}/person/${personId}/movie_credits?language=${tmdbLanguage(locale)}`,
    { headers: headers() }
  );
  const data = await res.json();
  const allMovies = [...(data.cast || []), ...(data.crew || []).filter((c: Record<string, unknown>) => c.job === "Director")];
  const seen = new Set<number>();
  const unique: Movie[] = [];
  for (const m of allMovies) {
    if (seen.has(Number(m.id)) || !m.poster_path) continue;
    seen.add(Number(m.id));
    unique.push({
      id: Number(m.id),
      title: String(m.title || ""),
      poster_path: m.poster_path ? String(m.poster_path) : null,
      vote_average: Number(m.vote_average || 0),
      overview: String(m.overview || ""),
      release_date: String(m.release_date || ""),
    });
  }
  return unique
    .filter(m => m.vote_average > 0)
    .sort((a, b) => b.vote_average - a.vote_average)
    .slice(0, 20);
}

// ── Discover (Advanced Filters) ─────────────────────────────────

export interface DiscoverFilters {
  minRating?: number;
  minVoteCount?: number;
  decade?: string;
  minYear?: number;
  maxRuntime?: number;
  genre?: number;
  excludeGenre?: number;
  sortBy?: string;
  providerId?: number;
  watchRegion?: string;
  personId?: number;
  language?: string;
}

const GENRE_IDS: Record<string, number> = {
  action: 28, comedy: 35, drama: 18, horror: 27, "sci-fi": 878,
  romance: 10749, thriller: 53, animation: 16, documentary: 99,
  fantasy: 14, mystery: 9648, adventure: 12,
};

export function getGenreId(name: string): number | undefined {
  return GENRE_IDS[name.toLowerCase()];
}

export const ANIMATION_GENRE_ID = 16;

// Animated movies are frequently co-tagged with other genres (e.g. an animated
// sci-fi film), which lets cartoons leak into non-animation genre buckets.
// Cartoons should only ever surface when Animation itself is the selected genre.
export function conflictsWithAnimation(genreIds: number[] | undefined, targetGenreId: number | null): boolean {
  if (!targetGenreId || targetGenreId === ANIMATION_GENRE_ID) return false;
  return (genreIds || []).includes(ANIMATION_GENRE_ID);
}

export async function discoverMovies(filters: DiscoverFilters, locale?: string, page = 1): Promise<Movie[]> {
  const params = new URLSearchParams({
    include_adult: "false",
    language: tmdbLanguage(locale),
    sort_by: filters.sortBy || "vote_average.desc",
    "vote_count.gte": String(filters.minVoteCount || 100),
    page: String(page),
  });
  if (filters.minRating) params.set("vote_average.gte", String(filters.minRating));
  if (filters.maxRuntime) params.set("with_runtime.lte", String(filters.maxRuntime));
  if (filters.genre) params.set("with_genres", String(filters.genre));
  if (filters.excludeGenre) params.set("without_genres", String(filters.excludeGenre));
  if (filters.providerId) {
    params.set("with_watch_providers", String(filters.providerId));
    params.set("watch_region", filters.watchRegion || "US");
  }
  if (filters.personId) params.set("with_people", String(filters.personId));
  if (filters.language) params.set("with_original_language", filters.language);
  if (filters.decade) {
    const startYear = parseInt(filters.decade);
    params.set("primary_release_date.gte", `${startYear}-01-01`);
    params.set("primary_release_date.lte", `${startYear + 9}-12-31`);
  }
  if (filters.minYear) {
    params.set("primary_release_date.gte", `${filters.minYear}-01-01`);
  }

  const res = await fetch(`${TMDB_BASE}/discover/movie?${params}`, { headers: headers() });
  const data = await res.json();
  return (data.results || []).slice(0, 20).map((m: Record<string, unknown>) => ({
    id: Number(m.id),
    title: String(m.title || ""),
    poster_path: m.poster_path ? String(m.poster_path) : null,
    vote_average: Number(m.vote_average || 0),
    overview: String(m.overview || ""),
    release_date: String(m.release_date || ""),
    genre_ids: Array.isArray(m.genre_ids) ? m.genre_ids.map(Number) : [],
  }));
}

export async function getSimilarMovies(movieId: number, locale?: string): Promise<Movie[]> {
  const res = await fetch(
    `${TMDB_BASE}/movie/${movieId}/similar?language=${tmdbLanguage(locale)}&page=1`,
    { headers: headers() }
  );
  const data = await res.json();
  return (data.results || []).map((m: Record<string, unknown>) => ({
    id: Number(m.id),
    title: String(m.title || ""),
    poster_path: m.poster_path ? String(m.poster_path) : null,
    vote_average: Number(m.vote_average || 0),
    overview: String(m.overview || ""),
    release_date: String(m.release_date || ""),
    genre_ids: Array.isArray(m.genre_ids) ? m.genre_ids.map(Number) : [],
  }));
}

export async function getRecommendedMovies(movieId: number, locale?: string): Promise<Movie[]> {
  const res = await fetch(
    `${TMDB_BASE}/movie/${movieId}/recommendations?language=${tmdbLanguage(locale)}&page=1`,
    { headers: headers() }
  );
  const data = await res.json();
  return (data.results || []).map((m: Record<string, unknown>) => ({
    id: Number(m.id),
    title: String(m.title || ""),
    poster_path: m.poster_path ? String(m.poster_path) : null,
    vote_average: Number(m.vote_average || 0),
    overview: String(m.overview || ""),
    release_date: String(m.release_date || ""),
    genre_ids: Array.isArray(m.genre_ids) ? m.genre_ids.map(Number) : [],
  }));
}

// ── TV Show Support ──────────────────────────────────────────────

export interface TVShow {
  id: number;
  name: string;
  poster_path: string | null;
  vote_average: number;
  overview: string;
  first_air_date: string;
  certification?: string;
}

/** Unified interface for both movies and shows */
export interface ContentItem {
  id: number;
  title: string;
  poster_path: string | null;
  vote_average: number;
  overview: string;
  release_date: string;
  certification?: string;
  content_type: "movie" | "show";
}

export async function searchTVShows(query: string, locale?: string): Promise<TVShow[]> {
  const res = await fetch(
    `${TMDB_BASE}/search/tv?query=${encodeURIComponent(query)}&include_adult=false&language=${tmdbLanguage(locale)}&page=1`,
    { headers: headers() }
  );
  const data = await res.json();
  return data.results || [];
}

export async function getTVShowCertification(showId: number): Promise<string> {
  const res = await fetch(
    `${TMDB_BASE}/tv/${showId}/content_ratings`,
    { headers: headers() }
  );
  const data = await res.json();
  const usResult = data.results?.find(
    (r: { iso_3166_1: string }) => r.iso_3166_1 === "US"
  );
  return usResult?.rating || "NR";
}

/** Normalize a TVShow into our Movie-compatible shape (title instead of name, release_date instead of first_air_date) */
function normalizeTVShow(show: TVShow, certification: string): Movie & { certification: string } {
  return {
    id: show.id,
    title: show.name,
    poster_path: show.poster_path,
    vote_average: show.vote_average,
    overview: show.overview,
    release_date: show.first_air_date,
    certification,
  };
}

export async function enrichTVShowsWithCertifications(shows: TVShow[], _locale?: string): Promise<(Movie & { certification: string })[]> {
  const enriched = await Promise.all(
    shows.map(async (show) => {
      const cert = await getTVShowCertification(show.id);
      return normalizeTVShow(show, cert);
    })
  );
  return enriched;
}

/**
 * Look up a TV show by title and optional year via TMDB search,
 * then enrich it with certification.
 */
export async function lookupTVShow(
  title: string,
  year?: number,
  locale?: string
): Promise<(Movie & { certification: string }) | null> {
  const yearParam = year ? `&first_air_date_year=${year}` : "";
  const res = await fetch(
    `${TMDB_BASE}/search/tv?query=${encodeURIComponent(title)}${yearParam}&include_adult=false&language=${tmdbLanguage(locale)}&page=1`,
    { headers: headers() }
  );
  const data = await res.json();
  const results: TVShow[] = data.results || [];
  if (results.length === 0) return null;

  const show = results[0];
  const cert = await getTVShowCertification(show.id);
  return normalizeTVShow(show, cert);
}

/**
 * Take an array of {title, year} from OpenAI and resolve them
 * to full TV show objects with posters, ratings, and certifications.
 * Normalized to use `title` and `release_date` fields for consistency with movies.
 */
export async function resolveAIShowSuggestions(
  suggestions: { title: string; year: number }[],
  locale?: string
): Promise<(Movie & { certification: string })[]> {
  const results = await Promise.all(
    suggestions.map((s) => lookupTVShow(s.title, s.year, locale))
  );
  return results.filter((m): m is Movie & { certification: string } => m !== null);
}

export async function getTVWatchProviders(showId: number, region: string = "CA"): Promise<WatchProviders> {
  const res = await fetch(
    `${TMDB_BASE}/tv/${showId}/watch/providers`,
    { headers: headers() }
  );
  const data = await res.json();
  const countryData = data.results?.[region];
  if (!countryData) return {};
  return {
    flatrate: countryData.flatrate || [],
    rent: countryData.rent || [],
    buy: countryData.buy || [],
    link: countryData.link,
  };
}
