import db from "./db";
import { defaultMaxRatingForAge, type MaxRating } from "./ageRating";

export async function getMemberRestrictions(memberId: string | number): Promise<{
  age: number | null;
  maxRating: MaxRating | null;
}> {
  const rows = await db.execute({
    sql: "SELECT age, max_rating FROM members WHERE id = ?",
    args: [memberId],
  });
  if (rows.rows.length === 0) return { age: null, maxRating: null };

  const row = rows.rows[0];
  const age = typeof row.age === "number" ? row.age : row.age ? Number(row.age) : null;
  const explicitMax = row.max_rating ? String(row.max_rating) as MaxRating : null;
  // If no explicit max_rating but age is set, fall back to age default
  const maxRating = explicitMax || (age != null ? defaultMaxRatingForAge(age) : null);

  return { age, maxRating };
}
