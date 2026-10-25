import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFile } from 'node:fs/promises';
import worker from '../src/index.ts';
import { localD1 } from './helpers/local-d1.ts';

const origin = 'https://portfolio.example';
const contact = { name: '  Ada Lovelace ', email: ' ada@example.com ', subject: ' Project ', message: ' A useful project idea. ' };
function request(path: string, body: unknown = contact, headers: Record<string, string> = {}) {
  return new Request(origin + path, { method: 'POST', headers: {
    origin, 'content-type': 'application/json', ...headers,
  }, body: JSON.stringify(body) });
}

test('public contact and independent funnel persist through real local D1', async () => {
  const local = await localD1();
  try {
    const env = { DB: local.db };
    const response = await worker.fetch(request('/api/contact'), env);
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), { success: true, message: 'Solicitud registrada con éxito. ¡Hablamos pronto!' });
    const row = await local.db.prepare('SELECT * FROM contact_requests').first();
    assert.ok(row);
    assert.equal(row.name, 'Ada Lovelace');
    assert.equal(row.email, 'ada@example.com');
    assert.equal(row.is_read, 0);
    assert.equal(row.id, 1);
    assert.ok(Math.abs(Number(row.created_at) - Date.now() / 1000) < 10);
    assert.equal(await local.db.prepare('SELECT COUNT(*) FROM contact_funnel_events').first('COUNT(*)'), 0);
    const funnel = await worker.fetch(request('/api/funnel', { sessionId: 'session-123', event: 'form_submit_success' }), env);
    assert.equal(funnel.status, 200);
    assert.deepEqual(await funnel.json(), { success: true });
    assert.equal(await local.db.prepare('SELECT source FROM contact_funnel_events').first('source'), 'contact_form');
    for (const event of ['cta_click', 'form_start', 'form_submit_success']) {
      for (const source of ['hero', 'nav', 'contact_form']) {
        assert.equal((await worker.fetch(request('/api/funnel', { sessionId: 'session-123', event, source }), env)).status, 200);
      }
    }
    const literal = "Robert'); DROP TABLE contact_requests; --";
    assert.equal((await worker.fetch(request('/api/contact', { ...contact, name: literal }), env)).status, 200);
    assert.equal(await local.db.prepare('SELECT name FROM contact_requests WHERE id=2').first('name'), literal);
    console.log(`Actual LOCAL D1 persistence verified at ${local.state}: contact id=1, unread, epoch seconds; independent funnel row`);
  } finally { await local.dispose(); }
});

test('validation, privilege boundaries and unsafe requests fail closed', async () => {
  const config = await readFile(new URL('../cloudflare.config.ts', import.meta.url), 'utf8');
  assert.match(config, /runWorkerFirst:[^\n]*'\/private'/);
  assert.match(config, /runWorkerFirst:[^\n]*'\/private\/\*'/);
  const local = await localD1();
  try {
    const env = { DB: local.db };
    for (const extra of [{ id: 12 }, { isRead: true }, { is_read: 1 }, { sql: 'DELETE FROM contact_requests' }]) {
      assert.equal((await worker.fetch(request('/api/contact', { ...contact, ...extra }), env)).status, 400);
    }
    const invalid = await worker.fetch(request('/api/contact', { name: ' ', email: 'invalid', subject: 'x', message: 'short' }), env);
    assert.equal(invalid.status, 400);
    const errors = await invalid.json() as { fieldErrors: Record<string, string[]> };
    assert.deepEqual(Object.keys(errors.fieldErrors).sort(), ['email', 'message', 'name', 'subject']);
    for (const body of [null, [], {}, { ...contact, name: 42 }, { ...contact, message: 'x'.repeat(4001) }]) {
      assert.equal((await worker.fetch(request('/api/contact', body), env)).status, 400);
    }
    for (const body of [
      { sessionId: 'short', event: 'cta_click' },
      { sessionId: 'session-123', event: 'delete' },
      { sessionId: 'session-123', event: 'cta_click', source: 'admin' },
      { sessionId: 'session-123', event: 'cta_click', id: 1 },
    ]) assert.equal((await worker.fetch(request('/api/funnel', body), env)).status, 400);
    for (const value of ['https://evil.example', 'null', 'https://portfolio.example.evil']) {
      const denied = await worker.fetch(request('/api/contact', contact, { origin: value }), env);
      assert.equal(denied.status, 403);
      assert.equal(denied.headers.get('access-control-allow-origin'), null);
    }
    const noOrigin = request('/api/contact'); noOrigin.headers.delete('origin');
    assert.equal((await worker.fetch(noOrigin, env)).status, 403);
    assert.equal((await worker.fetch(request('/api/contact', contact, { 'content-type': 'text/plain' }), env)).status, 415);
    assert.equal((await worker.fetch(new Request(origin + '/api/contact', { method: 'POST', headers: { origin, 'content-type': 'application/json' }, body: '{' }), env)).status, 400);
    assert.equal((await worker.fetch(request('/api/contact', { ...contact, message: 'x'.repeat(17000) }), env)).status, 413);
    // Multibyte streamed input with no Content-Length must be bounded by bytes.
    const stream = new ReadableStream({ start(controller) {
      for (let n = 0; n < 6; n++) controller.enqueue(new TextEncoder().encode('😊'.repeat(1000)));
      controller.close();
    } });
    const streamed = new Request(origin + '/api/contact', { method: 'POST',
      headers: { origin, 'content-type': 'application/json' }, body: stream, duplex: 'half',
    } as RequestInit);
    assert.equal((await worker.fetch(streamed, env)).status, 413);
    for (const path of ['/admin', '/admin/users', '/private', '/private/', '/private/documents', '/api/admin', '/api/unknown']) {
      for (const method of ['GET', 'POST', 'DELETE', 'OPTIONS']) {
        assert.equal((await worker.fetch(new Request(origin + path, { method }), env)).status, 404);
      }
    }
    for (const method of ['GET', 'DELETE', 'OPTIONS']) {
      assert.equal((await worker.fetch(new Request(origin + '/api/contact', { method }), env)).status, 405);
    }
    assert.equal(await local.db.prepare('SELECT COUNT(*) FROM contact_requests').first('COUNT(*)'), 0);
  } finally { await local.dispose(); }
});

test('missing schema fails safely without success, PII or diagnostics', async () => {
  const local = await localD1(false);
  const logs: unknown[][] = [];
  const original = console.error;
  console.error = (...args) => { logs.push(args); };
  try {
    for (const [path, body] of [['/api/contact', contact], ['/api/funnel', { sessionId: 'session-123', event: 'cta_click' }]] as const) {
      const response = await worker.fetch(request(path, body), { DB: local.db });
      assert.equal(response.status, 503);
      const text = await response.text();
      assert.match(text, /"success":false/);
      assert.doesNotMatch(text, /Ada|ada@example|SELECT|INSERT|D1|SQL/);
      assert.equal(response.headers.get('cache-control'), 'no-store');
    }
    assert.deepEqual(logs, []);
    assert.equal((await worker.fetch(new Request(origin + '/api/health'), { DB: local.db })).status, 200);
  } finally { console.error = original; await local.dispose(); }
});
