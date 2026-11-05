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
