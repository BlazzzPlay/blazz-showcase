# Claro colegios redesign
Implement design/portfolio-redesign/04-claro-colegios-v2.html (mobile: 05) in the Astro home, keeping contact API, funnel tracking, SEO and existing e2e contracts. Branch feat/claro-colegios-redesign.

## Specs
- S1 "me gusta la tercera opcion de claro orientado a colegio pero me gustaria que tuviera modo oscuro" — light theme default from system preference, dark mode toggle persisted.
- S2 "agregar efectos como que el contenido balla apareciendo mientras se hace esclol" — scroll reveals, progress bar, counters; all off under prefers-reduced-motion.
- S3 Sections per artboard 04: hero + "Quién soy" card + stats, "Qué hago" (3 needs), "Proyectos que ya se usan", "Cómo trabajo" (4 steps), FAQ, contact form, footer with "Política de privacidad".
- S4 Mobile per artboard 05: "los proyectos se tiene que ajsutar y apareses asia abajo si no caen en la pantalla" (stacked projects), full-screen menu, sticky bottom CTA, no horizontal overflow ("el texto sale del vorde").
- S5 "primero pasamos la 4 y las pruebas" — npm run build and the Playwright suite pass after the change.

## Tasks
- T1 S1-S4 Restyle Layout tokens (light/dark) + theme toggle, Navigation, Hero, Projects, new sections in index, Footer — inline — commit: this branch HEAD
- T2 S5 Update e2e for new contracts, add tests for theme toggle and FAQ; run build + suite — inline — commit: this branch HEAD

## Log
- L1 "si primero pasamos la 4 y las pruebas" (after: "usa playgrau para revisar la web antes de que desplegemos")
- L2 Design: design/portfolio-redesign/, chosen artboard 04-claro-colegios-v2.html (mobile 05); 01-03 are alternatives.
- L3 Evidence: npm run build OK; Playwright 61 passed, 5 skipped, 0 failed (incl. new e2e/theme-and-layout.spec.ts). Hero copy test updated to new headline/CTA by request. Privacy link not added: /privacidad page does not exist.
- L4 Independent verify (gentle-ai-verify): S1,S2,S4,S5 met; S3 unmet only for privacy link (no /privacidad page). Fixed advisory: mobile sticky CTA was aria-hidden while visible. Added regression tests for /servicios,/contacto,/portfolio light/dark. Playwright 75 passed, 5 skipped.
