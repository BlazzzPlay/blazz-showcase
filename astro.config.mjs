// @ts-check
import { defineConfig } from 'astro/config';
import node from '@astrojs/node';
import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({
  output: 'server',
  site: 'https://blazz.cl',
  server: {
    host: true,
    port: 4321,
  },
  security: {
    checkOrigin: false,
  },
  integrations: [sitemap({
    changefreq: 'weekly',
    priority: 0.7,
    lastmod: new Date(),
  })],
  adapter: node({
    mode: 'standalone',
  }),
});