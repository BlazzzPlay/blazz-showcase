# Fabian Mendoza | Creative Developer Portfolio

Este es el portafolio profesional de **Fabian Mendoza (Blazz)**, construido con **Astro 6** para una velocidad y diseño superior.

## 🚀 Tecnologías
- **Framework**: [Astro](https://astro.build/)
- **Estilos**: Vainilla CSS con variables HSL personalizadas.
- **Base de Datos**: SQLite con [Drizzle ORM](https://orm.drizzle.team/).
- **Servidor**: SSR con el adaptador de Node.js.
- **Iconografía**: Lucide Icons.

## 📦 Instalación y Uso Local

1. Instala las dependencias:
   ```bash
   npm install
   ```

2. Ejecuta el servidor de desarrollo:
   ```bash
   npm run dev
   ```

3. Abre el sitio en `http://localhost:4321`.

## 🔎 Auditoría SEO automatizada (T2)

- Ejecutá `npm run seo:audit` para validar el baseline Lighthouse multi-URL (`/`, `/servicios`, `/portfolio`, `/contacto`) con umbral `SEO >= 95` en mobile/desktop.
- El comando también valida `private indexed URLs = 0` (por defecto) y falla con exit code `1` si encuentra breaches.
- Reportes versionables generados:
  - `docs/quality/lighthouse/seo-audit-report.json`
  - `docs/quality/lighthouse/seo-audit-report.md`
- Flags opcionales:
  - `--threshold 95`
  - `--private-indexed 0`
  - `--artifacts-dir docs/quality/lighthouse`
  - `--baseline docs/quality/seo-baseline-chile.md`

## 🌐 Despliegue en Dokploy

Este proyecto está configurado para ejecutarse en contenedores Docker via Dokploy.

### Consideraciones de Infraestructura:
- **Puerto**: El puerto por defecto es el `4321`.
- **Persistencia**: La base de datos reside en `/data/sqlite.db`. Se recomienda montar un volumen persistente en la carpeta `/data` para no perder las solicitudes del formulario de contacto.
- **Variables de Entorno**:
  - `DB_PATH`: Ruta absoluta a la base de datos (opcional, por defecto `/data/sqlite.db`).
  - `HOST`: `0.0.0.0`
  - `PORT`: `4321`

###
Implementado con Astro Actions para guardar directamente en la base de datos interna.
