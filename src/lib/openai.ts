import OpenAI from "openai";
import { ratingRestrictionPrompt, type MaxRating } from "./ageRating";

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
        content: `You are a movie recommendation expert. You always respond in JSON format with a "movies" array containing objects with "title" (string) and "year" (number) fields. Only suggest real, well-known movies. Never repeat movies. Always return exactly ${count} movies. Strictly respect any content rating restrictions specified by the user.`,
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

// Over-fetch for restricted members since some may be filtered out
function bonusCount(maxRating: MaxRating | null): number {
  if (!maxRating || maxRating === "ALL" || maxRating === "R") return 0;
  if (maxRating === "PG-13") return 3;
  return 5; // G, PG - need extra since AI often suggests mature by default
}

export async function getSimilarMoviesAI(
  movieTitle: string,
  watchedTitles: string[],
  dislikedTitles: string[] = [],
  maxRating: MaxRating | null = null
): Promise<MovieSuggestion[]> {
  const excludeBlock = buildExcludeBlock(watchedTitles, dislikedTitles);
  const ratingBlock = ratingRestrictionPrompt(maxRating);
  const count = 3 + bonusCount(maxRating);

  return askForMovies(
    `The user loves the movie "${movieTitle}". Suggest ${count} movies that are similar in tone, genre, and style. These should be movies that someone who loved "${movieTitle}" would also enjoy.${excludeBlock}${ratingBlock}\n\nReturn exactly ${count} movies.`,
    count
  );
}

export async function getRecommendationsAI(
  likedMovie1: string,
  likedMovie2: string,
  watchedTitles: string[],
  dislikedTitles: string[] = [],
  maxRating: MaxRating | null = null,
  likedMovie3?: string | null
): Promise<MovieSuggestion[]> {
  const excludeBlock = buildExcludeBlock(watchedTitles, dislikedTitles);
  const ratingBlock = ratingRestrictionPrompt(maxRating);
  const count = 5 + bonusCount(maxRating);

  const movieList = likedMovie3
    ? `"${likedMovie1}", "${likedMovie2}", and "${likedMovie3}"`
    : `"${likedMovie1}" and "${likedMovie2}"`;
  const excludeList = [likedMovie1, likedMovie2, likedMovie3].filter(Boolean).map((t) => `"${t}"`).join(", ");

  return askForMovies(
    `The user loves these movies: ${movieList}. Based on their taste across all of them, suggest ${count} movies they would love for movie night. Consider the common themes, genres, mood, and style across all their picks. Mix popular and lesser-known gems.${excludeBlock}${ratingBlock}\n\nDo NOT include ${excludeList} in your suggestions. Return exactly ${count} movies.`,
    count
  );
}

export async function getCategoryRecommendationsAI(
  category: string,
  watchedTitles: string[],
  dislikedTitles: string[],
  maxRating: MaxRating | null = null
): Promise<MovieSuggestion[]> {
  const excludeBlock = buildExcludeBlock(watchedTitles, dislikedTitles);
  const ratingBlock = ratingRestrictionPrompt(maxRating);
  const count = 5 + bonusCount(maxRating);

  return askForMovies(
    `Suggest ${count} must-watch ${category} movies for a movie night. Include a mix of all-time classics and great recent films in the ${category} genre. Pick movies that best represent what makes ${category} great — the ones that fans of the genre absolutely need to see.${excludeBlock}${ratingBlock}\n\nReturn exactly ${count} movies.`,
    count
  );
}

export async function getReplacementMoviesAI(
  context: { likedMovie1?: string; likedMovie2?: string; category?: string },
  currentRecommendations: string[],
  watchedTitles: string[],
  dislikedTitles: string[],
  count: number,
  maxRating: MaxRating | null = null
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

  const ratingBlock = ratingRestrictionPrompt(maxRating);
  const fetchCount = count + bonusCount(maxRating);

  let tasteContext: string;
  if (context.category && context.category !== "general") {
    tasteContext = `The user wants ${context.category} movies for movie night. Suggest ${fetchCount} great ${context.category} movies they haven't seen.`;
  } else if (context.likedMovie1 && context.likedMovie2) {
    tasteContext = `The user loves "${context.likedMovie1}" and "${context.likedMovie2}". They need ${fetchCount} new movie recommendations to replace movies they've already watched or didn't like. Suggest movies similar in taste to their liked movies.`;
  } else {
    tasteContext = `Suggest ${fetchCount} great movies for movie night.`;
  }

  return askForMovies(
    `${tasteContext}${dislikeBlock}${ratingBlock}\n\nDo NOT suggest any of these movies: ${allExclude.join(", ")}\n\nReturn exactly ${fetchCount} movies.`,
    fetchCount
  );
}
