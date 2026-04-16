/**
 * Maps a member's age to a list of acceptable MPAA certifications.
 * Stricter for younger viewers.
 */
export function allowedCertifications(age: number | null | undefined): string[] {
  if (age == null) return ["G", "PG", "PG-13", "R", "NC-17", "NR"]; // no filter
  if (age < 7) return ["G"];
  if (age < 13) return ["G", "PG"];
  if (age < 17) return ["G", "PG", "PG-13"];
  return ["G", "PG", "PG-13", "R", "NC-17", "NR"];
}

/**
 * Human-readable description of what the age allows, used in OpenAI prompts.
 */
export function ageRestrictionPrompt(age: number | null | undefined): string {
  if (age == null) return "";
  if (age < 7) {
    return `\n\nIMPORTANT: The viewer is ${age} years old. ONLY suggest G-rated movies suitable for young children. Absolutely NO PG, PG-13, R, or NC-17 content. Only wholesome, family-friendly films.`;
  }
  if (age < 13) {
    return `\n\nIMPORTANT: The viewer is ${age} years old. ONLY suggest movies rated G or PG. DO NOT suggest anything rated PG-13, R, or NC-17. No violent, scary, or mature content.`;
  }
  if (age < 17) {
    return `\n\nIMPORTANT: The viewer is ${age} years old. ONLY suggest movies rated G, PG, or PG-13. DO NOT suggest anything rated R or NC-17. No explicit violence, sex, drugs, or strong language.`;
  }
  return "";
}

/**
 * Is a movie's certification allowed for this age?
 */
export function isMovieAllowed(certification: string | undefined, age: number | null | undefined): boolean {
  const allowed = allowedCertifications(age);
  const cert = certification || "NR";
  // For strict ages (under 17), exclude NR as we can't verify it
  if (age != null && age < 17 && cert === "NR") return false;
  return allowed.includes(cert);
}
