import { mkdir, mkdtemp, readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { Miniflare } from 'miniflare';

export async function localD1(migrate = true, parent = resolve(import.meta.dirname, '../../.cloudflare')) {
  await mkdir(parent, { recursive: true });
  const state = await mkdtemp(resolve(parent, 'public-api-'));
  return openLocalD1(state, migrate);
}

// Test harness only: the operator workflow remains cf, never remote SQL fallback.
// Vite persistState and cf --persist-to both map this root to its v3 child.
export async function openLocalD1(state: string, migrate = false) {
  const runtime = new Miniflare({
    workers: [{ config: {
      name: 'public-api-test', compatibilityDate: '2026-10-11',
      env: { DB: { type: 'd1', id: '43a7fa88-38f6-43d0-99ea-df68bab1896e' } },
      manifest: { mainModule: 'index.js', modules: { 'index.js': {
        type: 'esm', contents: 'export default { fetch() { return new Response("local test"); } };',
      } } },
    } }],
    resourcePersistencePath: resolve(state, 'v3'),
  });
  try {
    const db = await runtime.getD1Database('DB');
    if (migrate) {
      const sql = await readFile(resolve(import.meta.dirname, '../../migrations/0001_initial.sql'), 'utf8');
      for (const statement of sql.split(';').filter(part => part.trim())) {
        await db.prepare(statement).run();
      }
    }
    return { db, state, dispose: () => runtime.dispose() };
  } catch (error) {
    await runtime.dispose();
    throw error;
  }
}
