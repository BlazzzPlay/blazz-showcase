import { expect, test } from '@playwright/test';

// The owner reaches the Access-protected panel from the footer of every public page.
for (const path of ['/', '/servicios', '/portfolio', '/contacto']) {
  test(`footer links to the private panel on ${path}`, async ({ page }) => {
    await page.goto(path);
    const link = page.locator('footer').getByRole('link', { name: 'Panel de contactos' });
    await expect(link).toHaveCount(1);
    await expect(link).toBeVisible();
    await expect(link).toHaveAttribute('href', '/private');
    // Crawlers must not follow it: the panel is private and noindex.
    await expect(link).toHaveAttribute('rel', 'nofollow');
  });
}
