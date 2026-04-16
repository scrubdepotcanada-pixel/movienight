// MPAA ratings in order from most restrictive to least
const RATING_ORDER = ["G", "PG", "PG-13", "R", "NC-17"] as const;
export type MaxRating = typeof RATING_ORDER[number] | "ALL";

/**
 * Default max rating based on age when none is explicitly set.
 * Parents can always override this when creating/editing a member.
 */
export function defaultMaxRatingForAge(age: number | null | undefined): MaxRating {
  if (age == null) return "ALL";
  if (age < 7) return "G";
  if (age < 10) return "PG";
  if (age < 14) return "PG-13";
  if (age < 17) return "R";
  return "ALL";
}

/**
 * Which certifications are allowed for this max rating?
 */
export function allowedCertifications(maxRating: MaxRating | null | undefined): string[] {
  if (!maxRating || maxRating === "ALL") {
    return ["G", "PG", "PG-13", "R", "NC-17", "NR"];
  }
  const maxIdx = RATING_ORDER.indexOf(maxRating);
  if (maxIdx === -1) return ["G", "PG", "PG-13", "R", "NC-17", "NR"];
  return RATING_ORDER.slice(0, maxIdx + 1) as string[];
}

/**
 * Human-readable description for OpenAI prompts.
 */
export function ratingRestrictionPrompt(maxRating: MaxRating | null | undefined): string {
  if (!maxRating || maxRating === "ALL") return "";

  const allowed = allowedCertifications(maxRating);
  const ratingsStr = allowed.filter((r) => r !== "NR").join(", ");
  const excluded = RATING_ORDER.filter((r) => !allowed.includes(r)).join(", ");

  const excludedBlock = excluded.length > 0
    ? ` DO NOT suggest anything rated ${excluded}.`
    : "";

  const guidance =
    maxRating === "G" ? "Only wholesome, family-friendly films. No violence, scary content, or mature themes." :
    maxRating === "PG" ? "No violent, scary, or mature content. Mild themes only." :
    maxRating === "PG-13" ? "No explicit violence, sex, drugs, or strong language." :
    maxRating === "R" ? "No NC-17 / explicit adult content." :
    "";

  return `\n\nIMPORTANT CONTENT RATING LIMIT: Only suggest movies rated ${ratingsStr}.${excludedBlock} ${guidance}`.trim();
}

/**
 * Is a movie's certification allowed for this max rating?
 */
export function isMovieAllowed(certification: string | undefined, maxRating: MaxRating | null | undefined): boolean {
  if (!maxRating || maxRating === "ALL") return true;
  const allowed = allowedCertifications(maxRating);
  const cert = certification || "NR";
  // Block unrated content for anyone with a restriction
  if (cert === "NR") return false;
  return allowed.includes(cert);
}
