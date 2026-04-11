import type { SeoPageConfig } from './contracts';

export const seoCatalog: Record<string, SeoPageConfig> = {
  '/': {
    title: 'Desarrollo SaaS y EdTech en Chile',
    description:
      'Portafolio de Fabian Mendoza: desarrollo web y productos SaaS para equipos en Chile, con foco en resultados medibles y arquitectura sólida.',
    image: '/projects/project1.webp',
    indexable: true,
    intent: 'servicio-general-cl',
    supportIntent: 'desarrollo-web-santiago',
    cityMention: 'Santiago',
  },
  '/servicios': {
    title: 'Servicios web y arquitectura en Santiago',
    description:
      'Servicios de desarrollo web, arquitectura y automatización para negocios en Santiago, diseñados para escalar sin deuda técnica innecesaria.',
    image: '/projects/project1.webp',
    indexable: true,
    intent: 'desarrollo-web-santiago',
    supportIntent: 'servicio-general-cl',
    cityMention: 'Santiago',
  },
  '/portfolio': {
    title: 'Portfolio SaaS y EdTech en Chile',
    description:
      'Revisá casos de proyectos SaaS y EdTech construidos en Chile, con enfoque en producto, performance y mejoras concretas para cada cliente.',
    image: '/projects/project1.webp',
    indexable: true,
    intent: 'portfolio-credibilidad-cl',
    supportIntent: 'servicio-general-cl',
    cityMention: 'Santiago',
  },
  '/contacto': {
    title: 'Contacto proyecto digital en Chile',
    description:
      'Contactá a Fabian Mendoza para planificar tu próximo proyecto digital en Chile: definición técnica, roadmap y ejecución de punta a punta.',
    image: '/projects/project1.webp',
    indexable: true,
    intent: 'contacto-conversion-cl',
    supportIntent: 'servicio-general-cl',
    cityMention: 'Santiago',
  },
  '/admin': {
    title: 'Panel interno de administración',
    description:
      'Panel privado para revisar solicitudes internas del sitio. Ruta no indexable para buscadores públicos.',
    image: '/projects/project1.webp',
    indexable: false,
    intent: 'admin-privado-cl',
    supportIntent: 'servicio-general-cl',
  },
};

export function resolveSeoPage(pathname: string): SeoPageConfig {
  return (
    seoCatalog[pathname] ?? {
      title: 'Desarrollo web en Chile',
      description:
        'Sitio de Fabian Mendoza con servicios y experiencia en desarrollo web para equipos en Chile, desde estrategia hasta implementación.',
      image: '/projects/project1.webp',
      indexable: true,
      intent: 'servicio-general-cl',
      supportIntent: 'desarrollo-web-santiago',
      cityMention: 'Santiago',
    }
  );
}
