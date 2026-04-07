import { drizzle } from 'drizzle-orm/libsql';
import { createClient } from '@libsql/client';
import * as schema from './schema';
import * as path from 'path';
import * as fs from 'fs';

// For Dokploy/Production, DB_PATH should be outside the root to be persistent in a volume
const dbDir = path.join(process.cwd(), 'data');
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}
const dbPath = process.env.DB_PATH || path.join(dbDir, 'sqlite.db');

const client = createClient({ url: `file:${dbPath}` });
export const db = drizzle(client, { schema });

// Auto-migrate (simple way for this prototype)
(async () => {
  try {
    await client.execute(`
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
      await client.execute('ALTER TABLE contact_requests ADD COLUMN is_read INTEGER DEFAULT 0');
    } catch (e) {
      // Column might already exist, ignore error
    }
  } catch (err) {
    console.error("DB Init Error:", err);
  }
})();
