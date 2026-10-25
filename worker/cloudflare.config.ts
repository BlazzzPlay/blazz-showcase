import { bindings, defineConfig } from 'cf/config';
import * as entrypoint from './src/index.ts' with { type: 'cf-worker' };

export default defineConfig({
  accountId: '78a16433f7a4e0421319f6310b5acacc',
  worker: {
    name: 'blazz-portfolio',
    entrypoint,
    compatibilityDate: '2026-10-11',
    env: {
      DB: bindings.d1({ id: '43a7fa88-38f6-43d0-99ea-df68bab1896e' }),
    },
    assets: {
      runWorkerFirst: ['/api/*', '/admin', '/admin/*', '/private', '/private/*'],
      notFoundHandling: 'none',
    },
  },
});
