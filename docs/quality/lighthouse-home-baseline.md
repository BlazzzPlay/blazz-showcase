# Lighthouse Home Baseline — mejora-portafolio

## Contexto
- URL evaluada: `/`
- Entorno sugerido: producción local equivalente (`npm run dev` o deploy preview estable)
- Fecha de registro inicial: 2026-04-11

## Before vs After

| Run | Fecha | Entorno | Accessibility | Performance | Observaciones |
|---|---|---|---:|---:|---|
| Before (desktop) | 2026-04-11 | Local dev (`astro dev`, Chromium Playwright, LH preset desktop) | **96** | **95** | `docs/quality/lighthouse/before-desktop.json` |
| Before (mobile) | 2026-04-11 | Local dev (`astro dev`, Chromium Playwright, LH mobile default) | **96** | **65** | `docs/quality/lighthouse/before-mobile.json` |
| After (desktop) | 2026-04-11 | Local dev (`astro dev`, Chromium Playwright, LH preset desktop) | **96** | **95** | `docs/quality/lighthouse/after-desktop.json` |
| After (mobile) | 2026-04-11 | Local dev (`astro dev`, Chromium Playwright, LH mobile default) | **96** | **70** | `docs/quality/lighthouse/after-mobile.json` |

### Lectura rápida
- Target de Accessibility (**>=95**) en home: **cumplido** en desktop y mobile.
- Performance desktop se mantiene (95→95) y mobile mejora en esta corrida (65→70).
- No hubo regresión de Accessibility entre before/after.

## Objetivo
- Accessibility home: **>= 95**

## Checklist manual de verificación UX/A11y
- [x] Navegación completa por teclado: nav → CTA → formulario. **Estado:** `covered` por E2E Playwright (`e2e/a11y-operable.spec.ts`).
- [x] Menú mobile operable por teclado (abrir/cerrar, Escape, foco visible y cíclico). **Estado:** `covered` por E2E Playwright (`e2e/a11y-operable.spec.ts`).
- [x] Inputs y errores del formulario anunciables por lector (aria-live + labels). **Estado:** `covered` por E2E Playwright validando `aria-live` + foco al primer error.

### Evidencia automatizada E2E (Playwright)
- Cobertura implementada en `e2e/a11y-operable.spec.ts`:
  1. Desktop: orden de tab en navegación principal + foco visible + activación de CTA por teclado.
  2. Mobile: apertura/cierre del menú por teclado, `Escape`, foco inicial y retorno de foco al botón.
  3. Formulario: envío inválido enfoca el primer error (`#name`) y publica error en región `aria-live`.
- Cobertura adicional de gaps en `e2e/spec-gaps.spec.ts`:
  1. Flujo teclado E2E completo desktop: `cta_click -> form_start -> form_submit_success` validado en DB.
  2. Escenario de abandono: `cta_click + form_start` sin `form_submit_success`.
  3. `prefers-reduced-motion`: motion no crítico desactivado y contenido usable sin animaciones.
  4. Claridad de CTA/propuesta de valor en desktop/mobile (visibilidad + copy clave).
  5. Labels accesibles del formulario (`getByLabel`) para soporte lector.
- Configuración reproducible: `playwright.config.ts` (proyecto desktop + mobile, webServer local auto).

### Cómo correr E2E en local
1. Instalar dependencias: `npm ci`
2. Instalar navegador Playwright: `npx playwright install chromium`
3. Ejecutar suite: `npm run test:e2e`
4. Ver reporte HTML: `npm run test:e2e:report`

### Gate automatizado de performance (Web Vitals + TTI sobre artifacts)
- Script reproducible: `npm run quality:assert-lighthouse`
- Fuente de verdad: `docs/quality/lighthouse/before-*.json` y `docs/quality/lighthouse/after-*.json`
- Aserciones actuales:
  - score after >= score before (performance + accessibility)
  - score mínimo: desktop perf >= 0.90, mobile perf >= 0.70, accessibility >= 0.95
  - métricas explícitas en after: TTI, LCP, CLS, TBT bajo umbrales por perfil (desktop/mobile)
- Objetivo: evitar depender sólo del score agregado y dejar un check técnico repetible para interacción inicial.

### CI-light (si aplica)
- Workflow: `.github/workflows/e2e-light.yml`
- Ejecuta en PR/manual:
  - `npm ci`
  - `npx playwright install --with-deps chromium`
  - `npm run test:e2e -- --reporter=line`
  - publica artifact `playwright-report`

## Baseline Lighthouse reproducible (ejecutado)

Artifacts generados:
- `docs/quality/lighthouse/before-desktop.json`
- `docs/quality/lighthouse/before-mobile.json`
- `docs/quality/lighthouse/after-desktop.json`
- `docs/quality/lighthouse/after-mobile.json`

### Protocolo exacto
1. Levantar server local:
   - `npm run dev -- --host 127.0.0.1 --port 4321`
2. Resolver binario Chromium de Playwright:
   - `node --input-type=module -e "import { chromium } from 'playwright'; console.log(chromium.executablePath())"`
3. Ejecutar Lighthouse (ejemplo desktop):
   - `CHROME_PATH="<ruta-chromium>" npx -y lighthouse@12.6.0 "http://127.0.0.1:4321/" --quiet --chrome-flags="--headless=new --no-sandbox" --only-categories=accessibility,performance --preset=desktop --output=json --output-path="docs/quality/lighthouse/before-desktop.json"`
4. Repetir para `before-mobile`, `after-desktop`, `after-mobile`.
5. Extraer scores desde JSON y registrar en tabla before/after.

### Notas de ejecución verificables
- Durante corridas Lighthouse pueden aparecer warnings no bloqueantes de sourcemaps (`Failed to parse source map ... sourceURL`) provenientes de bundles de dependencias.
- Estos warnings **no impidieron** generar JSON de salida ni obtener categorías `accessibility/performance`.

### Protocolo manual reproducible (complementario)
1. Levantar app: `npm run dev -- --host 127.0.0.1 --port 4321`.
2. Abrir home en navegador desktop + emulación mobile (o dispositivo real).
3. Teclado desktop:
   - Navegar con `Tab/Shift+Tab` desde nav hasta formulario.
   - Activar CTA por `Enter`.
   - Validar foco visible en cada control.
4. Menú mobile:
   - Abrir con botón hamburguesa.
   - Validar `Escape` para cerrar.
   - Validar ciclo de foco sin fuga fuera del menú.
5. Lector de pantalla (NVDA/VoiceOver/Orca):
   - Recorrer labels de formulario.
   - Forzar error de validación y confirmar anuncio por `aria-live`.
6. Criterio de pase 4.1:
   - No pérdida de foco.
   - Menú mobile totalmente operable por teclado.
   - Labels y errores anunciados correctamente.

## Verificación de funnel en DB (sin PII extra)

Eventos esperados en `contact_funnel_events`:
- `cta_click` (source `hero` o `nav`)
- `form_start` (source `contact_form`)
- `form_submit_success` (source `contact_form`)

Consultas de apoyo:

```sql
SELECT event, source, COUNT(*) AS total
FROM contact_funnel_events
GROUP BY event, source
ORDER BY total DESC;
```

```sql
SELECT session_id,
       SUM(CASE WHEN event = 'cta_click' THEN 1 ELSE 0 END) AS cta_click,
       SUM(CASE WHEN event = 'form_start' THEN 1 ELSE 0 END) AS form_start,
       SUM(CASE WHEN event = 'form_submit_success' THEN 1 ELSE 0 END) AS submit_success
FROM contact_funnel_events
GROUP BY session_id
ORDER BY session_id;
```

Interpretación mínima:
- Sesión con `cta_click` + `form_start` y sin `form_submit_success` = abandono.
- No inferir conversión si falta `form_submit_success`.

### Evidencia runtime ejecutada (2026-04-11)
Se ejecutaron acciones reales contra runtime local:

1) Reset de tabla
- `DELETE FROM contact_funnel_events` → conteo inicial `0`.

2) Flujo completo (`sess_full_001`)
- `trackFunnel(cta_click, hero)`
- `trackFunnel(form_start, contact_form)`
- `submitContact(...)` exitoso
- `trackFunnel(form_submit_success, contact_form)`

3) Flujo con abandono (`sess_drop_001`)
- `trackFunnel(cta_click, nav)`
- `trackFunnel(form_start, contact_form)`
- Sin `form_submit_success`

Resultado en DB:

```json
{
  "totals": [
    { "event": "cta_click", "source": "hero", "total": 1 },
    { "event": "cta_click", "source": "nav", "total": 1 },
    { "event": "form_start", "source": "contact_form", "total": 2 },
    { "event": "form_submit_success", "source": "contact_form", "total": 1 }
  ],
  "sessions": [
    { "session_id": "sess_drop_001", "cta_click": 1, "form_start": 1, "submit_success": 0 },
    { "session_id": "sess_full_001", "cta_click": 1, "form_start": 1, "submit_success": 1 }
  ]
}
```

Criterio de pase 4.2: **cumplido**
- Existe sesión completa con los 3 hitos.
- Existe sesión con abandono sin falsear conversión.

## Brechas abiertas
1. Performance mobile queda en 70; conviene siguiente iteración enfocada en payload/critical path (imágenes/fonts/JS por encima del pliegue) para subir consistentemente >75.
2. Validación con lector de pantalla real (NVDA/VoiceOver/Orca) sigue recomendada como smoke manual complementario.
