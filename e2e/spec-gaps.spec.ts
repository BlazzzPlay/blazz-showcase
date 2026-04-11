import path from 'node:path';
import { createClient } from '@libsql/client';
import { expect, test } from '@playwright/test';

const dbPath = process.env.DB_PATH || path.join(process.cwd(), 'data', 'sqlite.db');
const db = createClient({ url: `file:${dbPath}` });

async function getSessionEvents(sessionId: string) {
  let lastError: unknown;

  for (let attempt = 0; attempt < 5; attempt += 1) {
    try {
      const result = await db.execute({
        sql: 'SELECT event, COUNT(*) AS total FROM contact_funnel_events WHERE session_id = ? GROUP BY event',
        args: [sessionId],
      });

      const counts = new Map<string, number>();
      for (const row of result.rows) {
        counts.set(String(row.event), Number(row.total));
      }

      return counts;
    } catch (error) {
      lastError = error;
      const message = String(error);
      if (!message.includes('SQLITE_BUSY')) throw error;
      await new Promise((resolve) => setTimeout(resolve, 120 * (attempt + 1)));
    }
  }

  throw lastError;
}

test('desktop: keyboard E2E completes CTA -> form_start -> submit_success funnel', async ({ page, isMobile }) => {
  test.skip(isMobile, 'Desktop-only full keyboard funnel flow');

  const sessionId = `sess_e2e_full_${Date.now()}`;
  await page.addInitScript((id) => {
    window.sessionStorage.setItem('portfolio_session_id', id);
  }, sessionId);

  await page.goto('/');

  // Tab through nav links until desktop CTA, then activate with keyboard.
  for (let i = 0; i < 5; i += 1) {
    await page.keyboard.press('Tab');
  }

  const navCta = page.locator('.nav-action a.d-none-mobile');
  await expect(navCta).toBeFocused();
  await page.keyboard.press('Enter');
  await expect.poll(() => new URL(page.url()).hash).toBe('#contacto');

  const nameInput = page.locator('#name');
  const emailInput = page.locator('#email');
  const subjectInput = page.locator('#subject');
  const messageInput = page.locator('#message');
  const submitButton = page.locator('#contact-form button[type="submit"]');

  await page.keyboard.press('Tab');
  await expect(nameInput).toBeFocused();
  await page.keyboard.type('Usuario QA');

  await page.keyboard.press('Tab');
  await expect(emailInput).toBeFocused();
  await page.keyboard.type('qa@example.com');

  await page.keyboard.press('Tab');
  await expect(subjectInput).toBeFocused();
  await page.keyboard.type('Validacion funnel desktop');

  await page.keyboard.press('Tab');
  await expect(messageInput).toBeFocused();
  await page.keyboard.type('Este flujo valida teclado completo y submit exitoso.');

  await page.keyboard.press('Tab');
  await expect(submitButton).toBeFocused();
  await page.keyboard.press('Enter');

  const statusRegion = page.locator('#contact-status');
  await expect
    .poll(async () => ((await statusRegion.textContent()) ?? '').trim())
    .toContain('Solicitud registrada con éxito');

  await expect
    .poll(async () => {
      const events = await getSessionEvents(sessionId);
      return {
        cta: events.get('cta_click') ?? 0,
        start: events.get('form_start') ?? 0,
        success: events.get('form_submit_success') ?? 0,
      };
    })
    .toEqual({ cta: 1, start: 1, success: 1 });
});

test('desktop: abandonment keeps conversion at zero after form_start', async ({ page, isMobile }) => {
  test.skip(isMobile, 'Desktop-only abandonment funnel evidence');

  const sessionId = `sess_e2e_drop_${Date.now()}`;
  await page.addInitScript((id) => {
    window.sessionStorage.setItem('portfolio_session_id', id);
  }, sessionId);

  await page.goto('/');

  const heroCta = page.locator('[data-track-cta="hero"]');
  await heroCta.click();
  await expect.poll(() => new URL(page.url()).hash).toBe('#contacto');

  await page.locator('#name').focus();

  await expect
    .poll(async () => {
      const events = await getSessionEvents(sessionId);
      return {
        cta: events.get('cta_click') ?? 0,
        start: events.get('form_start') ?? 0,
        success: events.get('form_submit_success') ?? 0,
      };
    })
    .toEqual({ cta: 1, start: 1, success: 0 });
});

test('all viewports: prefers-reduced-motion disables non-critical motion safely', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');

  const fadeUpSection = page.locator('[data-animate="fade-up"]').first();
  await expect(fadeUpSection).toHaveClass(/is-visible/);

  const reducedMotionStyles = await page.evaluate(() => {
    const html = document.documentElement;
    const animated = document.querySelector('[data-animate="fade-up"]') as HTMLElement | null;
    if (!animated) return null;

    const htmlStyles = window.getComputedStyle(html);
    const animatedStyles = window.getComputedStyle(animated);
    return {
      scrollBehavior: htmlStyles.scrollBehavior,
      animationDuration: animatedStyles.animationDuration,
      transitionDuration: animatedStyles.transitionDuration,
    };
  });

  expect(reducedMotionStyles).not.toBeNull();
  expect(reducedMotionStyles?.scrollBehavior).toBe('auto');

  const animationDurationMs = Number.parseFloat(reducedMotionStyles?.animationDuration ?? '1');
  const transitionDurationMs = Number.parseFloat(reducedMotionStyles?.transitionDuration ?? '1');
  expect(animationDurationMs).toBeLessThanOrEqual(0.01);
  expect(transitionDurationMs).toBeLessThanOrEqual(0.01);
});

test('desktop and mobile: hero value proposition and primary CTA are clear and visible', async ({ page }) => {
  await page.goto('/');

  const title = page.locator('.hero-title');
  const description = page.locator('.hero-description');
  const primaryCta = page.locator('[data-track-cta="hero"]');

  await expect(title).toBeVisible();
  await expect(description).toBeVisible();
  await expect(primaryCta).toBeVisible();

  await expect(title).toContainText('Desarrollo SaaS & EdTech');
  await expect(description).toContainText('productos digitales usables y escalables');
  await expect(primaryCta).toHaveText('Iniciar Proyecto');

  const ctaBox = await primaryCta.boundingBox();
  expect(ctaBox).not.toBeNull();
  expect((ctaBox?.width ?? 0) > 100).toBeTruthy();
  expect((ctaBox?.height ?? 0) > 30).toBeTruthy();
});

test('all viewports: contact form fields expose accessible names for screen readers', async ({ page }) => {
  await page.goto('/#contacto');

  await expect(page.getByLabel('Nombre')).toBeVisible();
  await expect(page.getByLabel('Email')).toBeVisible();
  await expect(page.getByLabel('Asunto')).toBeVisible();
  await expect(page.getByLabel('Mensaje')).toBeVisible();
});
