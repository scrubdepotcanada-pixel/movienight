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

export async function searchMovies(query: string): Promise<Movie[]> {
  const res = await fetch(
    `${TMDB_BASE}/search/movie?query=${encodeURIComponent(query)}&include_adult=false&language=en-US&page=1`,
    { headers: headers() }
  );
  const data = await res.json();
  return data.results || [];
}

export async function getSimilarMovies(movieId: number): Promise<Movie[]> {
  const res = await fetch(
    `${TMDB_BASE}/movie/${movieId}/similar?language=en-US&page=1`,
    { headers: headers() }
  );
  const data = await res.json();
  return data.results || [];
}

export async function getRecommendedMovies(movieId: number): Promise<Movie[]> {
  const res = await fetch(
    `${TMDB_BASE}/movie/${movieId}/recommendations?language=en-US&page=1`,
    { headers: headers() }
  );
  const data = await res.json();
  return data.results || [];
}

export async function getMovieCertification(movieId: number): Promise<string> {
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

export async function getMovieDetails(movieId: number): Promise<Movie & { certification: string }> {
  const [movieRes, cert] = await Promise.all([
    fetch(`${TMDB_BASE}/movie/${movieId}?language=en-US`, { headers: headers() }),
    getMovieCertification(movieId),
  ]);
  const movie = await movieRes.json();
  return { ...movie, certification: cert };
}

export async function enrichWithCertifications(movies: Movie[]): Promise<(Movie & { certification: string })[]> {
  const enriched = await Promise.all(
    movies.map(async (movie) => {
      const cert = await getMovieCertification(movie.id);
      return { ...movie, certification: cert };
    })
  );
  return enriched;
}
