import test from 'node:test';
import assert from 'node:assert/strict';

import { buildSeoMeta } from '../metadata';

test('buildSeoMeta genera canonical absoluto y robots indexable por defecto', () => {
  const result = buildSeoMeta({
    pathname: '/servicios',
    title: 'Servicios web y arquitectura en Santiago',
    description:
      'Servicios de desarrollo web, arquitectura y automatización para negocios en Santiago, diseñados para escalar sin deuda técnica innecesaria.',
    intent: 'desarrollo-web-santiago',
    supportIntent: 'servicio-general-cl',
    cityMention: 'Santiago',
  });

  assert.equal(result.canonical, 'https://blazz.cl/servicios');
  assert.equal(result.robots, 'index,follow');
  assert.ok(result.fullTitle.includes('Fabian Mendoza · Blazz'));
  assert.ok(result.fullTitle.length >= 45);
  assert.ok(result.fullTitle.length <= 65);
  assert.equal(result.og.url, 'https://blazz.cl/servicios');
});

test('buildSeoMeta aplica noindex,nofollow cuando indexable=false', () => {
  const result = buildSeoMeta({
    pathname: '/admin',
    title: 'Panel interno de administración',
    description: 'Panel privado para revisar solicitudes internas del sitio. Ruta no indexable para buscadores públicos.',
    indexable: false,
    intent: 'admin-privado-cl',
    supportIntent: 'servicio-general-cl',
  });

  assert.equal(result.robots, 'noindex,nofollow');
  assert.equal(result.canonical, 'https://blazz.cl/admin');
});

test('buildSeoMeta rechaza metadata con stuffing y repeticiones artificiales', () => {
  assert.throws(
    () =>
      buildSeoMeta({
        pathname: '/servicios',
        title: 'desarrollo desarrollo desarrollo desarrollo en Santiago',
        description:
          'desarrollo desarrollo desarrollo desarrollo desarrollo en Santiago para proyectos desarrollo desarrollo.',
        intent: 'desarrollo-web-santiago',
        supportIntent: 'servicio-general-cl',
      }),
    /SEO metadata inválida/,
  );
});

test('buildSeoMeta rechaza title final fuera de rango en páginas indexables', () => {
  assert.throws(
    () =>
      buildSeoMeta({
        pathname: '/servicios',
        title: 'Servicios de desarrollo web y arquitectura para empresas en Santiago con enfoque de crecimiento',
        description:
          'Servicios de desarrollo web, arquitectura y automatización para negocios en Santiago, diseñados para escalar sin deuda técnica innecesaria.',
        intent: 'desarrollo-web-santiago',
        supportIntent: 'servicio-general-cl',
        cityMention: 'Santiago',
      }),
    /title final fuera de rango/,
  );
});
