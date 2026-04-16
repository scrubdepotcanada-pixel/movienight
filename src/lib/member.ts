import db from "./db";

export async function getMemberAge(memberId: string | number): Promise<number | null> {
  const rows = await db.execute({
    sql: "SELECT age FROM members WHERE id = ?",
    args: [memberId],
  });
  if (rows.rows.length === 0) return null;
  const age = rows.rows[0].age;
  return typeof age === "number" ? age : age ? Number(age) : null;
}
