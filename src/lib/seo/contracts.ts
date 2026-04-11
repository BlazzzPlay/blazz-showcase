export type SeoIntent =
  | 'servicio-general-cl'
  | 'desarrollo-web-santiago'
  | 'portfolio-credibilidad-cl'
  | 'contacto-conversion-cl'
  | 'admin-privado-cl';

export type RobotsPolicy = 'index,follow' | 'noindex,nofollow';

export interface SeoMetaInput {
  pathname: string;
  title: string;
  description: string;
  image?: string;
  indexable?: boolean;
  intent: SeoIntent;
  supportIntent?: SeoIntent;
  cityMention?: 'Santiago' | 'Valparaíso' | 'Concepción';
}

export interface SeoMetaResolved {
  fullTitle: string;
  description: string;
  canonical: string;
  robots: RobotsPolicy;
  og: {
    title: string;
    description: string;
    url: string;
    image: string;
    locale: 'es_CL';
  };
  twitter: {
    card: 'summary_large_image';
    title: string;
    description: string;
    image: string;
  };
}

export type SeoPageConfig = Omit<SeoMetaInput, 'pathname'> & {
  pathname?: string;
};
