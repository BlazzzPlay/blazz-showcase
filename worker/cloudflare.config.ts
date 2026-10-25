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
      // Audience tag of the "Blazz Portfolio Private" Access application (public, not a secret).
      ACCESS_AUD: bindings.text('fc09a27bb9ae54bc690991d642b1a833aeb95599e4c4701113a49f3f3da7b403'),
    },
    domains: ['blazz.cl'],
    assets: {
      runWorkerFirst: ['/api/*', '/admin', '/admin/*', '/private', '/private/*'],
      notFoundHandling: 'none',
      // Serve canonical slash-less URLs (/servicios) directly; /servicios/ redirects to them.
      htmlHandling: 'drop-trailing-slash',
    },
  },
});
