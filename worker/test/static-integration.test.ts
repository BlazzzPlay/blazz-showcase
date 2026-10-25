import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFile, readdir, mkdir, mkdtemp, symlink, stat } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { createServer } from 'node:net';
import { spawnSync } from 'node:child_process';
import { once } from 'node:events';
import { localD1, openLocalD1 } from './helpers/local-d1.ts';

const root = resolve(import.meta.dirname, '../..');

async function correctionFixture() {
  const parent = resolve(root, 'worker/.cloudflare');
  await mkdir(parent, { recursive: true });
  return mkdtemp(resolve(parent, 'correction-'));
}

test('correction: D1 initializes a truly absent isolated parent before mkdtemp', async () => {
  const parent = resolve(await correctionFixture(), 'fresh/state');
  await assert.rejects(stat(parent), { code: 'ENOENT' });
  const local = await localD1(true, parent);
  try {
    assert.ok(local.state.startsWith(parent + '/'));
    assert.equal(await local.db.prepare('SELECT COUNT(*) AS count FROM contact_requests').first('count'), 0);
  } finally { await local.dispose(); }
});

test('correction: both root scripts resolve the Worker-installed CLI explicitly', async () => {
  for (const script of ['test-stack.mjs', 'dev-stack.mjs']) {
    const source = await readFile(resolve(root, 'scripts', script), 'utf8');
    assert.match(source, /resolve\(root, 'worker\/node_modules\/\.bin\/cloudflare'\)/);
    assert.doesNotMatch(source, /launch\('cloudflare'/);
  }
});
test('frontend is static and has no server/action transport', async () => {
  const config = await readFile(resolve(root, 'astro.config.mjs'), 'utf8');
  assert.match(config, /output: 'static'/);
  assert.doesNotMatch(config, /@astrojs\/node|checkOrigin|adapter:/);
  const client = await readFile(resolve(root, 'src/pages/index.astro'), 'utf8');
  assert.doesNotMatch(client, /astro:actions|actions\./);
  assert.match(client, /postJson/);
});

test('JSON client preserves field errors and rejects malformed or contradictory success', async () => {
  const { postJson } = await import('../../src/lib/contact-api.ts');
  const respond = (body: unknown, status = 200) => async () => Response.json(body, { status });
  const invalid = { success: false, message: 'Revisa los campos.', fieldErrors: { name: ['Nombre inválido.'] } };
  assert.deepEqual(await postJson('/api/contact', {}, respond(invalid, 400)), invalid);
  assert.deepEqual(await postJson('/api/funnel', {}, respond({ success: true })), { success: true });
  for (const [body, status] of [[{ success: true }, 503], [{ success: true }, 200], [{ success: false }, 400], [{ success: false, message: 'invalid', fieldErrors: { name: 'not an array' } }, 400], [null, 200]] as const) {
    await assert.rejects(postJson('/api/contact', {}, respond(body, status)));
  }
  await assert.rejects(postJson('/api/contact', {}, async () => new Response('{')));
  await assert.rejects(postJson('/api/contact', {}, async () => { throw new Error('offline'); }));
  let called = false;
  await postJson('/api/contact', { name: 'Synthetic' }, async (url, options) => {
    called = true;
    assert.equal(url, '/api/contact');
    assert.equal(options?.method, 'POST');
    assert.equal(options?.credentials, 'same-origin');
    assert.equal(options?.headers && new Headers(options.headers).get('content-type'), 'application/json');
    assert.equal(options?.body, '{"name":"Synthetic"}');
    return Response.json({ success: true, message: 'Saved' });
  });
  assert.ok(called);
});

test('static output contains only public routes, canonical metadata and no legacy private data', async () => {
  const dist = resolve(root, 'dist');
  const bundled = await readFile(resolve(root, 'worker/.cloudflare/output/v0/workers/default/assets/index.html'), 'utf8');
  assert.equal(bundled, await readFile(resolve(dist, 'index.html'), 'utf8'));
  assert.doesNotMatch(bundled, /C2a static asset fixture/);
  const files: string[] = [];
  async function walk(dir: string) {
    for (const entry of await readdir(dir, { withFileTypes: true })) {
      const path = resolve(dir, entry.name);
      if (entry.isDirectory()) await walk(path); else files.push(path);
    }
  }
  await walk(dist);
  assert.ok(files.includes(resolve(dist, 'index.html')));
  const sitemap = await readFile(resolve(dist, 'sitemap-0.xml'), 'utf8');
  assert.equal(await readFile(resolve(root, 'worker/.cloudflare/output/v0/workers/default/assets/sitemap-0.xml'), 'utf8'), sitemap);
  assert.deepEqual([...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(match => match[1]).sort(),
    ['https://blazz.cl/', 'https://blazz.cl/contacto', 'https://blazz.cl/portfolio', 'https://blazz.cl/servicios']);
  for (const file of files) {
    assert.doesNotMatch(file.slice(dist.length), /^\/(admin|api|private|server)(\/|\.)/);
    if (/\.(html|js|xml)$/.test(file)) {
      assert.doesNotMatch(await readFile(file, 'utf8'), /blazz2026|contact_requests|contact_funnel_events|sqlite\.db|AstroActionInputError|qa@example\.com|proof@example\.invalid|Synthetic isolated integration proof/);
    }
  }
  for (const route of ['', 'servicios', 'portfolio', 'contacto']) {
    const html = await readFile(resolve(dist, route, 'index.html'), 'utf8');
    const canonical = `https://blazz.cl/${route}`;
    assert.equal(html.match(/<link\b[^>]*rel="canonical"[^>]*href="([^"]+)"/)?.[1], canonical);
    assert.equal(html.match(/<meta\b[^>]*property="og:url"[^>]*content="([^"]+)"/)?.[1], canonical);
    const asset = resolve(root, 'worker/.cloudflare/output/v0/workers/default/assets', route, 'index.html');
    assert.equal(await readFile(asset, 'utf8'), html);
  }
});

test('real static assets and JSON API share one local Worker origin with private denial', { timeout: 120000 }, async () => {
  const reservation = createServer();
  reservation.listen(0, '127.0.0.1');
  await once(reservation, 'listening');
  const address = reservation.address();
  assert.ok(address && typeof address !== 'string');
  await new Promise<void>((done, reject) => reservation.close(error => error ? reject(error) : done()));
  const modulePath = '../../scripts/test-stack.mjs';
  const { startStack } = await import(modulePath);
  const bin = resolve(await correctionFixture(), 'bin');
  await mkdir(bin);
  for (const name of ['node', 'npm', 'npx']) {
    await symlink(resolve(dirname(process.execPath), name), resolve(bin, name));
  }
  await symlink('/bin/sh', resolve(bin, 'sh'));
  const missing = spawnSync('cloudflare', ['--version'], { env: { ...process.env, PATH: bin } });
  assert.equal((missing.error as NodeJS.ErrnoException)?.code, 'ENOENT');
  const previousPath = process.env.PATH;
  let stack: { base: string; state: string; stop(): Promise<void> };
  try {
    process.env.PATH = bin;
    stack = await startStack({ build: false, port: address.port });
  } finally { process.env.PATH = previousPath; }
  const local = await openLocalD1(stack.state);
  try {
    // Fully consume probe responses before reusing the local HTTP connection.
    // A status-only fetch leaves streamed Worker responses active during teardown.
    async function probe(path: string, options?: RequestInit) {
      const response = await fetch(stack.base + path, options);
      await response.arrayBuffer();
      return response;
    }
    for (const path of ['/', '/servicios', '/portfolio', '/contacto']) {
      const response = await fetch(stack.base + path);
      assert.equal(response.status, 200, path);
      assert.match(await response.text(), /rel="canonical"/);
    }
    for (const path of ['/admin', '/admin/', '/admin/users', '/private', '/private/documents', '/api/delete', '/api/mark-read', '/api/unknown']) {
      for (const method of ['GET', 'POST', 'OPTIONS']) {
        const response = await probe(path, { method });
        assert.equal(response.status, 404, `${method} ${path}`);
        assert.equal(response.headers.get('cache-control'), 'no-store');
      }
    }
    for (const path of ['/api/contact', '/api/funnel']) {
      assert.equal((await probe(path)).status, 405, path);
      assert.equal((await probe(path, { method: 'POST' })).status, 403, path);
      assert.equal((await probe(path, { method: 'POST', headers: { origin: 'https://evil.invalid', 'content-type': 'application/json' }, body: '{}' })).status, 403, path);
      assert.equal((await probe(path, { method: 'POST', headers: { origin: stack.base, 'content-type': 'application/json' }, body: '{}' })).status, 400, path);
    }
    const post = (path: string, body: unknown) => probe(path, { method: 'POST', headers: { origin: stack.base, 'content-type': 'application/json' }, body: JSON.stringify(body) });
    assert.equal((await post('/api/contact', { name: 'Local proof', email: 'proof@example.invalid', subject: 'Static integration', message: 'Synthetic isolated integration proof.' })).status, 200);
    assert.equal(await local.db.prepare('SELECT COUNT(*) AS count FROM contact_requests').first('count'), 1);
    assert.equal((await post('/api/funnel', { sessionId: 'static-local-proof', event: 'form_submit_success' })).status, 200);
    assert.equal(await local.db.prepare('SELECT COUNT(*) AS count FROM contact_funnel_events').first('count'), 1);
  } finally {
    await local.dispose();
    await stack.stop();
  }
  await assert.rejects(fetch(stack.base, { signal: AbortSignal.timeout(500) }));
});

test('lock roots and CI retain independent packages and ordered local verification', async () => {
  const locks: Record<string, { packages: Record<string, Record<string, unknown>> }> = {};
  for (const dir of ['', 'worker']) {
    const manifest = JSON.parse(await readFile(resolve(root, dir, 'package.json'), 'utf8'));
    const lock = JSON.parse(await readFile(resolve(root, dir, 'package-lock.json'), 'utf8'));
    for (const field of ['dependencies', 'devDependencies', 'engines']) {
      assert.deepEqual(lock.packages[''][field], manifest[field]);
    }
    locks[dir] = lock;
  }
  for (const name of ['@astrojs/node', '@libsql/client', 'drizzle-orm']) {
    assert.equal(locks[''].packages[`node_modules/${name}`], undefined);
  }
  const ci = await readFile(resolve(root, '.github/workflows/e2e-light.yml'), 'utf8');
  let previous = -1;
  for (const command of ['npm ci', 'npm --prefix worker ci', 'npm run test:unit',
    'npm run typecheck', 'npm --prefix worker run typecheck', 'npm --prefix worker run test:api',
    'npm run build', 'npm --prefix worker run build', 'npm --prefix worker run test:static',
    'npm run test:e2e -- --reporter=line']) {
    const index = ci.indexOf(command, previous + 1);
    assert.ok(index > previous, command);
    previous = index;
  }
  assert.doesNotMatch(ci, /cloudflare deploy|wrangler|CLOUDFLARE_API_TOKEN|secrets\./);
});
