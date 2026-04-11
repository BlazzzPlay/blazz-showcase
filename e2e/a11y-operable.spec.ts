import { expect, test } from '@playwright/test';

async function expectVisibleFocusRing(page: import('@playwright/test').Page) {
  const focusStyles = await page.evaluate(() => {
    const active = document.activeElement as HTMLElement | null;
    if (!active) return null;

    const styles = window.getComputedStyle(active);
    return {
      outlineStyle: styles.outlineStyle,
      outlineWidth: styles.outlineWidth,
      boxShadow: styles.boxShadow,
    };
  });

  expect(focusStyles).not.toBeNull();
  expect(focusStyles?.outlineStyle).not.toBe('none');
  expect(focusStyles?.outlineWidth).not.toBe('0px');
}

async function tabUntilFocused(
  page: import('@playwright/test').Page,
  locator: import('@playwright/test').Locator,
  maxTabs = 20,
) {
  for (let attempt = 0; attempt < maxTabs; attempt += 1) {
    if (await locator.evaluate((el) => el === document.activeElement)) return;
    await page.keyboard.press('Tab');
  }

  await expect(locator).toBeFocused();
}

test('desktop: keyboard navigation keeps logical order and visible focus', async ({ page, isMobile }) => {
  test.skip(isMobile, 'Desktop-only keyboard order check');

  await page.goto('/');

  const desktopNavLinks = page.locator('.nav-links a');

  await tabUntilFocused(page, desktopNavLinks.nth(0));
  await expect(desktopNavLinks.nth(0)).toBeFocused();
  await expectVisibleFocusRing(page);

  await page.keyboard.press('Tab');
  await expect(desktopNavLinks.nth(1)).toBeFocused();

  await page.keyboard.press('Tab');
  await expect(desktopNavLinks.nth(2)).toBeFocused();

  await page.keyboard.press('Tab');
  await expect(desktopNavLinks.nth(3)).toBeFocused();

  await page.keyboard.press('Tab');
  await expect(page.locator('.nav-action a.d-none-mobile')).toBeFocused();

  await page.keyboard.press('Enter');
  await expect.poll(() => new URL(page.url()).hash).toBe('#contacto');
});

test('mobile: menu opens/closes with keyboard, supports Escape and focus return', async ({ page, isMobile }) => {
  test.skip(!isMobile, 'Mobile-only menu accessibility check');

  await page.goto('/');

  const menuButton = page.locator('.mobile-menu-btn');
  await tabUntilFocused(page, menuButton);
  await expect(menuButton).toBeFocused();

  await page.keyboard.press('Enter');

  const mobileMenu = page.locator('#mobile-menu');
  await expect(menuButton).toHaveAttribute('aria-expanded', 'true');
  await expect(mobileMenu).toHaveAttribute('aria-hidden', 'false');
  await expect(page.locator('.mobile-nav-links a').first()).toBeFocused();

  await page.keyboard.press('Shift+Tab');
  await expect(page.locator('.mobile-nav-links a').last()).toBeFocused();

  await page.keyboard.press('Tab');
  await expect(page.locator('.mobile-nav-links a').first()).toBeFocused();

  await page.keyboard.press('Escape');
  await expect(menuButton).toHaveAttribute('aria-expanded', 'false');
  await expect(mobileMenu).toHaveAttribute('aria-hidden', 'true');
  await expect(menuButton).toBeFocused();
});

test('desktop: invalid form submission focuses first field and announces error in aria-live', async ({ page, isMobile }) => {
  test.skip(isMobile, 'Desktop-only form validation check');

  await page.goto('/#contacto');

  const form = page.locator('#contact-form');
  await expect(form).toBeVisible();

  await form.locator('button[type="submit"]').click();

  const errorRegion = page.locator('#contact-errors');
  await expect(errorRegion).toHaveAttribute('aria-live', 'assertive');

  await expect
    .poll(async () => ((await errorRegion.textContent()) ?? '').trim().length)
    .toBeGreaterThan(0);

  await expect(page.locator('#name')).toBeFocused();
});
