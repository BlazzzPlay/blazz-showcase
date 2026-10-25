import { expect, test } from '@playwright/test';
import { readdir } from 'node:fs/promises';
import { resolve } from 'node:path';

async function expectSingleVisibleH1(page: import('@playwright/test').Page, scopeSelector: string) {
  const h1s = page.locator(`${scopeSelector} h1`);
  await expect(h1s).toHaveCount(1);
  await expect(h1s.first()).toBeVisible();
}

async function expectJsonLdParseable(page: import('@playwright/test').Page) {
  const scripts = page.locator('script[type="application/ld+json"]');
  const count = await scripts.count();
  expect(count).toBeGreaterThan(0);

  for (let i = 0; i < count; i += 1) {
    const content = (await scripts.nth(i).textContent()) ?? '';
    expect(() => JSON.parse(content)).not.toThrow();
  }
}

test('home SEO foundation: metadata completa, H1 único y JSON-LD parseable', async ({ page }) => {
  await page.goto('/');

  await expect(page).toHaveTitle(/Fabian Mendoza · Blazz/);
  await expect(page.locator('meta[name="description"]')).toHaveAttribute('content', /\S+/);
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', 'https://blazz.cl/');
  await expect(page.locator('meta[property="og:url"]')).toHaveAttribute('content', 'https://blazz.cl/');
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'index,follow');

  await expectSingleVisibleH1(page, 'main');
  await expectJsonLdParseable(page);
});

test('admin SEO foundation: private route denied and absent from static output', async ({ page }) => {
  for (const route of ['/admin', '/admin/', '/admin?key=legacy']) {
    const response = await page.goto(route);
    expect(response?.status()).toBe(404);
    expect(response?.headers()['cache-control']).toBe('no-store');
    expect(await response?.text()).toBe('Not found');
    await expect(page.locator('section.admin, .contact-card')).toHaveCount(0);
  }
  const files = await readdir(resolve('dist'), { recursive: true });
  expect(files.filter(file => /^(admin|private|api)(\/|\.|$)/.test(file))).toEqual([]);
});

test('páginas objetivo Chile: canonical absoluto, description en rango y H1 único', async ({ page }) => {
  const cases = [
    { route: '/servicios', canonical: 'https://blazz.cl/servicios' },
    { route: '/portfolio', canonical: 'https://blazz.cl/portfolio' },
    { route: '/contacto', canonical: 'https://blazz.cl/contacto' },
  ];

  for (const entry of cases) {
    await page.goto(entry.route);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', entry.canonical);
    await expect(page.locator('meta[property="og:url"]')).toHaveAttribute('content', entry.canonical);
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'index,follow');

    const description = (await page.locator('meta[name="description"]').getAttribute('content')) ?? '';
    expect(description.length).toBeGreaterThanOrEqual(120);
    expect(description.length).toBeLessThanOrEqual(160);

    const title = await page.title();
    expect(title.length).toBeGreaterThanOrEqual(45);
    expect(title.length).toBeLessThanOrEqual(65);

    await expectSingleVisibleH1(page, 'main');
    await expectJsonLdParseable(page);
    await page.goto(`${entry.route}/`);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', entry.canonical);
    await expect(page.locator('meta[property="og:url"]')).toHaveAttribute('content', entry.canonical);
  }
});
