import assert from 'node:assert/strict';
import { test } from 'node:test';
import { spawn, spawnSync } from 'node:child_process';
import { once } from 'node:events';
import { createServer } from 'node:net';
import { mkdtemp, readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';
import { Miniflare } from 'miniflare';

const id = '43a7fa88-38f6-43d0-99ea-df68bab1896e';
const cwd = resolve(import.meta.dirname, '..');
// Both cf dev and cf local D1 commands share this exact isolated state root.
const state = await mkdtemp(resolve(cwd, '.cloudflare/proof-'));

function cf(args: string[]) {
  console.log(`cloudflare ${args.join(' ')}`);
  const result = spawnSync('cloudflare', args, { cwd, encoding: 'utf8', timeout: 10000 });
  console.log(result.stdout);
  console.log(`exit=${result.status} signal=${result.signal} error=${result.error?.message ?? 'none'}`);
  return result;
}

test('isolated cf build configuration pins resources and asset routing', async () => {
  const config = JSON.parse(await readFile(resolve(cwd,
    '.cloudflare/output/v0/workers/default/worker.config.json'), 'utf8'));
  assert.equal(config.name, 'blazz-portfolio');
  assert.deepEqual(config.env, { DB: { type: 'd1', id } });
  assert.deepEqual(config.assets.runWorkerFirst, ['/api/*', '/admin', '/admin/*', '/private', '/private/*']);
  assert.equal(config.assets.notFoundHandling, 'none');
  const source = await readFile(resolve(cwd, 'cloudflare.config.ts'), 'utf8');
  assert.match(source, /accountId: '78a16433f7a4e0421319f6310b5acacc'/);
  assert.doesNotMatch(source, /directory:/);
  assert.match(await readFile(resolve(cwd,
    '.cloudflare/output/v0/workers/default/assets/index.html'), 'utf8'), /C2a static asset fixture/);
});

test('cf dev assets, worker health and private denial', { timeout: 120000 }, async () => {
  const reservation = createServer();
  reservation.listen(0, '127.0.0.1');
  await once(reservation, 'listening');
  const address = reservation.address();
  assert.ok(address && typeof address !== 'string');
  const port = address.port;
  await new Promise<void>((done, reject) => reservation.close(error => error ? reject(error) : done()));
  const base = `http://127.0.0.1:${port}`;
  console.log(`FOUNDATION_PORT=${port} FOUNDATION_STATE=${state} cloudflare dev`);
  const server = spawn('cloudflare', ['dev'], {
    cwd, env: { ...process.env, FOUNDATION_STATE: state, FOUNDATION_PORT: String(port) },
    detached: true, stdio: ['ignore', 'pipe', 'pipe'],
  });
  console.log(`cf dev startup PID ${server.pid}`);
  let output = '';
  server.stdout.on('data', data => { output += data; });
  server.stderr.on('data', data => { output += data; });
  const exited = once(server, 'exit');
  try {
    let ready = false;
    for (let n = 0; n < 150; n++) {
      assert.equal(server.exitCode, null, output);
      try {
        const response = await fetch(base, { signal: AbortSignal.timeout(500) });
        ready = response.ok;
      } catch { /* wait for the local server */ }
      if (ready) break;
      await delay(100);
    }
    assert.ok(ready, output);
    const asset = await fetch(base);
    assert.match(await asset.text(), /C2a static asset fixture/);
    const health = await fetch(`${base}/api/health`);
    assert.equal(health.status, 200);
    assert.deepEqual(await health.json(), { ok: true });
    for (const path of ['/admin', '/admin/', '/admin/users', '/private', '/private/', '/private/documents', '/api/admin', '/api/unknown']) {
      for (const method of ['GET', 'POST', 'DELETE', 'OPTIONS']) {
        const denied = await fetch(`${base}${path}`, { method });
        assert.equal(denied.status, 404, `${method} ${path}`);
        assert.equal(denied.headers.get('cache-control'), 'no-store');
      }
    }
    for (const method of ['GET', 'DELETE', 'OPTIONS']) {
      assert.equal((await fetch(`${base}/api/contact`, { method })).status, 405);
    }
    const missingOrigin = await fetch(`${base}/api/contact`, { method: 'POST' });
    assert.equal(missingOrigin.status, 403);
    const invalidContact = await fetch(`${base}/api/contact`, {
      method: 'POST', headers: { origin: base, 'content-type': 'application/json' }, body: '{}',
    });
    assert.equal(invalidContact.status, 400);
    const invalidBody = await invalidContact.json() as { success: boolean; fieldErrors: Record<string, string[]> };
    assert.equal(invalidBody.success, false);
    assert.deepEqual(Object.keys(invalidBody.fieldErrors).sort(), ['email', 'message', 'name', 'subject']);
    assert.equal(invalidContact.headers.get('cache-control'), 'no-store');
    assert.equal((await fetch(`${base}/api/health`, { method: 'POST' })).status, 404);
  } finally {
    if (server.pid && server.exitCode === null) process.kill(-server.pid, 'SIGTERM');
    await Promise.race([exited, delay(10000).then(() => { throw new Error('cf dev did not stop'); })]);
    console.log(output);
    console.log(`cf dev shutdown PID ${server.pid}: exit=${server.exitCode} signal=${server.signalCode}`);
  }
});

test('cf local migration repeat-apply and runtime binding query', { timeout: 60000 }, async () => {
  const args = ['d1', 'migrations', 'apply', id, '--dir', 'test/fixtures/migrations',
    '--local', '--persist-to', state];
  const first = cf(args);
  const second = cf(args);
  assert.deepEqual(JSON.parse(second.stdout), []);
  const sql = 'SELECT value, (SELECT COUNT(*) FROM d1_migrations) AS count FROM foundation_probe';
  const rows = cf(['d1', 'raw', id, '--sql', sql, '--local', '--persist-to', state]);
  assert.match(rows.stdout, /local-only/);

  // Same Workers runtime and binding identity as the Vite output; no debug API added.
  const config = JSON.parse(await readFile(resolve(cwd,
    '.cloudflare/output/v0/workers/default/worker.config.json'), 'utf8'));
  const bundle = await readFile(resolve(cwd,
    '.cloudflare/output/v0/workers/default/bundle/index.js'), 'utf8');
  const runtime = new Miniflare({
    workers: [{ config: {
      name: config.name,
      compatibilityDate: config.compatibilityDate,
      env: config.env,
      manifest: { mainModule: 'index.js', modules: { 'index.js': { type: 'esm', contents: bundle } } },
    } }],
    resourcePersistencePath: resolve(state, 'v3'),
  });
  try {
    const db = await runtime.getD1Database('DB');
    assert.deepEqual(await db.prepare('SELECT value FROM foundation_probe WHERE id = 1').first(),
      { value: 'local-only' });
    assert.equal(await db.prepare('SELECT COUNT(*) AS count FROM d1_migrations').first('count'), 1);
    console.log(`Local DB mapping: ${state}/v3; binding DB -> ${id}; probe row and one migration verified`);
  } finally {
    await runtime.dispose();
  }
  for (const result of [first, second, rows]) {
    assert.equal(result.status, 0, `cf local command failed or timed out: ${result.stderr}; ${result.error}`);
  }
});
