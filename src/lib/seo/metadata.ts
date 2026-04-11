import type { RobotsPolicy, SeoMetaInput, SeoMetaResolved } from './contracts';
import { validateSeoCopyRules } from './content-rules';

const SITE_URL = 'https://blazz.cl';
const DEFAULT_IMAGE = '/projects/project1.webp';
const BRAND_SUFFIX = 'Fabian Mendoza · Blazz';
const MIN_INDEXABLE_TITLE_LENGTH = 45;
const MAX_INDEXABLE_TITLE_LENGTH = 65;

export function buildSeoMeta(input: SeoMetaInput): SeoMetaResolved {
  const validation = validateSeoCopyRules(input);
  if (!validation.ok) {
    throw new Error(`SEO metadata inválida: ${validation.reasons.join(' | ')}`);
  }

  const robots: RobotsPolicy = input.indexable === false ? 'noindex,nofollow' : 'index,follow';
  const canonical = absoluteUrl(input.pathname);
  const image = absoluteUrl(input.image ?? DEFAULT_IMAGE);
  const fullTitle = `${input.title} | ${BRAND_SUFFIX}`;

  if (robots === 'index,follow') {
    const titleLength = fullTitle.length;
    if (titleLength < MIN_INDEXABLE_TITLE_LENGTH || titleLength > MAX_INDEXABLE_TITLE_LENGTH) {
      throw new Error(
        `SEO metadata inválida: title final fuera de rango (${titleLength}). Debe estar entre ${MIN_INDEXABLE_TITLE_LENGTH} y ${MAX_INDEXABLE_TITLE_LENGTH} caracteres.`,
      );
    }
  }

  return {
    fullTitle,
    description: input.description,
    canonical,
    robots,
    og: {
      title: fullTitle,
      description: input.description,
      url: canonical,
      image,
      locale: 'es_CL',
    },
    twitter: {
      card: 'summary_large_image',
      title: fullTitle,
      description: input.description,
      image,
    },
  };
}

function absoluteUrl(pathname: string): string {
  return new URL(pathname, SITE_URL).toString();
}
