import test from 'node:test';
import assert from 'node:assert/strict';

import { resolveSeoPage } from '../catalog';
import { buildSeoMeta } from '../metadata';

test('resolveSeoPage usa fallback genérico para página no objetivo', () => {
  const fallback = resolveSeoPage('/ruta-no-objetivo');

  assert.equal(fallback.intent, 'servicio-general-cl');
  assert.equal(fallback.supportIntent, 'desarrollo-web-santiago');
  assert.match(fallback.title, /Desarrollo web en Chile/);
});

test('fallback genérico produce metadata válida sin desplazar intención principal', () => {
  const fallback = resolveSeoPage('/ruta-no-objetivo');
  const result = buildSeoMeta({ ...fallback, pathname: '/ruta-no-objetivo' });

  assert.equal(result.robots, 'index,follow');
  assert.equal(result.canonical, 'https://blazz.cl/ruta-no-objetivo');
  assert.ok(result.fullTitle.length >= 45);
  assert.ok(result.fullTitle.length <= 65);
});
