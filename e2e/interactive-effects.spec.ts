import { test, expect } from '@playwright/test';

const hiddenCount = (_: string) => (sel: string) =>
  [...document.querySelectorAll(sel)].filter((e) => getComputedStyle(e).opacity !== '1').length;

test('dot field renders, reacts to the pointer and idles; reveal shows all content', async ({ page, isMobile }) => {
  await page.addInitScript(() => {
    (window as any).__raf = 0;
    const original = window.requestAnimationFrame.bind(window);
    window.requestAnimationFrame = (f) => {
      (window as any).__raf++;
      return original(f);
    };
  });
  await page.goto('/');
  await page.waitForSelector('.dot-field.is-ready');

  const signature = () =>
    page.evaluate(() => {
      const c = document.querySelector<HTMLCanvasElement>('.dot-field')!;
      const d = c.getContext('2d')!.getImageData(0, 0, c.width, c.height).data;
      let h = 0;
      for (let i = 0; i < d.length; i += 4) h = (h * 31 + d[i] + d[i + 3]) | 0;
      return h;
    });

  if (!isMobile) {
    const before = await signature();
    await page.mouse.move(400, 300, { steps: 5 });
    await page.waitForTimeout(300);
    expect(await signature()).not.toBe(before);

    // Pointer resting on the page: the loop must go to sleep once the dots settle.
    await page.waitForTimeout(2000);
    const a = await page.evaluate(() => (window as any).__raf);
    await page.waitForTimeout(1000);
    expect((await page.evaluate(() => (window as any).__raf)) - a).toBeLessThan(5);
  }

  for (let y = 0; y < 6000; y += 300) {
    await page.mouse.wheel(0, 300);
    await page.waitForTimeout(60);
  }
  await page.waitForTimeout(1500);
  // Reveal replays on every entry, so only content currently on screen must be fully shown.
  const hiddenInView = await page.evaluate(() =>
    [...document.querySelectorAll('[data-reveal], [data-animate]')].filter((e) => {
      const r = e.getBoundingClientRect();
      return r.top >= 0 && r.bottom <= innerHeight && getComputedStyle(e).opacity !== '1';
    }).length,
  );
  expect(hiddenInView).toBe(0);
});

test.describe('reduced motion', () => {
  test.use({ reducedMotion: 'reduce' });

  test('content is visible without reveal animation and cards keep their hover styles', async ({ page }) => {
    await page.goto('/');
    // The hero keeps its own pre-existing entrance (delays up to 0.6s); wait for it to settle.
    await page.waitForTimeout(1000);
    expect(await page.evaluate(hiddenCount(''), '.project-card, .about-text > *, .hero-text > *')).toBe(0);
    expect(await page.locator('[data-reveal]').count()).toBe(0);
  });
});

test('reveal replays: content hides when it leaves the viewport and animates again on return', async ({ page }) => {
  await page.goto('/');
  const card = page.locator('.project-card').first();
  const opacity = () => card.evaluate((e) => getComputedStyle(e).opacity);

  await card.scrollIntoViewIfNeeded();
  await expect.poll(opacity, { timeout: 3000 }).toBe('1');

  await page.evaluate(() => window.scrollTo(0, 0));
  await expect.poll(opacity, { timeout: 3000 }).not.toBe('1');

  await card.scrollIntoViewIfNeeded();
  await expect.poll(opacity, { timeout: 3000 }).toBe('1');
});

test('click on empty background plays one subtle sound; clicks on controls stay silent', async ({ page, isMobile }) => {
  test.skip(isMobile, 'Dot field interaction needs a fine pointer');
  await page.addInitScript(() => {
    (window as any).__tones = 0;
    const Real = window.AudioContext;
    window.AudioContext = class extends Real {
      createOscillator() {
        const osc = super.createOscillator();
        const start = osc.start.bind(osc);
        osc.start = (...a: any[]) => { (window as any).__tones++; return start(...a); };
        return osc;
      }
    } as typeof AudioContext;
  });
  await page.goto('/');
  await page.waitForSelector('.dot-field.is-ready');

  await page.mouse.click(1380, 600);
  await expect.poll(() => page.evaluate(() => (window as any).__tones)).toBe(1);

  await page.locator('.nav-links a').first().click();
  await page.waitForTimeout(300);
  expect(await page.evaluate(() => (window as any).__tones)).toBe(1);
});
