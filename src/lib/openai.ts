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

function buildExcludeBlock(watchedTitles: string[], dislikedTitles: string[]): string {
  let block = "";
  if (watchedTitles.length > 0) {
    block += `\n\nDo NOT suggest any of these movies (already watched): ${watchedTitles.join(", ")}`;
  }
  if (dislikedTitles.length > 0) {
    block += `\n\nThe user DISLIKED these movies, so do NOT suggest anything similar to them: ${dislikedTitles.join(", ")}. Avoid movies with a similar tone, style, or themes to the disliked ones.`;
  }
  return block;
}

export async function getSimilarMoviesAI(
  movieTitle: string,
  watchedTitles: string[],
  dislikedTitles: string[] = []
): Promise<MovieSuggestion[]> {
  const excludeBlock = buildExcludeBlock(watchedTitles, dislikedTitles);

  return askForMovies(
    `The user loves the movie "${movieTitle}". Suggest 3 movies that are similar in tone, genre, and style. These should be movies that someone who loved "${movieTitle}" would also enjoy.${excludeBlock}\n\nReturn exactly 3 movies.`,
    3
  );
}

export async function getRecommendationsAI(
  likedMovie1: string,
  likedMovie2: string,
  watchedTitles: string[],
  dislikedTitles: string[] = []
): Promise<MovieSuggestion[]> {
  const excludeBlock = buildExcludeBlock(watchedTitles, dislikedTitles);

  return askForMovies(
    `The user loves these two movies: "${likedMovie1}" and "${likedMovie2}". Based on their taste across both movies, suggest 5 movies they would love for movie night. Consider the common themes, genres, mood, and style across both picks. Mix popular and lesser-known gems.${excludeBlock}\n\nDo NOT include "${likedMovie1}" or "${likedMovie2}" in your suggestions. Return exactly 5 movies.`,
    5
  );
}

export async function getCategoryRecommendationsAI(
  category: string,
  watchedTitles: string[],
  dislikedTitles: string[]
): Promise<MovieSuggestion[]> {
  const excludeBlock = buildExcludeBlock(watchedTitles, dislikedTitles);

  return askForMovies(
    `Suggest 5 must-watch ${category} movies for a movie night. Include a mix of all-time classics and great recent films in the ${category} genre. Pick movies that best represent what makes ${category} great — the ones that fans of the genre absolutely need to see.${excludeBlock}\n\nReturn exactly 5 movies.`,
    5
  );
}

export async function getReplacementMoviesAI(
  context: { likedMovie1?: string; likedMovie2?: string; category?: string },
  currentRecommendations: string[],
  watchedTitles: string[],
  dislikedTitles: string[],
  count: number
): Promise<MovieSuggestion[]> {
  const allExclude = [...new Set([
    ...watchedTitles,
    ...currentRecommendations,
    ...(context.likedMovie1 ? [context.likedMovie1] : []),
    ...(context.likedMovie2 ? [context.likedMovie2] : []),
  ])];

  let dislikeBlock = "";
  if (dislikedTitles.length > 0) {
    dislikeBlock = `\n\nThe user DISLIKED these movies, so avoid anything similar in tone, style, or themes: ${dislikedTitles.join(", ")}`;
  }

  let tasteContext: string;
  if (context.category && context.category !== "general") {
    tasteContext = `The user wants ${context.category} movies for movie night. Suggest ${count} great ${context.category} movies they haven't seen.`;
  } else if (context.likedMovie1 && context.likedMovie2) {
    tasteContext = `The user loves "${context.likedMovie1}" and "${context.likedMovie2}". They need ${count} new movie recommendations to replace movies they've already watched or didn't like. Suggest movies similar in taste to their liked movies.`;
  } else {
    tasteContext = `Suggest ${count} great movies for movie night.`;
  }

  return askForMovies(
    `${tasteContext}${dislikeBlock}\n\nDo NOT suggest any of these movies: ${allExclude.join(", ")}\n\nReturn exactly ${count} movies.`,
    count
  );
}
