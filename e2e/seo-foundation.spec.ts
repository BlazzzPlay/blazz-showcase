import { expect, test } from '@playwright/test';

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
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'index,follow');

  await expectSingleVisibleH1(page, 'main');
  await expectJsonLdParseable(page);
});

test('admin SEO foundation: ruta no indexable con robots noindex,nofollow', async ({ page }) => {
  await page.goto('/admin?key=blazz2026');

  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex,nofollow');
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', 'https://blazz.cl/admin');
  await expectSingleVisibleH1(page, 'section.admin');
  await expectJsonLdParseable(page);
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
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'index,follow');

    const description = (await page.locator('meta[name="description"]').getAttribute('content')) ?? '';
    expect(description.length).toBeGreaterThanOrEqual(120);
    expect(description.length).toBeLessThanOrEqual(160);

    const title = await page.title();
    expect(title.length).toBeGreaterThanOrEqual(45);
    expect(title.length).toBeLessThanOrEqual(65);

    await expectSingleVisibleH1(page, 'main');
    await expectJsonLdParseable(page);
  }
});
