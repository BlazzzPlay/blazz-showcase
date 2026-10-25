// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({
  output: 'static',
  trailingSlash: 'never',
  site: 'https://blazz.cl',
  server: {
    host: true,
    port: 4321,
  },
  integrations: [sitemap({
    changefreq: 'weekly',
    priority: 0.7,
    lastmod: new Date(),
    filter: (page) => !page.includes('/admin') && !page.includes('/api/'),
  })],
});