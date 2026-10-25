import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createLocalJWKSet } from 'jose';
import { createHandler } from '../src/index.ts';
import type { Env } from '../src/env.ts';
import { localD1 } from './helpers/local-d1.ts';
import { audience, jwks, token } from './helpers/access-jwt.ts';

const handler = createHandler(createLocalJWKSet(jwks));
const base = 'https://blazz.cl';

async function seeded() {
  const local = await localD1();
  const insert = 'INSERT INTO contact_requests (name,email,subject,message,is_read,created_at) VALUES (?,?,?,?,?,?)';
  await local.db.prepare(insert).bind('Old Reader', 'old@example.com', 'Viejo', 'Mensaje antiguo leído.', 1, 1700000000).run();
  await local.db.prepare(insert).bind('<script>alert(1)</script>', 'x"onmouseover="a@example.com', 'Asunto & <b>', "Línea 1\nLínea 2 '\"<img>", 0, 1800000000).run();
  return { local, env: { DB: local.db, ACCESS_AUD: audience } as Env };
}
async function call(env: Env, path: string, init: RequestInit = {}, jwt?: string | null) {
  const headers = new Headers(init.headers);
  if (jwt !== null) headers.set('Cf-Access-Jwt-Assertion', jwt ?? await token());
  return handler.fetch(new Request(base + path, { ...init, headers }), env);
}
const mutate = (env: Env, action: string, body: unknown, headers: Record<string, string> = {}, jwt?: string | null) =>
  call(env, `/private/api/${action}`, { method: 'POST', body: typeof body === 'string' ? body : JSON.stringify(body),
    headers: { origin: base, 'content-type': 'application/json', ...headers } }, jwt);
const rows = (env: Env) => env.DB.prepare('SELECT id, is_read FROM contact_requests ORDER BY id').all().then(r => r.results);

test('authorized GET /private renders newest-first escaped panel with unread count and hardened headers', async () => {
  const { local, env } = await seeded();
  try {
    const response = await call(env, '/private');
    assert.equal(response.status, 200);
    assert.match(response.headers.get('content-type') ?? '', /^text\/html; charset=utf-8/);
    assert.equal(response.headers.get('cache-control'), 'no-store');
    assert.equal(response.headers.get('x-robots-tag'), 'noindex');
    assert.equal(response.headers.get('x-frame-options'), 'DENY');
    assert.equal(response.headers.get('referrer-policy'), 'no-referrer');
    const csp = response.headers.get('content-security-policy') ?? '';
    const nonce = /script-src 'nonce-([A-Za-z0-9+/=_-]+)'/.exec(csp)?.[1];
    assert.ok(nonce, csp);
    assert.match(csp, /default-src 'none'/);
    assert.match(csp, /frame-ancestors 'none'/);
    const html = await response.text();
    assert.match(html, /Panel de <span class="gradient-text">Contactos<\/span>/);
    assert.match(html, /2 solicitudes totales/);
    assert.match(html, /1 sin leer/);
    assert.ok(html.indexOf('&lt;script&gt;alert(1)&lt;/script&gt;') < html.indexOf('Old Reader'), 'newest first');
    assert.ok(!html.includes('<script>alert(1)'));
    assert.ok(!html.includes('<b>') && !html.includes('<img>'));
    assert.ok(html.includes('x&quot;onmouseover=&quot;a@example.com'));
    assert.ok(html.includes('Asunto &amp; &lt;b&gt;'));
    // Every inline script carries the CSP nonce.
    for (const tag of html.match(/<script[^>]*>/g) ?? []) assert.ok(tag.includes(`nonce="${nonce}"`), tag);
    assert.equal((html.match(/data-action="mark-read"/g) ?? []).length, 1, 'mark-read only for unread');
    assert.equal((html.match(/data-action="delete"/g) ?? []).length, 2);
  } finally { await local.dispose(); }
});

test('empty panel shows the empty state', async () => {
  const local = await localD1();
  try {
    const html = await (await call({ DB: local.db, ACCESS_AUD: audience } as Env, '/private')).text();
    assert.match(html, /No hay solicitudes de contacto todavía/);
    assert.match(html, /0 solicitudes totales/);
  } finally { await local.dispose(); }
});

test('mark-read and delete mutate exactly one row via strict integer JSON', async () => {
  const { local, env } = await seeded();
  try {
    const read = await mutate(env, 'mark-read', { id: 2 });
    assert.equal(read.status, 200);
    assert.deepEqual(await read.json(), { success: true });
    assert.deepEqual(await rows(env), [{ id: 1, is_read: 1 }, { id: 2, is_read: 1 }]);
    const removed = await mutate(env, 'delete', { id: 1 });
    assert.equal(removed.status, 200);
    assert.deepEqual(await removed.json(), { success: true });
    assert.deepEqual(await rows(env), [{ id: 2, is_read: 1 }]);
    const missing = await mutate(env, 'delete', { id: 99 });
    assert.equal(missing.status, 404);
    assert.deepEqual(await missing.json(), { success: false, message: 'Solicitud no encontrada.' });
  } finally { await local.dispose(); }
});

test('invalid, cross-origin, wrong-media and wrong-method mutations change nothing', async () => {
  const { local, env } = await seeded();
  try {
    const before = await rows(env);
    for (const body of [{}, { id: '2' }, { id: 1.5 }, { id: 0 }, { id: -1 }, { id: 2, extra: 1 }, [2], null, 'not json', { id: 2 ** 53 }]) {
      const response = await mutate(env, 'delete', body);
      assert.equal(response.status, 400, JSON.stringify(body));
      assert.deepEqual(await response.json(), { success: false, message: 'Identificador inválido.' });
    }
    assert.equal((await mutate(env, 'delete', { id: 2 }, { origin: 'https://evil.example' })).status, 403);
    assert.equal((await mutate(env, 'delete', { id: 2 }, { origin: '' })).status, 403);
    assert.equal((await mutate(env, 'delete', { id: 2 }, { 'content-type': 'text/plain' })).status, 415);
    const get = await call(env, '/private/api/delete');
    assert.equal(get.status, 405);
    assert.equal(get.headers.get('allow'), 'POST');
    assert.equal((await mutate(env, 'unknown', { id: 2 })).status, 404);
    assert.equal((await call(env, '/private', { method: 'POST' })).status, 405);
    assert.equal((await call(env, '/private/other')).status, 404);
    assert.deepEqual(await rows(env), before);
  } finally { await local.dispose(); }
});

test('unauthenticated or wrong identity never reads or mutates the database', async () => {
  const { local, env } = await seeded();
  try {
    const before = await rows(env);
    const guarded = { ACCESS_AUD: audience, get DB(): D1Database { throw new Error('DB touched before authorization'); } } as Env;
    for (const jwt of [null, await token({ email: 'other@gmail.com' }), 'garbage']) {
      assert.equal((await call(guarded, '/private', {}, jwt)).status, 401);
      assert.equal((await mutate(guarded, 'delete', { id: 2 }, {}, jwt)).status, 401);
      assert.equal((await mutate(guarded, 'mark-read', { id: 2 }, {}, jwt)).status, 401);
    }
    assert.deepEqual(await rows(env), before);
  } finally { await local.dispose(); }
});
