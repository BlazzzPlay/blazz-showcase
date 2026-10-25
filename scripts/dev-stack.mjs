import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
let child;
const stop = () => {
  if (child?.pid && child.exitCode === null && child.signalCode === null) {
    try { process.kill(-child.pid, 'SIGTERM'); } catch (error) { if (error.code !== 'ESRCH') throw error; }
  }
};
process.once('SIGINT', stop);
process.once('SIGTERM', stop);
function launch(command, args, cwd) {
  child = spawn(command, args, { cwd, env: { ...process.env, STATIC_FIXTURE: '0' }, detached: true, stdio: 'inherit' });
  return once(child, 'exit');
}
try {
  const [code] = await launch('npm', ['run', 'build'], root);
  if (code !== 0) process.exitCode = code ?? 1;
  else {
    console.log('Static frontend built. Serving frontend + API on the Worker origin (default 127.0.0.1:18797).');
    console.log('No provisioning or migration runs here. Initialize local D1 with cf; see worker/README.md for the known CLI blocker.');
    const [exitCode] = await launch(resolve(root, 'worker/node_modules/.bin/cloudflare'), ['dev'], resolve(root, 'worker'));
    process.exitCode = exitCode ?? 0;
  }
} finally {
  stop();
  process.removeListener('SIGINT', stop);
  process.removeListener('SIGTERM', stop);
}
