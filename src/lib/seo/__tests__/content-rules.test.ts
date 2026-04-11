import test from 'node:test';
import assert from 'node:assert/strict';

import { validateSeoCopyRules } from '../content-rules';

test('validateSeoCopyRules acepta copy natural con intención principal y apoyo', () => {
  const result = validateSeoCopyRules({
    pathname: '/portfolio',
    title: 'Portfolio real de proyectos SaaS y EdTech para Chile',
    description:
      'Revisá casos de proyectos SaaS y EdTech construidos en Chile, con enfoque en producto, performance y mejoras concretas para cada cliente.',
    intent: 'portfolio-credibilidad-cl',
    supportIntent: 'servicio-general-cl',
    cityMention: 'Santiago',
  });

  assert.equal(result.ok, true);
  assert.deepEqual(result.reasons, []);
});

test('validateSeoCopyRules rechaza supportIntent igual al intent principal', () => {
  const result = validateSeoCopyRules({
    pathname: '/servicios',
    title: 'Servicios de desarrollo web y arquitectura en Santiago',
    description:
      'Servicios de desarrollo web y automatización para negocios en Santiago, pensados para escalar sin fricción operativa.',
    intent: 'desarrollo-web-santiago',
    supportIntent: 'desarrollo-web-santiago',
  });

  assert.equal(result.ok, false);
  assert.ok(result.reasons.some((reason) => reason.includes('supportIntent')));
});

test('validateSeoCopyRules rechaza más de una mención de ciudad por campo', () => {
  const result = validateSeoCopyRules({
    pathname: '/contacto',
    title: 'Contacto en Santiago para iniciar tu proyecto en Santiago',
    description:
      'Contactá a Fabian Mendoza para planificar tu próximo proyecto digital en Chile con claridad técnica y roadmap realista.',
    intent: 'contacto-conversion-cl',
    supportIntent: 'servicio-general-cl',
  });

  assert.equal(result.ok, false);
  assert.ok(result.reasons.some((reason) => reason.includes('ciudad')));
});

test('validateSeoCopyRules rechaza repeticiones artificiales de keyword', () => {
  const result = validateSeoCopyRules({
    pathname: '/servicios',
    title: 'Desarrollo web desarrollo web desarrollo web en Chile',
    description:
      'Desarrollo web para equipos en Chile con desarrollo web repetido desarrollo web para comprobar validación.',
    intent: 'desarrollo-web-santiago',
    supportIntent: 'servicio-general-cl',
  });

  assert.equal(result.ok, false);
  assert.ok(result.reasons.some((reason) => reason.includes('keyword stuffing')));
});
