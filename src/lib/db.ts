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
      google_id TEXT UNIQUE,
      email TEXT,
      name TEXT,
      avatar TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    )`,
    `CREATE TABLE IF NOT EXISTS members (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      family_id TEXT NOT NULL,
      name TEXT NOT NULL,
      avatar TEXT DEFAULT '🎬',
      age INTEGER,
      max_rating TEXT,
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
      release_date TEXT,
      base_movie_id INTEGER,
      category TEXT DEFAULT 'general',
      is_active INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (member_id) REFERENCES members(id)
    )`,
    `CREATE TABLE IF NOT EXISTS liked_movies (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      member_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      category TEXT DEFAULT 'general',
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (member_id) REFERENCES members(id)
    )`,
    `CREATE TABLE IF NOT EXISTS disliked_movies (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      member_id INTEGER NOT NULL,
      tmdb_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      category TEXT DEFAULT 'general',
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (member_id) REFERENCES members(id),
      UNIQUE(member_id, tmdb_id)
    )`,
    `CREATE TABLE IF NOT EXISTS swipe_sessions (
      id TEXT PRIMARY KEY,
      family_id TEXT NOT NULL,
      category TEXT DEFAULT 'general',
      content_type TEXT DEFAULT 'movie',
      status TEXT DEFAULT 'active',
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (family_id) REFERENCES families(id)
    )`,
    `CREATE TABLE IF NOT EXISTS swipe_candidates (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      session_id TEXT NOT NULL,
      tmdb_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      poster_path TEXT,
      vote_average REAL,
      certification TEXT,
      overview TEXT,
      release_date TEXT,
      FOREIGN KEY (session_id) REFERENCES swipe_sessions(id)
    )`,
    `CREATE TABLE IF NOT EXISTS swipe_votes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      session_id TEXT NOT NULL,
      member_id INTEGER NOT NULL,
      tmdb_id INTEGER NOT NULL,
      vote TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (session_id) REFERENCES swipe_sessions(id),
      FOREIGN KEY (member_id) REFERENCES members(id),
      UNIQUE(session_id, member_id, tmdb_id)
    )`,
    `CREATE TABLE IF NOT EXISTS watchlist (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      member_id INTEGER NOT NULL,
      tmdb_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      poster_path TEXT,
      vote_average REAL,
      certification TEXT,
      overview TEXT,
      release_date TEXT,
      content_type TEXT DEFAULT 'movie',
      added_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (member_id) REFERENCES members(id),
      UNIQUE(member_id, tmdb_id)
    )`,
    `CREATE TABLE IF NOT EXISTS payments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      family_id TEXT NOT NULL,
      plan TEXT NOT NULL,
      amount REAL NOT NULL,
      currency TEXT DEFAULT 'usd',
      status TEXT DEFAULT 'active',
      stripe_payment_id TEXT,
      paid_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (family_id) REFERENCES families(id)
    )`,
  ]);

  // Migrations: add new columns to existing tables if missing
  const migrations = [
    "ALTER TABLE recommendations ADD COLUMN category TEXT DEFAULT 'general'",
    "ALTER TABLE liked_movies ADD COLUMN category TEXT DEFAULT 'general'",
    "ALTER TABLE disliked_movies ADD COLUMN category TEXT DEFAULT 'general'",
    "ALTER TABLE members ADD COLUMN age INTEGER",
    "ALTER TABLE members ADD COLUMN max_rating TEXT",
    "ALTER TABLE families ADD COLUMN google_id TEXT",
    "ALTER TABLE families ADD COLUMN email TEXT",
    "ALTER TABLE families ADD COLUMN name TEXT",
    "ALTER TABLE families ADD COLUMN avatar TEXT",
    "ALTER TABLE recommendations ADD COLUMN release_date TEXT",
    "ALTER TABLE recommendations ADD COLUMN content_type TEXT DEFAULT 'movie'",
    "ALTER TABLE watched_movies ADD COLUMN content_type TEXT DEFAULT 'movie'",
    "ALTER TABLE families ADD COLUMN premium_until TEXT",
    "ALTER TABLE families ADD COLUMN subscription_plan TEXT",
    "ALTER TABLE families ADD COLUMN ip_address TEXT",
    "ALTER TABLE families ADD COLUMN stripe_customer_id TEXT",
  ];
  for (const sql of migrations) {
    try {
      await db.execute(sql);
    } catch {
      // Column already exists — ignore
    }
  }
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
