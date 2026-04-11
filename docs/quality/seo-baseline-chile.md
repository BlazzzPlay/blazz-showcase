# SEO Baseline Chile — mejora-seo

## Objetivo
Dejar una línea base técnica y de negocio para medir impacto SEO local (Chile) a 30 y 60 días, evitando decisiones por intuición.

## URLs objetivo
- `/`
- `/servicios`
- `/portfolio`
- `/contacto`

## Baseline inicial (D0)

### 1) Google Search Console (país Chile)
Registrar una captura con filtros por país **Chile** para queries de intención objetivo.

| Métrica | Valor D0 | Fuente |
|---|---:|---|
| Impresiones orgánicas CL (últimos 28 días) | manual-required (sin credenciales en repo) | GSC > Rendimiento |
| CTR promedio CL | manual-required (sin credenciales en repo) | GSC > Rendimiento |
| Posición promedio CL | manual-required (sin credenciales en repo) | GSC > Rendimiento |

Queries sugeridas para seguimiento:
- desarrollo web chile
- desarrollo web santiago
- portfolio desarrollo web chile
- contacto desarrollo web chile

> Nota: GSC no es automatizable en este entorno del repo sin credenciales externas. Se deja protocolo reproducible abajo.

### 2) Lighthouse SEO
Target: **SEO >=95** en mobile y desktop para cada URL objetivo.

| URL | Mobile SEO | Desktop SEO | Estado |
|---|---:|---:|---|
| `/` | 92 (run local 2026-04-11) | 92 (run local 2026-04-11) | ⚠️ bajo target 95 |
| `/servicios` | 92 (run local 2026-04-11) | 92 (run local 2026-04-11) | ⚠️ bajo target 95 |
| `/portfolio` | 92 (run local 2026-04-11) | 92 (run local 2026-04-11) | ⚠️ bajo target 95 |
| `/contacto` | 92 (run local 2026-04-11) | 92 (run local 2026-04-11) | ⚠️ bajo target 95 |

Artifacts D0 (versionados):
- `docs/quality/lighthouse/2026-04-11-home-mobile.json`
- `docs/quality/lighthouse/2026-04-11-home-desktop.json`
- `docs/quality/lighthouse/2026-04-11-servicios-mobile.json`
- `docs/quality/lighthouse/2026-04-11-servicios-desktop.json`
- `docs/quality/lighthouse/2026-04-11-portfolio-mobile.json`
- `docs/quality/lighthouse/2026-04-11-portfolio-desktop.json`
- `docs/quality/lighthouse/2026-04-11-contacto-mobile.json`
- `docs/quality/lighthouse/2026-04-11-contacto-desktop.json`

### 3) Indexación privada
Target: **0 URLs privadas indexadas**.

Checklist:
- `/admin` responde `meta robots=noindex,nofollow` ✅ (cubierto por `e2e/seo-foundation.spec.ts`)
- no incluir rutas privadas en sitemap público ✅ (verificar en cada release)

## Protocolo reproducible 30/60 días

### Corte D+30 y D+60
Repetir exactamente el mismo procedimiento y completar tabla comparativa:

| Corte | Impresiones CL | CTR CL | Posición CL | URLs privadas indexadas | Lighthouse SEO (promedio 4 URLs) |
|---|---:|---:|---:|---:|---:|
| D0 | manual-required | manual-required | manual-required | 0 | 92 |
| D+30 | _pendiente_ | _pendiente_ | _pendiente_ | _pendiente_ | _pendiente_ |
| D+60 | _pendiente_ | _pendiente_ | _pendiente_ | _pendiente_ | _pendiente_ |

### Pasos exactos
1. Levantar sitio local: `npm run dev -- --host 127.0.0.1 --port 4321`
2. Ejecutar tests SEO mínimos:
   - `npm run test:unit`
   - `npm run test:e2e -- e2e/seo-foundation.spec.ts`
3. Lighthouse por URL (mobile + desktop) y registrar scores SEO.
4. En GSC, aplicar filtro país Chile + mismas queries base y copiar métricas.
5. Registrar resultados en este documento sin cambiar queries ni ventana temporal.

## Criterios de alerta
- Lighthouse SEO <95 en cualquier URL objetivo.
- Deterioro sostenido de CTR o posición en D+30 y D+60 sin cambios de mercado justificados.
- Cualquier ruta privada indexable detectada.

## Validación técnica continua (evidencia automatizada)

Para evaluar el escenario de auditoría periódica se usa una regla explícita de compliance en `src/lib/seo/audit.ts`:

- `mobile < 95` o `desktop < 95` => incumplimiento.
- `privateUrlsIndexed > 0` => incumplimiento.
- Ante cualquier incumplimiento el resultado exige `open-corrective-action`.

Evidencia ejecutable en repo:
- `src/lib/seo/__tests__/audit.test.ts` (caso compliant + caso incumplimiento con acción correctiva)
- `src/lib/seo/__tests__/baseline-protocol.test.ts` (presencia de baseline D0 y protocolo D+30/D+60 en este documento)

## Evidencia técnica en repo
- `src/pages/servicios.astro`
- `src/pages/portfolio.astro`
- `src/pages/contacto.astro`
- `src/lib/seo/__tests__/metadata.test.ts`
- `src/lib/seo/__tests__/content-rules.test.ts`
- `e2e/seo-foundation.spec.ts`
