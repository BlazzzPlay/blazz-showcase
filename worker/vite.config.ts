import { defineConfig } from 'vite';
import { cloudflare } from '@cloudflare/vite-plugin';

export default defineConfig({
  // The plugin consumes Vite publicDir; cf assets has no directory option.
  // Foundation verification opts in explicitly to its fixture, never stale dist.
  publicDir: process.env.STATIC_FIXTURE === '1' ? 'test/fixtures/static' : '../dist',
  envDir: false,
  server: {
    host: '127.0.0.1',
    port: Number(process.env.FOUNDATION_PORT ?? 18797),
    strictPort: true,
    cors: false,
  },
  plugins: [cloudflare({
    persistState: { path: process.env.FOUNDATION_STATE ?? '.cloudflare/local-state' },
    remoteBindings: false,
    inspectorPort: false,
  })],
});
