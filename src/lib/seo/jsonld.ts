export function safeJsonLd(data: Record<string, unknown>): string {
  return JSON.stringify(data).replace(/</g, '\\u003c');
}

interface PersonSchemaParams {
  description: string;
}

export function personSchema({ description }: PersonSchemaParams): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: 'Fabian Mendoza',
    alternateName: 'Blazz',
    url: 'https://blazz.cl',
    image: 'https://blazz.cl/projects/project1.webp',
    jobTitle: 'Jefe de Informática & Creative Developer',
    description,
    alumniOf: {
      '@type': 'EducationalOrganization',
      name: 'Ingeniero en Informática',
    },
    knowsAbout: ['Desarrollo SaaS', 'EdTech', 'React', 'TypeScript', 'Transformación Digital', 'Node.js'],
    sameAs: ['https://github.com/BlazzzPlay'],
    address: {
      '@type': 'PostalAddress',
      addressCountry: 'CL',
    },
  };
}

export function websiteSchema(): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Fabian Mendoza - Creative Developer',
    url: 'https://blazz.cl',
    description:
      'Portafolio profesional de Fabian Mendoza (Blazz). Ingeniero en Informática con más de 10 años de experiencia.',
    inLanguage: 'es',
    publisher: {
      '@type': 'Person',
      name: 'Fabian Mendoza',
    },
  };
}
