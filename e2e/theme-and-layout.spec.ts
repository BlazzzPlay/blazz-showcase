import { expect, test } from '@playwright/test';

test.describe('light system preference', () => {
  test.use({ colorScheme: 'light' });

  test('starts light, toggles to dark and remembers the choice after reload', async ({ page }) => {
    await page.goto('/');
    const html = page.locator('html');
    const toggle = page.locator('.theme-toggle');

    await expect(html).toHaveAttribute('data-theme', 'light');
    await expect(toggle).toHaveAttribute('aria-label', 'Cambiar a modo oscuro');
    const lightBg = await page.evaluate(() => getComputedStyle(document.documentElement).backgroundColor);

    await toggle.click();
    await expect(html).toHaveAttribute('data-theme', 'dark');
    await expect(toggle).toHaveAttribute('aria-label', 'Cambiar a modo claro');
    await expect
      .poll(() => page.evaluate(() => getComputedStyle(document.documentElement).backgroundColor))
      .not.toBe(lightBg);

    await page.reload();
    await expect(html).toHaveAttribute('data-theme', 'dark');
  });
});

test.describe('dark system preference', () => {
  test.use({ colorScheme: 'dark' });

  test('starts dark when the system prefers dark and nothing is saved', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  });
});

test('home shows the redesign sections and the FAQ opens', async ({ page }) => {
  await page.goto('/');
  for (const id of ['que-hago', 'proyectos', 'como', 'faq', 'contacto']) {
    await expect(page.locator(`section#${id}`)).toHaveCount(1);
  }
  const first = page.locator('#faq details').first();
  await first.locator('summary').click();
  await expect(first).toHaveAttribute('open', '');
  await expect(first.locator('p')).toBeVisible();
});

test('mobile 390px: no horizontal overflow and projects stack vertically', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(0);

  const boxes = await page.locator('.project-card').evaluateAll((cards) =>
    cards.map((c) => c.getBoundingClientRect()).map((r) => ({ left: r.left, right: r.right, top: r.top })),
  );
  expect(boxes.length).toBe(3);
  for (const b of boxes) {
    expect(b.left).toBeGreaterThanOrEqual(0);
    expect(b.right).toBeLessThanOrEqual(390);
  }
  expect(boxes[1].top).toBeGreaterThan(boxes[0].top);
  expect(boxes[2].top).toBeGreaterThan(boxes[1].top);
});

for (const path of ['/servicios', '/contacto', '/portfolio']) {
  for (const colorScheme of ['light', 'dark'] as const) {
    test(`${path} ${colorScheme}: theme, no overflow, panel link and mobile menu`, async ({ browser }) => {
      const ctx = await browser.newContext({ colorScheme, viewport: { width: 390, height: 900 } });
      const page = await ctx.newPage();
      await page.goto(path);
      await expect(page.locator('html')).toHaveAttribute('data-theme', colorScheme);
      expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBe(0);
      await expect(page.getByRole('link', { name: 'Panel de contactos' })).toBeVisible();
      const menuBtn = page.locator('.mobile-menu-btn');
      await menuBtn.click();
      await expect(menuBtn).toHaveAttribute('aria-expanded', 'true');
      await page.keyboard.press('Escape');
      await expect(menuBtn).toHaveAttribute('aria-expanded', 'false');
      await ctx.close();
    });
  }
}

test('mobile sticky CTA is hidden at the top and reachable once shown', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  const cta = page.locator('.mobile-cta');
  await expect(cta).toBeHidden();
  await page.locator('#como').scrollIntoViewIfNeeded();
  await expect(cta).toBeVisible();
  await expect(cta).toHaveAccessibleName('Contar mi proyecto');
});

test('footer links to the privacy policy page', async ({ page }) => {
  await page.goto('/');
  const link = page.locator('footer').getByRole('link', { name: 'Política de privacidad' });
  await expect(link).toBeVisible();
  await expect(link).toHaveAttribute('href', '/privacidad');
});

test('/privacidad: single h1, legal references and no overflow at 390px', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const res = await page.goto('/privacidad');
  expect(res?.status()).toBe(200);
  const h1 = page.locator('main h1');
  await expect(h1).toHaveCount(1);
  await expect(h1).toBeVisible();
  await expect(h1).toHaveText('Política de privacidad');
  await expect(page.locator('main')).toContainText('Ley N° 19.628');
  await expect(page.locator('main')).toContainText('blazzzplay@gmail.com');
  expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(0);
});

test('the page has a single scrollbar: <main> never becomes its own scroll container', async ({ page }) => {
  await page.goto('/');
  const overflowY = await page.locator('main').evaluate((m) => getComputedStyle(m).overflowY);
  expect(overflowY).toBe('visible');
});
