import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createLocalJWKSet, SignJWT } from 'jose';
import { createHandler } from '../src/index.ts';
import { createAccessKeyResolver } from '../src/access-auth.ts';
import type { Env } from '../src/env.ts';
import { audience, jwks, otherKeys, rawToken, token, unsupportedKeys } from './helpers/access-jwt.ts';

const handler = createHandler(createLocalJWKSet(jwks));
// Denied requests must never touch DB; authorized ones read an empty stub panel.
const emptyDb = { prepare: () => ({ all: async () => ({ results: [] }) }) };
const env = (aud: string | undefined = audience, authorized = false) => ({
  ACCESS_AUD: aud,
  get DB() { if (authorized) return emptyDb; throw new Error('Denied private requests must never access DB'); },
  get ASSETS() { throw new Error('Private requests must never access assets'); },
}) as unknown as Env;
async function check(jwt: string | undefined, status = 401, url = 'https://blazz.cl/private', aud: string | undefined = audience, method = 'GET', extra = {}) {
  const response = await handler.fetch(new Request(url, { method, headers: { ...(jwt ? { 'Cf-Access-Jwt-Assertion': jwt } : {}), ...extra } }), env(aud, status === 200));
  assert.equal(response.status, status);
  assert.equal(response.headers.get('cache-control'), 'no-store');
  assert.equal(response.headers.get('x-robots-tag'), 'noindex');
  const text = await response.text();
  if (status === 200) assert.match(text, /Panel de <span class="gradient-text">Contactos/);
  else assert.equal(text, status === 401 ? 'Unauthorized' : 'Not found');
}

test('configured private boundary rejects missing JWT and forged identity headers', async () => {
  await check(undefined);
  await check(undefined, 401, undefined, undefined, 'GET', { 'Cf-Access-Authenticated-User-Email': 'fabianma7@gmail.com' });
});
test('missing or blank audience fails closed before bindings', async () => {
  for (const aud of ['', '  ']) await check(await token(), 404, undefined, aud);
  const response = await handler.fetch(new Request('https://blazz.cl/private'), { get DB() { throw Error('DB'); } } as unknown as Env);
  assert.equal(response.status, 404);
});
test('canonical origin and all private descendants are guarded for every method', async () => {
  const jwt = await token();
  for (const path of ['/private', '/private/', '/private/nested/action']) {
    for (const method of ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS', 'HEAD']) {
      await check(undefined, 401, `https://blazz.cl${path}`, audience, method);
      for (const origin of ['http://blazz.cl', 'https://alternate.workers.dev', 'https://blazz.cl:8443'])
        await check(jwt, 404, `${origin}${path}`, audience, method);
    }
  }
});
test('valid signed identity reaches the private panel; legacy admin paths stay absent', async () => {
  await check(await token(), 200);
  await check(await token({ aud: [audience, 'another'], email_verified: false }), 200, undefined, ` ${audience} `);
  for (const path of ['/admin', '/admin/', '/admin/nested', '/api/mark-read', '/api/delete']) {
    const response = await handler.fetch(new Request(`https://blazz.cl${path}`, { method: 'POST', headers: { 'Cf-Access-Jwt-Assertion': await token() } }), env());
    assert.equal(response.status, 404);
  }
});
test('signature, algorithm, issuer, audience and exact signed email are mandatory', async () => {
  for (const claims of [{ iss: 'https://evil.example' }, { iss: undefined }, { aud: 'wrong' }, { aud: undefined }, { email: undefined }, { email: 'other@gmail.com' }, { email: ' fabianma7@gmail.com' }, { email: 'fabianma7@gmail.com.evil' }, { email: 42 }])
    await check(await token(claims));
  // Email comparison is case-insensitive; whitespace and other identities stay denied.
  for (const email of ['Fabianma7@gmail.com', 'FABIANMA7@GMAIL.COM']) await check(await token({ email }), 200);
  await check(await token({}, {}, otherKeys.privateKey));
  await check(await token({}, { alg: 'RS512' }, unsupportedKeys.privateKey));
  await check(await new SignJWT({}).setProtectedHeader({ alg: 'HS256' }).sign(new Uint8Array(32)));
});
test('expiry is required and finite; bounded five-second exp/nbf tolerance', async () => {
  const now = Math.floor(Date.now() / 1000);
  await check(await token({ exp: undefined }));
  for (const exp of ['null', '1e999', '-1e999', '"future"', String(now - 10)]) await check(await rawToken(exp));
  await check(await token({ nbf: now + 60 }));
  await check(await rawToken(String(now + 300), '"tomorrow"'));
  await check(await token({ exp: now - 1, nbf: now + 1 }), 200);
});
test('malformed, excessive and unknown-key tokens deny; query keys cannot authorize', async () => {
  for (const jwt of ['broken', 'a.b.c', 'x'.repeat(16385), await token({}, { kid: 'unknown' })]) await check(jwt);
  await check(undefined, 401, 'https://blazz.cl/private?key=fabianma7@gmail.com');
});

test('origin, config and absent/oversized JWT deny before key resolution', async () => {
  let calls = 0;
  const guarded = createHandler(async () => { calls++; throw Error('Must not resolve'); });
  const jwt = await token();
  for (const [url, aud, assertion] of [
    ['http://blazz.cl/private', audience, jwt],
    ['https://alternate.workers.dev/private', audience, jwt],
    ['https://blazz.cl/private', '', jwt],
    ['https://blazz.cl/private', audience, ''],
    ['https://blazz.cl/private', audience, 'x'.repeat(16385)],
  ]) await guarded.fetch(new Request(url, { headers: { 'Cf-Access-Jwt-Assertion': assertion } }), env(aud));
  assert.equal(calls, 0);
});

test('remote resolver uses only fixed JWKS, forbids redirects, caches and ignores jku/x5u', async () => {
  let calls = 0;
  const resolver = createAccessKeyResolver(async (url, options) => {
    calls++;
    assert.equal(String(url), 'https://blazzz.cloudflareaccess.com/cdn-cgi/access/certs');
    assert.equal(options?.redirect, 'error');
    assert.equal(options?.method, 'GET');
    assert.ok(options?.signal instanceof AbortSignal);
    return Response.json(jwks);
  });
  const remote = createHandler(resolver);
  const jwt = await token({}, { jku: 'https://evil.example/keys', x5u: 'https://evil.example/cert' });
  for (let i = 0; i < 2; i++) {
    const response = await remote.fetch(new Request('https://blazz.cl/private', { headers: { 'Cf-Access-Jwt-Assertion': jwt } }), env(audience, true));
    assert.equal(response.status, 200);
  }
  assert.equal(calls, 1);
  for (const url of ['https://alternate.workers.dev/private', 'https://blazz.cl/private']) {
    const response = await remote.fetch(new Request(url, { headers: { 'Cf-Access-Jwt-Assertion': jwt } }), env(''));
    assert.equal(response.status, 404);
  }
  assert.equal(calls, 1);
});
test('JWKS failures, redirects and unknown keys deny generically without bindings', async () => {
  for (const fetcher of [
    async () => { throw Error('offline'); },
    async () => new Response(null, { status: 302, headers: { location: 'https://evil.example' } }),
    async () => Response.json({ keys: [] }),
    async () => new Response('bad JSON'),
  ]) {
    const remote = createHandler(createAccessKeyResolver(fetcher));
    const response = await remote.fetch(new Request('https://blazz.cl/private', { headers: { 'Cf-Access-Jwt-Assertion': await token() } }), env());
    assert.equal(response.status, 401);
    assert.equal(await response.text(), 'Unauthorized');
    assert.equal(response.headers.get('cache-control'), 'no-store');
    assert.equal(response.headers.get('x-robots-tag'), 'noindex');
  }
});
test('JWKS fetch has a bounded abort timeout', async () => {
  const remote = createHandler(createAccessKeyResolver(async (_url, options) => new Promise((_resolve, reject) => {
    options?.signal?.addEventListener('abort', () => reject(Error('aborted')), { once: true });
  })));
  const started = Date.now();
  const response = await remote.fetch(new Request('https://blazz.cl/private', { headers: { 'Cf-Access-Jwt-Assertion': await token() } }), env());
  assert.equal(response.status, 401);
  assert.ok(Date.now() - started >= 2500 && Date.now() - started < 6000);
});
