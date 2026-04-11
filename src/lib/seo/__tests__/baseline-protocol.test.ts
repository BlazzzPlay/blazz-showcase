import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const baselineDocPath = path.join(process.cwd(), 'docs', 'quality', 'seo-baseline-chile.md');

test('baseline D0/protocolo: documento define métricas iniciales y cortes D+30/D+60', () => {
  const content = fs.readFileSync(baselineDocPath, 'utf8');

  assert.match(content, /## Baseline inicial \(D0\)/);
  assert.match(content, /Impresiones orgánicas CL/);
  assert.match(content, /CTR promedio CL/);
  assert.match(content, /Posición promedio CL/);
  assert.match(content, /\| D\+30 \|/);
  assert.match(content, /\| D\+60 \|/);
});

test('baseline D0/protocolo: explicita dependencia de credenciales externas para GSC', () => {
  const content = fs.readFileSync(baselineDocPath, 'utf8');

  assert.match(content, /manual-required \(sin credenciales en repo\)/);
  assert.match(content, /GSC no es automatizable en este entorno/);
});
