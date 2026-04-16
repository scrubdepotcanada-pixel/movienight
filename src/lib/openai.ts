import OpenAI from "openai";

let _openai: OpenAI | null = null;
function getOpenAI(): OpenAI {
  if (!_openai) {
    _openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return _openai;
}

interface MovieSuggestion {
  title: string;
  year: number;
}

async function askForMovies(prompt: string, count: number): Promise<MovieSuggestion[]> {
  const response = await getOpenAI().chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0.9,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content: `You are a movie recommendation expert. You always respond in JSON format with a "movies" array containing objects with "title" (string) and "year" (number) fields. Only suggest real, well-known movies. Never repeat movies. Always return exactly ${count} movies.`,
      },
      {
        role: "user",
        content: prompt,
      },
    ],
  });

  const content = response.choices[0]?.message?.content;
  if (!content) return [];

  try {
    const parsed = JSON.parse(content);
    return (parsed.movies || []).slice(0, count);
  } catch {
    return [];
  }
}

export async function getSimilarMoviesAI(
  movieTitle: string,
  watchedTitles: string[]
): Promise<MovieSuggestion[]> {
  const excludeList =
    watchedTitles.length > 0
      ? `\n\nDo NOT suggest any of these movies (already watched): ${watchedTitles.join(", ")}`
      : "";

  return askForMovies(
    `The user loves the movie "${movieTitle}". Suggest 3 movies that are similar in tone, genre, and style. These should be movies that someone who loved "${movieTitle}" would also enjoy.${excludeList}\n\nReturn exactly 3 movies.`,
    3
  );
}

export async function getRecommendationsAI(
  likedMovie1: string,
  likedMovie2: string,
  watchedTitles: string[]
): Promise<MovieSuggestion[]> {
  const excludeList =
    watchedTitles.length > 0
      ? `\n\nDo NOT suggest any of these movies (already watched): ${watchedTitles.join(", ")}`
      : "";

  return askForMovies(
    `The user loves these two movies: "${likedMovie1}" and "${likedMovie2}". Based on their taste across both movies, suggest 5 movies they would love for movie night. Consider the common themes, genres, mood, and style across both picks. Mix popular and lesser-known gems.${excludeList}\n\nDo NOT include "${likedMovie1}" or "${likedMovie2}" in your suggestions. Return exactly 5 movies.`,
    5
  );
}

export async function getReplacementMoviesAI(
  likedMovie1: string,
  likedMovie2: string,
  currentRecommendations: string[],
  watchedTitles: string[],
  count: number
): Promise<MovieSuggestion[]> {
  const allExclude = [...new Set([...watchedTitles, ...currentRecommendations, likedMovie1, likedMovie2])];

  return askForMovies(
    `The user loves "${likedMovie1}" and "${likedMovie2}". They need ${count} new movie recommendations to replace movies they've already watched. Suggest movies similar in taste.\n\nDo NOT suggest any of these movies: ${allExclude.join(", ")}\n\nReturn exactly ${count} movies.`,
    count
  );
}
