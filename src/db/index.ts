import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import * as schema from './schema';
import path from 'path';

// For Dokploy/Production, DB_PATH should be outside the root to be persistent in a volume
const dbPath = process.env.DB_PATH || path.join(process.cwd(), 'data', 'sqlite.db');

const sqlite = new Database(dbPath);
export const db = drizzle(sqlite, { schema });

// Auto-migrate (simple way for this prototype)
sqlite.exec(`
  CREATE TABLE IF NOT EXISTS contact_requests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    subject TEXT NOT NULL,
    message TEXT NOT NULL,
    is_read INTEGER DEFAULT 0,
    created_at INTEGER
  )
`);

try {
  sqlite.exec('ALTER TABLE contact_requests ADD COLUMN is_read INTEGER DEFAULT 0');
} catch (e) {
  // Column might already exist, ignore error
}
