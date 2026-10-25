import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFile } from 'node:fs/promises';
import worker from '../src/index.ts';
import { localD1 } from './helpers/local-d1.ts';

const origin = 'https://portfolio.example';

// Early rejections drain small unread bodies so the local Vite -> workerd keep-alive
// connection is reusable (cancel/no-read produced ~0.5% "fetch failed" 500s; drain 0/1000).
const rejections: Array<[number, string, Record<string, string>]> = [
  [405, 'PUT', { origin, 'content-type': 'application/json' }],
  [403, 'POST', { origin: 'https://evil.example', 'content-type': 'application/json' }],
  [415, 'POST', { origin, 'content-type': 'text/plain' }],
];
test('early 405/403/415 rejections fully drain small request bodies without cancelling', async () => {
  for (const [status, method, headers] of rejections) {
    let chunks = 3, closed = false, cancelled = false;
    const body = new ReadableStream<Uint8Array>({
      pull(controller) {
        if (chunks-- > 0) controller.enqueue(new TextEncoder().encode('{"name":"x"}'));
        else { controller.close(); closed = true; }
      },
      cancel() { cancelled = true; },
    });
    const request = new Request(origin + '/api/contact', { method, headers, body, duplex: 'half' } as RequestInit);
    const response = await worker.fetch(request, { DB: undefined as unknown as D1Database });
    assert.equal(response.status, status);
    assert.equal(closed, true, `body not drained on ${status}`);
    assert.equal(cancelled, false, `small body cancelled on ${status}`);
  }
});

test('early rejections stop draining and cancel bodies larger than 16 KiB', async () => {
  for (const [status, method, headers] of rejections) {
    let pulled = 0, cancelled = false;
    const body = new ReadableStream<Uint8Array>({
      pull(controller) { pulled += 1024; controller.enqueue(new Uint8Array(1024)); },
      cancel() { cancelled = true; },
    });
    const request = new Request(origin + '/api/contact', { method, headers, body, duplex: 'half' } as RequestInit);
    const response = await worker.fetch(request, { DB: undefined as unknown as D1Database });
    assert.equal(response.status, status);
    assert.equal(cancelled, true, `oversized body not cancelled on ${status}`);
    assert.ok(pulled <= 16 * 1024 + 2048, `read ${pulled} bytes past the cap on ${status}`);
  }
});

test('health reports 503 when the D1 schema is missing and 200 when migrated', async () => {
  const local = await localD1();
  try {
    assert.equal((await worker.fetch(new Request(origin + '/api/health'), { DB: local.db })).status, 200);
    await local.db.prepare('DROP TABLE contact_funnel_events').run();
    const missing = await worker.fetch(new Request(origin + '/api/health'), { DB: local.db });
    assert.equal(missing.status, 503);
    assert.deepEqual(await missing.json(), { ok: false });
  } finally { await local.dispose(); }
});

test('every cf launcher disables CLI and Vite telemetry', async () => {
  const manifest = JSON.parse(await readFile(new URL('../package.json', import.meta.url), 'utf8'));
  for (const name of ['build', 'dev', 'test:foundation']) {
    assert.match(manifest.scripts[name], /CF_SEND_TELEMETRY=false DO_NOT_TRACK=1/, name);
  }
  for (const file of ['dev-stack.mjs', 'test-stack.mjs']) {
    const source = await readFile(new URL(`../../scripts/${file}`, import.meta.url), 'utf8');
    assert.match(source, /CF_SEND_TELEMETRY: 'false', DO_NOT_TRACK: '1'/, file);
  }
});
