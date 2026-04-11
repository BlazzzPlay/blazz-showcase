import test from 'node:test';
import assert from 'node:assert/strict';

import { evaluateSeoTechnicalAudit } from '../audit';

test('validación técnica continua: pasa cuando Lighthouse y indexación cumplen umbral', () => {
  const result = evaluateSeoTechnicalAudit({
    lighthouseMobileSeo: 95,
    lighthouseDesktopSeo: 97,
    privateUrlsIndexed: 0,
  });

  assert.equal(result.compliant, true);
  assert.equal(result.correctiveAction, 'none');
  assert.deepEqual(result.breaches, []);
});

test('validación técnica continua: marca incumplimiento y acción correctiva', () => {
  const result = evaluateSeoTechnicalAudit({
    lighthouseMobileSeo: 92,
    lighthouseDesktopSeo: 94,
    privateUrlsIndexed: 1,
  });

  assert.equal(result.compliant, false);
  assert.equal(result.correctiveAction, 'open-corrective-action');
  assert.equal(result.breaches.length, 3);
});
