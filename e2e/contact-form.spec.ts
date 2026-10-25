import { expect, test, type Page } from '@playwright/test';

const success = { success: true, message: 'Solicitud registrada con éxito. ¡Hablamos pronto!' };
const fields = ['name', 'email', 'subject', 'message'];

async function mockActions(page: Page, options: { delaySave?: boolean; delayTracking?: boolean; rejectTracking?: boolean; failure?: boolean; invalid?: boolean; network?: boolean; malformed?: boolean } = {}) {
  const counts = { saves: 0, responses: 0, tracking: 0, completedTracking: 0 };
  let releaseSave = () => {};
  let releaseTracking = () => {};
  const saveGate = new Promise<void>((resolve) => { releaseSave = resolve; });
  const trackingGate = new Promise<void>((resolve) => { releaseTracking = resolve; });
  await page.route((url) => ['/api/contact', '/api/funnel'].includes(url.pathname), async (route) => {
    expect(route.request().method()).toBe('POST');
    expect(route.request().headers()['content-type']).toBe('application/json');
    expect(route.request().postDataJSON()).toBeTruthy();
    if (new URL(route.request().url()).pathname === '/api/funnel') {
      counts.tracking++;
      if (options.delayTracking) await trackingGate;
      if (options.rejectTracking) await route.abort('failed');
      else await route.fulfill({ contentType: 'application/json', body: JSON.stringify({ success: true }) });
      counts.completedTracking++;
      return;
    }
    counts.saves++;
    if (options.delaySave) await saveGate;
    if (options.network) { await route.abort('failed'); counts.responses++; return; }
    if (options.malformed) {
      await route.fulfill({ contentType: 'application/json', body: '{' });
    } else if (options.invalid) {
      const errors = Object.fromEntries(fields.map((field) => [field, [`Revisa ${field}: faltan datos.`]]));
      await route.fulfill({ status: 400, contentType: 'application/json', body: JSON.stringify({ success: false, message: 'Revisa los campos indicados.', fieldErrors: errors }) });
    } else {
      await route.fulfill({ contentType: 'application/json', body: JSON.stringify(options.failure ? { success: false, message: 'No se pudo guardar: prueba de fallo del servidor.' } : success) });
    }
    counts.responses++;
  });
  return { counts, releaseSave, releaseTracking };
}

async function fill(page: Page) {
  await page.locator('#name').fill('Persona de prueba');
  await page.locator('#email').fill('test@example.invalid');
  await page.locator('#subject').fill('Proyecto de prueba');
  await page.locator('#message').fill('Una idea suficientemente detallada.');
}

async function open(page: Page) {
  await page.goto('/#contacto');
  await page.locator('#contact-form').scrollIntoViewIfNeeded();
}

for (const reducedMotion of [false, true]) {
  test(`idle and accessible pending, duplicate guard, reduced motion=${reducedMotion}`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion: reducedMotion ? 'reduce' : 'no-preference' });
    const mock = await mockActions(page, { delaySave: true });
    await open(page);
    const button = page.locator('#contact-form button');
    await expect(page.locator('.btn-spinner')).toBeHidden();
    await fill(page);
    await button.click();
    await expect.poll(() => mock.counts.saves).toBe(1);
    await expect(button).toBeDisabled();
    await expect(page.locator('#contact-form')).toHaveAttribute('aria-busy', 'true');
    await expect(button).toHaveAccessibleName('Registrando solicitud…');
    await expect(button.locator('.btn-text')).toBeVisible();
    await expect(button.locator('.btn-text')).toHaveText('Registrando solicitud…');
    await expect(page.locator('#contact-status')).toHaveText('Registrando solicitud…');
    if (reducedMotion) await expect(page.locator('.btn-spinner')).toBeHidden();
    else await expect(page.locator('.btn-spinner')).toBeVisible();
    await page.locator('#contact-form').evaluate((form: HTMLFormElement) => form.requestSubmit());
    expect(mock.counts.saves).toBe(1);
    mock.releaseSave();
    await expect(button).toBeEnabled();
    await expect(button).toHaveAccessibleName('Registrar Solicitud');
    await expect(page.locator('#contact-form')).toHaveAttribute('aria-busy', 'false');
    await expect(page.locator('#name')).toHaveValue('');
    expect(mock.counts.responses).toBe(1);
    expect(mock.counts.saves).toBe(1);
  });
}

test('successful save resets immediately while analytics remains unresolved', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  const mock = await mockActions(page, { delayTracking: true, rejectTracking: true });
  await open(page);
  await fill(page);
  await page.locator('#contact-form button').click();
  await expect.poll(() => mock.counts.responses).toBe(1);
  await expect(page.locator('#contact-status')).toHaveText(success.message);
  await expect(page.locator('#contact-form button')).toBeEnabled();
  await expect(page.locator('#name')).toHaveValue('');
  expect(mock.counts.tracking).toBeGreaterThan(0);
  expect(mock.counts.completedTracking).toBe(0);
  mock.releaseTracking();
  await expect.poll(() => mock.counts.completedTracking).toBe(mock.counts.tracking);
  await expect(page.locator('#contact-status')).toHaveText(success.message);
  expect(errors).toEqual([]);
});

test('field errors persist, associate descriptions, preserve input and focus first invalid', async ({ page }) => {
  const options = { invalid: true };
  const mock = await mockActions(page, options);
  await open(page);
  await fill(page);
  await page.locator('#message').press('Tab');
  await page.keyboard.press('Enter');
  await expect.poll(() => mock.counts.responses).toBe(1);
  await expect(page.locator('#name')).toBeFocused();
  expect(await page.locator('#name').evaluate((el) => getComputedStyle(el).outlineWidth)).toBe('3px');
  for (const field of fields) {
    await expect(page.locator(`#${field}`)).toHaveAttribute('aria-invalid', 'true');
    await expect(page.locator(`#${field}`)).toHaveAttribute('aria-describedby', `contact-help${field === 'email' ? '' : ` ${field}-hint`} ${field}-error`);
    await expect(page.locator(`#${field}-error`)).toBeVisible();
    await expect(page.locator(`#${field}-error`)).toHaveText(`Revisa ${field}: faltan datos.`);
  }
  await expect(page.locator('#contact-errors')).not.toBeEmpty();
  await expect(page.locator('#name')).toHaveValue('Persona de prueba');
  await expect(page.locator('#message')).toHaveValue('Una idea suficientemente detallada.');
  await page.locator('#name').fill('Nombre corregido');
  await expect(page.locator('#email-error')).toBeVisible();
  expect(mock.counts.saves).toBe(1);
  for (const [field, minimum, maximum] of [['name', '2', '100'], ['subject', '3', '200'], ['message', '10', '4000']]) {
    await expect(page.locator(`#${field}`)).toHaveAttribute('minlength', minimum);
    await expect(page.locator(`#${field}`)).toHaveAttribute('maxlength', maximum);
    await expect(page.locator(`#${field}-hint`)).toHaveText(`Entre ${minimum} y ${maximum} caracteres.`);
  }
  options.invalid = false;
  await page.locator('#contact-form button').click();
  await expect.poll(() => mock.counts.responses).toBe(2);
  for (const field of fields) {
    await expect(page.locator(`#${field}`)).toHaveAttribute('aria-invalid', 'false');
    await expect(page.locator(`#${field}-error`)).toBeHidden();
  }
  await expect(page.locator('#name')).toHaveValue('');
});

for (const kind of ['server', 'network', 'malformed'] as const) {
  test(`failure retains input and restores controls: ${kind}`, async ({ page }) => {
    const mock = await mockActions(page, { failure: true, network: kind === 'network', malformed: kind === 'malformed' });
    await open(page);
    await fill(page);
    await page.locator('#contact-form button').click();
    await expect.poll(() => mock.counts.responses).toBe(1);
    await expect(page.locator('#contact-errors')).toHaveText(kind !== 'server' ? 'Error crítico en el servidor.' : 'No se pudo guardar: prueba de fallo del servidor.');
    await expect(page.locator('#contact-form button')).toBeEnabled();
    await expect(page.locator('.btn-spinner')).toBeHidden();
    await expect(page.locator('#message')).toHaveValue('Una idea suficientemente detallada.');
  });
}

for (const width of [320, 390, 768, 769, 1280]) {
  test(`scalable fields and unclipped form at ${width}px`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width, height: 900 });
    await mockActions(page);
    await open(page);
    const viewport = page.locator('meta[name="viewport"]');
    expect(await viewport.getAttribute('content')).not.toMatch(/user-scalable\s*=\s*no|maximum-scale\s*=\s*1/);
    for (const enlarged of [false, true]) {
      if (enlarged) await page.addStyleTag({ content: 'html { font-size: 125% !important; }' });
      for (const field of fields) {
        const metrics = await page.locator(`#${field}`).evaluate((element) => ({ size: parseFloat(getComputedStyle(element).fontSize), left: element.getBoundingClientRect().left, right: element.getBoundingClientRect().right, scroll: element.scrollWidth, client: element.clientWidth }));
        expect(metrics.size).toBeGreaterThanOrEqual(enlarged ? 20 : 16);
        expect(metrics.left).toBeGreaterThanOrEqual(0);
        expect(metrics.right).toBeLessThanOrEqual(width);
        expect(metrics.scroll).toBeLessThanOrEqual(metrics.client + 1);
      }
      expect(await page.locator('#contact-form').evaluate((el) => el.scrollWidth <= el.clientWidth + 1)).toBe(true);
    }
    if ([320, 390, 1280].includes(width)) await page.locator('.contact-content').screenshot({ path: testInfo.outputPath(`contact-${width}-enlarged.png`) });
  });
}
