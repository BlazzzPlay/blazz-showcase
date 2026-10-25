import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFile } from 'node:fs/promises';
import worker from '../src/index.ts';
import { localD1 } from './helpers/local-d1.ts';

const origin = 'https://portfolio.example';

// Early rejections must release the upload so a keep-alive bridge never reuses a half-read socket.
test('early 405/403/415 rejections cancel the unread request body', async () => {
  const cases: Array<[number, string, Record<string, string>]> = [
    [405, 'PUT', { origin, 'content-type': 'application/json' }],
    [403, 'POST', { origin: 'https://evil.example', 'content-type': 'application/json' }],
    [415, 'POST', { origin, 'content-type': 'text/plain' }],
  ];
  for (const [status, method, headers] of cases) {
    let cancelled = false;
    const body = new ReadableStream<Uint8Array>({
      pull(controller) { controller.enqueue(new TextEncoder().encode('{"name":"x"}')); },
      cancel() { cancelled = true; },
    });
    const request = new Request(origin + '/api/contact', { method, headers, body, duplex: 'half' } as RequestInit);
    const response = await worker.fetch(request, { DB: undefined as unknown as D1Database });
    assert.equal(response.status, status);
    assert.equal(cancelled, true, `body not cancelled on ${status}`);
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
