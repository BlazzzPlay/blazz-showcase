import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { createServer } from 'node:net';
import { mkdir, mkdtemp } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { setTimeout as delay } from 'node:timers/promises';
import { openLocalD1 } from '../worker/test/helpers/local-d1.ts';

const root = resolve(import.meta.dirname, '..');
export async function startStack({ build = true, port = Number(process.env.TEST_STACK_PORT ?? 4401), state = process.env.TEST_STACK_STATE } = {}) {
  const children = [];
  let stopping;
  const stop = () => stopping ??= (async () => {
    for (const child of children.reverse()) {
      if (child.exitCode !== null || child.signalCode !== null) continue;
      const exited = once(child, 'exit');
      // Only this harness's detached child process groups, never ambient servers.
      try { process.kill(-child.pid, 'SIGTERM'); } catch (error) { if (error.code !== 'ESRCH') throw error; }
      let timer;
      await Promise.race([exited, new Promise((done) => {
        timer = setTimeout(() => {
          try { process.kill(-child.pid, 'SIGKILL'); } catch (error) { if (error.code !== 'ESRCH') throw error; }
          done();
        }, 5000);
      })]);
      clearTimeout(timer);
      // cf can exit before its delegated Vite/workerd descendants finish.
      // The detached process group is still owned by this child invocation.
      await delay(100);
      try { process.kill(-child.pid, 'SIGKILL'); } catch (error) { if (error.code !== 'ESRCH') throw error; }
    }
  })();
  function launch(command, args, cwd, env = process.env) {
    const child = spawn(command, args, { cwd, env, detached: true, stdio: ['ignore', 'pipe', 'pipe'] });
    children.push(child);
    console.log(`Owned local stack child PID/group ${child.pid}: ${command}`);
    child.stdout.pipe(process.stdout);
    child.stderr.pipe(process.stderr);
    return child;
  }
  const interrupted = () => { void stop(); };
  process.once('SIGINT', interrupted);
  process.once('SIGTERM', interrupted);
  try {
    const reservation = createServer();
    reservation.listen(port, '127.0.0.1');
    await once(reservation, 'listening');
    await new Promise((done, reject) => reservation.close(error => error ? reject(error) : done()));
    if (build) {
      const child = launch('npm', ['run', 'build'], root);
      const [code] = await once(child, 'exit');
      if (code !== 0) throw new Error(`Static build failed: ${code}`);
    }
    if (stopping) throw new Error('Local stack startup interrupted');
    await mkdir(resolve(root, 'worker/.cloudflare'), { recursive: true });
    state ??= await mkdtemp(resolve(root, 'worker/.cloudflare/e2e-'));
    await mkdir(state, { recursive: true });
    const local = await openLocalD1(state, true);
    await local.dispose();
    if (stopping) throw new Error('Local stack startup interrupted');
    const child = launch(resolve(root, 'worker/node_modules/.bin/cloudflare'), ['dev'], resolve(root, 'worker'), {
      ...process.env, STATIC_FIXTURE: '0', FOUNDATION_PORT: String(port), FOUNDATION_STATE: state,
    });
    const base = `http://127.0.0.1:${port}`;
    let ready = false;
    for (let attempt = 0; attempt < 200; attempt++) {
      if (stopping || child.exitCode !== null || child.signalCode !== null) throw new Error('Local Worker exited before readiness');
      try {
        const response = await fetch(`${base}/api/health`, { signal: AbortSignal.timeout(500) });
        ready = response.ok;
      } catch { /* Startup is bounded below. */ }
      if (ready) break;
      await delay(100);
    }
    if (!ready) throw new Error('Local Worker did not become healthy');
    console.log(`TEST_STACK_READY ${base}; isolated D1 ${state}/v3`);
    return { base, state, child, stop: async () => {
      await stop();
      process.removeListener('SIGINT', interrupted);
      process.removeListener('SIGTERM', interrupted);
    } };
  } catch (error) {
    await stop();
    process.removeListener('SIGINT', interrupted);
    process.removeListener('SIGTERM', interrupted);
    throw error;
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const stack = await startStack();
  try { await once(stack.child, 'exit'); } finally { await stack.stop(); }
}
