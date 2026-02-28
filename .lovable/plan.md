

# Plan: Portafolio Animado blazz.cl - Glassmorphism Moderno

## Datos recopilados

- **Nombre**: Fabian Mendoza
- **Título**: Ingeniero en Informática (titulado 2015)
- **Bio**: Apasionado por las nuevas tecnologías y plataformas de desarrollo
- **Skills**: Desarrollo Web, SaaS
- **Proyecto**: EduCal Chile - Plataforma educativa para docentes chilenos (https://educal-chile.vercel.app/)
- **GitHub**: https://github.com/BlazzzPlay
- **Experiencia**: +10 años en tecnologías educativas, Jefe de Informática en Colegio Montessori

## Arquitectura de secciones

1. **Hero** - Nombre, título, CTA animado con partículas/gradientes
2. **Sobre mí** - Bio, foto placeholder, stats (10+ años exp, etc.)
3. **Habilidades** - Cards glassmorphism con iconos animados (React, TypeScript, SaaS, etc.)
4. **Proyectos** - Card de EduCal Chile con screenshot, descripción, link, tecnologías
5. **Experiencia/Timeline** - Timeline vertical animada (Colegio Montessori, etc.)
6. **Servicios** - Desarrollo Web, SaaS, Consultoría Tech Educativa
7. **Testimonios** - Sección placeholder para futuros testimonios
8. **Blog** - Sección placeholder para futuros posts
9. **Contacto** - Formulario + links sociales (GitHub)

## Estilo visual: Glassmorphism moderno

- Fondo: gradientes oscuros (deep purple/blue/teal)
- Cards: `backdrop-blur-lg bg-white/10 border border-white/20`
- Acentos: gradientes cyan-purple
- Tipografía: limpia, weights variados
- Scroll animations: fade-in, slide-up con Intersection Observer

## Pasos de implementación

1. **Actualizar CSS** - Variables de color glassmorphism, keyframes para scroll animations, clases utilitarias
2. **Crear hook `useScrollAnimation`** - Intersection Observer para animar elementos al hacer scroll
3. **Crear componentes de sección** - Hero, About, Skills, Projects, Experience, Services, Testimonials, Blog, Contact
4. **Crear Navbar** - Navegación fija con glassmorphism y scroll suave
5. **Actualizar Index.tsx** - Componer todas las secciones con scroll animations
6. **Actualizar tailwind.config.ts** - Nuevos keyframes y colores custom

## Detalle técnico

- Custom hook con `IntersectionObserver` para animaciones al scroll
- CSS custom properties para el tema glassmorphism
- Gradientes animados en el hero con `@keyframes`
- Cards con `backdrop-filter: blur()` y bordes semitransparentes
- Timeline con línea vertical y dots animados
- Responsive: mobile-first con breakpoints sm/md/lg

