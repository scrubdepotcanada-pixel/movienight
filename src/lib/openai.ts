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
  likedMovie2: string | null,
  watchedTitles: string[],
  dislikedTitles: string[] = [],
  maxRating: MaxRating | null = null,
  likedMovie3?: string | null
): Promise<MovieSuggestion[]> {
  const excludeBlock = buildExcludeBlock(watchedTitles, dislikedTitles);
  const ratingBlock = ratingRestrictionPrompt(maxRating);
  const count = 8 + bonusCount(maxRating);

  const allLiked = [likedMovie1, likedMovie2, likedMovie3].filter(Boolean) as string[];
  const movieList = allLiked.map((t) => `"${t}"`).join(", ");
  const excludeList = movieList;

  const prompt = allLiked.length === 1
    ? `The user loves the movie "${allLiked[0]}". Suggest ${count} movies they would love for movie night. Consider similar themes, genres, mood, and style. Mix popular and lesser-known gems.${excludeBlock}${ratingBlock}\n\nDo NOT include "${allLiked[0]}" in your suggestions. Return exactly ${count} movies.`
    : `The user loves these movies: ${movieList}. Based on their taste across all of them, suggest ${count} movies they would love for movie night. Consider the common themes, genres, mood, and style across all their picks. Mix popular and lesser-known gems.${excludeBlock}${ratingBlock}\n\nDo NOT include ${excludeList} in your suggestions. Return exactly ${count} movies.`;

  return askForMovies(prompt, count);
}

export async function getCategoryRecommendationsAI(
  category: string,
  watchedTitles: string[],
  dislikedTitles: string[],
  maxRating: MaxRating | null = null
): Promise<MovieSuggestion[]> {
  const excludeBlock = buildExcludeBlock(watchedTitles, dislikedTitles);
  const ratingBlock = ratingRestrictionPrompt(maxRating);
  const count = 8 + bonusCount(maxRating);

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
  } else if (context.likedMovie1) {
    tasteContext = `The user loves "${context.likedMovie1}". They need ${fetchCount} new movie recommendations. Suggest movies similar in tone, genre, and style.`;
  } else {
    tasteContext = `Suggest ${fetchCount} great movies for movie night.`;
  }

  return askForMovies(
    `${tasteContext}${dislikeBlock}${ratingBlock}\n\nDo NOT suggest any of these movies: ${allExclude.join(", ")}\n\nReturn exactly ${fetchCount} movies.`,
    fetchCount
  );
}

// ── Family Swipe ────────────────────────────────────────────────

export async function getFamilySwipeMoviesAI(
  category: string | null,
  contentType: "movie" | "show",
  watchedTitles: string[],
  maxRating: MaxRating | null
): Promise<MovieSuggestion[]> {
  const ratingBlock = ratingRestrictionPrompt(maxRating);
  const count = 15 + bonusCount(maxRating);
  const type = contentType === "show" ? "TV shows" : "movies";

  let categoryBlock = "";
  if (category && category !== "general") {
    categoryBlock = ` Focus on the ${category} genre.`;
  }

  let excludeBlock = "";
  if (watchedTitles.length > 0) {
    excludeBlock = `\n\nDo NOT suggest any of these (already watched): ${watchedTitles.join(", ")}`;
  }

  const prompt = `Suggest ${count} widely-appealing ${type} that a family with mixed tastes would enjoy. Include a variety of genres and styles so there's something for everyone. These should be crowd-pleasers that appeal across different age groups and preferences.${categoryBlock}${excludeBlock}${ratingBlock}\n\nReturn exactly ${count} ${contentType === "show" ? "shows" : "movies"}.`;

  if (contentType === "show") {
    return askForShows(prompt, count);
  }
  return askForMovies(prompt, count);
}

// ── Mood-Based Search ───────────────────────────────────────────

export async function getMoodRecommendationsAI(
  mood: string,
  contentType: "movie" | "show",
  watchedTitles: string[],
  dislikedTitles: string[],
  maxRating: MaxRating | null = null
): Promise<MovieSuggestion[]> {
  const excludeBlock = buildExcludeBlock(watchedTitles, dislikedTitles);
  const ratingBlock = ratingRestrictionPrompt(maxRating);
  const count = 8 + bonusCount(maxRating);
  const type = contentType === "show" ? "TV shows (series)" : "movies";
  const typeNote = contentType === "show" ? "Only suggest TV series, NOT movies." : "Only suggest movies, NOT TV shows.";

  const prompt = `The user is in this mood and wants ${type}: "${mood}"

Suggest ${count} ${type} that perfectly match this vibe/mood/description. Be creative — think about tone, themes, setting, and emotional feel. ${typeNote}${excludeBlock}${ratingBlock}

Return exactly ${count} ${contentType === "show" ? "shows" : "movies"}.`;

  if (contentType === "show") {
    return askForShows(prompt, count);
  }
  return askForMovies(prompt, count);
}

// ── TV Show Support ──────────────────────────────────────────────

interface ShowSuggestion {
  title: string;
  year: number;
}

async function askForShows(prompt: string, count: number): Promise<ShowSuggestion[]> {
  const response = await getOpenAI().chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0.9,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content: `You are a TV show recommendation expert. You always respond in JSON format with a "movies" array containing objects with "title" (string) and "year" (number) fields. Only suggest real, well-known TV shows (NOT movies). The "year" should be the year the show first aired. Never repeat shows. Always return exactly ${count} TV shows. Strictly respect any content rating restrictions specified by the user.`,
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

function buildShowExcludeBlock(watchedTitles: string[], dislikedTitles: string[]): string {
  let block = "";
  if (watchedTitles.length > 0) {
    block += `\n\nDo NOT suggest any of these TV shows (already watched): ${watchedTitles.join(", ")}`;
  }
  if (dislikedTitles.length > 0) {
    block += `\n\nThe user DISLIKED these TV shows, so do NOT suggest anything similar to them: ${dislikedTitles.join(", ")}. Avoid TV series with a similar tone, style, or themes to the disliked ones.`;
  }
  return block;
}

export async function getCategoryShowsAI(
  category: string,
  watchedTitles: string[],
  dislikedTitles: string[],
  maxRating: MaxRating | null = null
): Promise<ShowSuggestion[]> {
  const excludeBlock = buildShowExcludeBlock(watchedTitles, dislikedTitles);
  const ratingBlock = ratingRestrictionPrompt(maxRating);
  const count = 8 + bonusCount(maxRating);

  return askForShows(
    `Suggest ${count} must-watch ${category} TV shows (television series only, NOT movies) for a TV binge night. Include a mix of all-time classic TV series and great recent shows in the ${category} genre. Pick TV shows that best represent what makes ${category} great — the ones that fans of the genre absolutely need to see.${excludeBlock}${ratingBlock}\n\nReturn exactly ${count} TV shows. Remember: only TV series, never movies.`,
    count
  );
}

export async function getShowRecommendationsAI(
  likedShow: string,
  watchedTitles: string[],
  dislikedTitles: string[] = [],
  maxRating: MaxRating | null = null
): Promise<ShowSuggestion[]> {
  const excludeBlock = buildShowExcludeBlock(watchedTitles, dislikedTitles);
  const ratingBlock = ratingRestrictionPrompt(maxRating);
  const count = 3 + bonusCount(maxRating);

  return askForShows(
    `The user loves the TV show "${likedShow}". Suggest ${count} TV shows (television series only, NOT movies) that are similar in tone, genre, and style. These should be TV series that someone who loved "${likedShow}" would also enjoy.${excludeBlock}${ratingBlock}\n\nReturn exactly ${count} TV shows. Remember: only TV series, never movies.`,
    count
  );
}

export async function getReplacementShowsAI(
  context: { likedShow1?: string; likedShow2?: string; category?: string },
  currentRecommendations: string[],
  watchedTitles: string[],
  dislikedTitles: string[],
  count: number,
  maxRating: MaxRating | null = null
): Promise<ShowSuggestion[]> {
  const allExclude = [...new Set([
    ...watchedTitles,
    ...currentRecommendations,
    ...(context.likedShow1 ? [context.likedShow1] : []),
    ...(context.likedShow2 ? [context.likedShow2] : []),
  ])];

  let dislikeBlock = "";
  if (dislikedTitles.length > 0) {
    dislikeBlock = `\n\nThe user DISLIKED these TV shows, so avoid anything similar in tone, style, or themes: ${dislikedTitles.join(", ")}`;
  }

  const ratingBlock = ratingRestrictionPrompt(maxRating);
  const fetchCount = count + bonusCount(maxRating);

  let tasteContext: string;
  if (context.category && context.category !== "general") {
    tasteContext = `The user wants ${context.category} TV shows (television series only, NOT movies) for a binge night. Suggest ${fetchCount} great ${context.category} TV series they haven't seen.`;
  } else if (context.likedShow1 && context.likedShow2) {
    tasteContext = `The user loves these TV shows: "${context.likedShow1}" and "${context.likedShow2}". They need ${fetchCount} new TV show recommendations (television series only, NOT movies) to replace shows they've already watched or didn't like. Suggest TV series similar in taste to their liked shows.`;
  } else if (context.likedShow1) {
    tasteContext = `The user loves the TV show "${context.likedShow1}". They need ${fetchCount} new TV show recommendations (television series only, NOT movies). Suggest TV series similar in tone, genre, and style.`;
  } else {
    tasteContext = `Suggest ${fetchCount} great TV shows (television series only, NOT movies) for a binge night.`;
  }

  return askForShows(
    `${tasteContext}${dislikeBlock}${ratingBlock}\n\nDo NOT suggest any of these TV shows: ${allExclude.join(", ")}\n\nReturn exactly ${fetchCount} TV shows. Remember: only TV series, never movies.`,
    fetchCount
  );
}
