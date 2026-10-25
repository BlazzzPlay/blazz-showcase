# Fabian Mendoza | Creative Developer Portfolio

Portafolio de **Fabian Mendoza (Blazz)**: Astro **7.3.8 estático**, CSS vainilla
y API Worker independiente con D1. La web pública conserva sus rutas,
canonicales, sitemap e identidad visual. No utiliza Astro Actions, SSR Node,
libSQL ni Drizzle. La historia SQLite original se conserva sin importar datos.

## Desarrollo local: una sola procedencia

Requiere Node >=22.18 y las dependencias bloqueadas de **ambos** paquetes:

```sh
npm ci
npm --prefix worker ci
npm run dev
```

`dev` construye primero Astro y después ejecuta `cloudflare dev` desde `worker/`.
Web y `/api/contact` / `/api/funnel` comparten `http://127.0.0.1:18797`.
Los cambios de frontend requieren reiniciar `npm run dev` para reconstruir `dist`;
no hay HMR Astro ni aprovisionamiento sorpresa. `FOUNDATION_PORT` y
`FOUNDATION_STATE` permiten ajustar puerto y persistencia local del plugin.
No se ejecutan migraciones automáticamente en desarrollo ni en producción.

**Bloqueo conocido:** cf beta14 imprime resultados correctos pero puede no
terminar al aplicar migraciones/SQL local. La API devuelve503 sin esquema;
consultá [worker/README.md](worker/README.md) antes de inicializar D1 local.
El bypass Miniflare pertenece exclusivamente al arnés de pruebas, no al operador.
No hay migraciones remotas ni despliegue verificado; D1 cloud sigue vacío.

## Construcción y pruebas

El orden es explícito: el plugin Vite del Worker consume `../dist` ya construido.
No se instala un adaptador Astro Cloudflare.

```sh
npm run test:unit
npm run typecheck
npm run build
npm --prefix worker run typecheck
npm --prefix worker run test:api
npm --prefix worker run build
npm --prefix worker run test:static
npm run test:e2e -- --reporter=line
```

Playwright inicia su propio Worker en puerto4401, sin reutilizar4321 ni servidores
ambientales. Construye Astro, aplica el esquema en D1 **local sintético aislado**
y comprueba contactos y eventos de embudo reales, además de mocks JSON del UI.
Usa Chromium previamente disponible; no instala ni limpia navegadores localmente.
Los artefactos ignorados `worker/.cloudflare/e2e-*`, `dist`, informes y capturas
no son datos de producción. El cierre afecta únicamente grupos de procesos hijos.

`npm --prefix worker run test:foundation` selecciona explícitamente el fixture C2a,
lo construye y conserva todas las aserciones de exit0 del CLI. Tiene un fallo
conocido de terminación; no se elimina ni cuenta como preparación de despliegue.
La CI instala ambos lockfiles, verifica tipos/unidades/build y ejecuta el stack
local sin credenciales cloud. El bloqueo de foundation se documenta por separado.

## API pública y panel privado

El formulario envía JSON a `/api/contact`; muestra `fieldErrors` persistentes,
conserva entradas inválidas y restablece controles mediante `finally`. Sólo un
éxito válido confirma el guardado y reinicia el formulario. Analytics envía
`/api/funnel` por separado, sin determinar el resultado del contacto.

Los límites y respuestas están en [el contrato Worker](worker/README.md#public-contract-c2b1).
El Worker reserva `/api/*`, `/admin*` y `/private*`; rutas privadas y mutaciones
administrativas permanecen denegadas. **C3 pendiente:** validación completa de JWT
Access, audiencia y política autorizada antes de habilitar cualquier panel.
No hay endpoint público de inspección D1.

## SEO

`npm run seo:audit` valida el baseline Lighthouse multi-URL (`/`, `/servicios`,
`/portfolio`, `/contacto`) con `SEO >=95` móvil/escritorio e índice privado cero.
Conserva los reportes `docs/quality/lighthouse/seo-audit-report.{json,md}` y flags
`--threshold`, `--private-indexed`, `--artifacts-dir` y `--baseline`.

## Publicación y rollback

El destino aprobado es Worker + assets estáticos + D1 en la misma procedencia,
operado con **cloudflare/cf**, no Wrangler. Access, migración cloud, deployment y
DNS requieren autorización separada y siguen pendientes. No se afirma readiness.

Dockerfile es únicamente un **diagnóstico estático** en puerto8080: no sirve API,
D1 ni panel; el formulario no guardará solicitudes. Retira el antiguo entrypoint
Node y volumen SQLite de Dokploy, no lo reemplaza como despliegue completo.

Rollback es una operación revisada del padre: revertir esta unidad de fuentes
junto con las seis eliminaciones legacy y reconstruir outputs. No ejecutar
rollback automático ni tocar SQLite original o recursos cloud. C2b1 conserva
API/esquema/pruebas independientes; C3 puede implementar el panel en el Worker,
sin volver a generar páginas privadas en `dist`.
