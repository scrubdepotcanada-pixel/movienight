import { createClient, type Client } from "@libsql/client";

let _db: Client | null = null;

export function getDB(): Client {
  if (!_db) {
    _db = createClient({
      url: process.env.TURSO_DATABASE_URL!,
      authToken: process.env.TURSO_AUTH_TOKEN!,
    });
  }
  return _db;
}

export async function initDB() {
  const db = getDB();
  await db.batch([
    `CREATE TABLE IF NOT EXISTS families (
      id TEXT PRIMARY KEY,
      created_at TEXT DEFAULT (datetime('now'))
    )`,
    `CREATE TABLE IF NOT EXISTS members (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      family_id TEXT NOT NULL,
      name TEXT NOT NULL,
      avatar TEXT DEFAULT '🎬',
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (family_id) REFERENCES families(id)
    )`,
    `CREATE TABLE IF NOT EXISTS watched_movies (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      member_id INTEGER NOT NULL,
      tmdb_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      poster_path TEXT,
      vote_average REAL,
      certification TEXT,
      watched_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (member_id) REFERENCES members(id),
      UNIQUE(member_id, tmdb_id)
    )`,
    `CREATE TABLE IF NOT EXISTS recommendations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      member_id INTEGER NOT NULL,
      tmdb_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      poster_path TEXT,
      vote_average REAL,
      certification TEXT,
      overview TEXT,
      base_movie_id INTEGER,
      is_active INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (member_id) REFERENCES members(id)
    )`,
  ]);
}

const db = new Proxy({} as Client, {
  get(_target, prop) {
    const realDb = getDB();
    const value = (realDb as unknown as Record<string | symbol, unknown>)[prop];
    if (typeof value === "function") {
      return (value as Function).bind(realDb);
    }
    return value;
  },
});

export default db;
