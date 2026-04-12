import test from 'node:test';
import assert from 'node:assert/strict';

import {
  evaluateSeoAuditFromReports,
  defaultSeoAuditTargets,
  parseSeoArtifactFilename,
  pickLatestArtifactsByTarget,
  scoreFromLighthouseSeo,
} from '../lighthouse-audit';

test('scoreFromLighthouseSeo: convierte score decimal a escala 0-100', () => {
  const score = scoreFromLighthouseSeo({ categories: { seo: { score: 0.92 } } });
  assert.equal(score, 92);
});

test('parseSeoArtifactFilename: reconoce artifact versionado por fecha/url/perfil', () => {
  const parsed = parseSeoArtifactFilename('2026-04-11-home-mobile.json');
  assert.deepEqual(parsed, {
    date: '2026-04-11',
    filename: '2026-04-11-home-mobile.json',
    profile: 'mobile',
  });
});

test('pickLatestArtifactsByTarget: toma artifact más reciente por URL y perfil', () => {
  const selected = pickLatestArtifactsByTarget([
    '2026-04-10-home-mobile.json',
    '2026-04-11-home-mobile.json',
    '2026-04-09-home-desktop.json',
    '2026-04-11-home-desktop.json',
    '2026-04-11-servicios-mobile.json',
    '2026-04-11-servicios-desktop.json',
    '2026-04-11-portfolio-mobile.json',
    '2026-04-11-portfolio-desktop.json',
    '2026-04-11-contacto-mobile.json',
    '2026-04-11-contacto-desktop.json',
    'before-mobile.json',
  ]);

  assert.equal(selected.home.mobile, '2026-04-11-home-mobile.json');
  assert.equal(selected.home.desktop, '2026-04-11-home-desktop.json');
});

test('evaluateSeoAuditFromReports: marca incumplimientos por umbral y privacidad', () => {
  const result = evaluateSeoAuditFromReports({
    threshold: 95,
    privateUrlsIndexed: 1,
    reportsBySlug: {
      home: {
        mobile: { categories: { seo: { score: 0.92 } } },
        desktop: { categories: { seo: { score: 0.96 } } },
        artifacts: {
          mobile: '2026-04-11-home-mobile.json',
          desktop: '2026-04-11-home-desktop.json',
        },
      },
      servicios: {
        mobile: { categories: { seo: { score: 0.95 } } },
        desktop: { categories: { seo: { score: 0.95 } } },
      },
      portfolio: {
        mobile: { categories: { seo: { score: 0.95 } } },
        desktop: { categories: { seo: { score: 0.95 } } },
      },
      contacto: {
        mobile: { categories: { seo: { score: 0.95 } } },
        desktop: { categories: { seo: { score: 0.95 } } },
      },
    },
  });

  assert.equal(result.compliant, false);
  assert.equal(result.correctiveAction, 'open-corrective-action');
  assert.ok(result.breaches.includes('/ mobile SEO 92 < 95'));
  assert.ok(result.breaches.includes('URLs privadas indexadas detectadas: 1'));
});

test('evaluateSeoAuditFromReports: cumple cuando todos los scores están en umbral y sin indexación privada', () => {
  const reportsBySlug = Object.fromEntries(
    defaultSeoAuditTargets.map((target) => [
      target.slug,
      {
        mobile: { categories: { seo: { score: 0.95 } } },
        desktop: { categories: { seo: { score: 0.96 } } },
      },
    ]),
  );

  const result = evaluateSeoAuditFromReports({
    threshold: 95,
    privateUrlsIndexed: 0,
    reportsBySlug,
  });

  assert.equal(result.compliant, true);
  assert.equal(result.correctiveAction, 'none');
  assert.equal(result.breaches.length, 0);
  assert.equal(result.averageMobileSeo, 95);
  assert.equal(result.averageDesktopSeo, 96);
});
