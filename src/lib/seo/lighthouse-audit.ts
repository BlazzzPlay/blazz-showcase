export interface LighthouseCategory {
  score?: number;
}

export interface LighthouseReport {
  categories?: {
    seo?: LighthouseCategory;
  };
}

export interface SeoAuditRouteTarget {
  route: '/' | '/servicios' | '/portfolio' | '/contacto';
  slug: 'home' | 'servicios' | 'portfolio' | 'contacto';
}

export interface ArtifactReference {
  filename: string;
  date: string;
  profile: 'mobile' | 'desktop';
}

export interface RouteAuditResult {
  route: SeoAuditRouteTarget['route'];
  slug: SeoAuditRouteTarget['slug'];
  mobileSeo: number | null;
  desktopSeo: number | null;
  compliant: boolean;
  breaches: string[];
  artifacts: {
    mobile: string | null;
    desktop: string | null;
  };
}

export interface SeoAuditSummary {
  threshold: number;
  privateUrlsIndexed: number;
  compliant: boolean;
  correctiveAction: 'none' | 'open-corrective-action';
  averageMobileSeo: number | null;
  averageDesktopSeo: number | null;
  routeResults: RouteAuditResult[];
  breaches: string[];
}

export const defaultSeoAuditTargets: SeoAuditRouteTarget[] = [
  { route: '/', slug: 'home' },
  { route: '/servicios', slug: 'servicios' },
  { route: '/portfolio', slug: 'portfolio' },
  { route: '/contacto', slug: 'contacto' },
];

const artifactPattern = /^(\d{4}-\d{2}-\d{2})-(home|servicios|portfolio|contacto)-(mobile|desktop)\.json$/;

export function parseSeoArtifactFilename(filename: string): ArtifactReference | null {
  const match = filename.match(artifactPattern);
  if (!match) return null;

  return {
    date: match[1],
    filename,
    profile: match[3] as 'mobile' | 'desktop',
  };
}

export function scoreFromLighthouseSeo(report: LighthouseReport): number {
  const rawScore = report.categories?.seo?.score;
  if (typeof rawScore !== 'number') {
    throw new Error('Lighthouse report sin categories.seo.score numérico');
  }

  return Math.round(rawScore * 100);
}

export function pickLatestArtifactsByTarget(
  filenames: string[],
  targets: SeoAuditRouteTarget[] = defaultSeoAuditTargets,
): Record<SeoAuditRouteTarget['slug'], { mobile: string | null; desktop: string | null }> {
  const targetBySlug = new Map(targets.map((entry) => [entry.slug, entry]));
  const latest: Record<SeoAuditRouteTarget['slug'], { mobile: ArtifactReference | null; desktop: ArtifactReference | null }> = {
    home: { mobile: null, desktop: null },
    servicios: { mobile: null, desktop: null },
    portfolio: { mobile: null, desktop: null },
    contacto: { mobile: null, desktop: null },
  };

  for (const filename of filenames) {
    const match = filename.match(artifactPattern);
    if (!match) continue;

    const slug = match[2] as SeoAuditRouteTarget['slug'];
    const profile = match[3] as 'mobile' | 'desktop';

    if (!targetBySlug.has(slug)) continue;

    const parsed = parseSeoArtifactFilename(filename);
    if (!parsed) continue;

    const current = latest[slug][profile];
    if (!current || parsed.date > current.date) {
      latest[slug][profile] = parsed;
    }
  }

  return {
    home: {
      mobile: latest.home.mobile?.filename ?? null,
      desktop: latest.home.desktop?.filename ?? null,
    },
    servicios: {
      mobile: latest.servicios.mobile?.filename ?? null,
      desktop: latest.servicios.desktop?.filename ?? null,
    },
    portfolio: {
      mobile: latest.portfolio.mobile?.filename ?? null,
      desktop: latest.portfolio.desktop?.filename ?? null,
    },
    contacto: {
      mobile: latest.contacto.mobile?.filename ?? null,
      desktop: latest.contacto.desktop?.filename ?? null,
    },
  };
}

export function evaluateSeoAuditFromReports(input: {
  threshold: number;
  privateUrlsIndexed: number;
  targets?: SeoAuditRouteTarget[];
  reportsBySlug: Partial<
    Record<
      SeoAuditRouteTarget['slug'],
      {
        mobile?: LighthouseReport;
        desktop?: LighthouseReport;
        artifacts?: {
          mobile?: string | null;
          desktop?: string | null;
        };
      }
    >
  >;
}): SeoAuditSummary {
  const threshold = input.threshold;
  const targets = input.targets ?? defaultSeoAuditTargets;
  const routeResults: RouteAuditResult[] = [];
  const breaches: string[] = [];

  for (const target of targets) {
    const targetData = input.reportsBySlug[target.slug] ?? {};
    const routeBreaches: string[] = [];

    const mobileSeo = targetData.mobile ? scoreFromLighthouseSeo(targetData.mobile) : null;
    const desktopSeo = targetData.desktop ? scoreFromLighthouseSeo(targetData.desktop) : null;

    if (mobileSeo === null) {
      routeBreaches.push(`Falta artifact mobile para ${target.route}`);
    } else if (mobileSeo < threshold) {
      routeBreaches.push(`${target.route} mobile SEO ${mobileSeo} < ${threshold}`);
    }

    if (desktopSeo === null) {
      routeBreaches.push(`Falta artifact desktop para ${target.route}`);
    } else if (desktopSeo < threshold) {
      routeBreaches.push(`${target.route} desktop SEO ${desktopSeo} < ${threshold}`);
    }

    for (const breach of routeBreaches) breaches.push(breach);

    routeResults.push({
      route: target.route,
      slug: target.slug,
      mobileSeo,
      desktopSeo,
      compliant: routeBreaches.length === 0,
      breaches: routeBreaches,
      artifacts: {
        mobile: targetData.artifacts?.mobile ?? null,
        desktop: targetData.artifacts?.desktop ?? null,
      },
    });
  }

  if (input.privateUrlsIndexed > 0) {
    breaches.push(`URLs privadas indexadas detectadas: ${input.privateUrlsIndexed}`);
  }

  const mobileScores = routeResults
    .map((entry) => entry.mobileSeo)
    .filter((score): score is number => typeof score === 'number');
  const desktopScores = routeResults
    .map((entry) => entry.desktopSeo)
    .filter((score): score is number => typeof score === 'number');

  const averageMobileSeo =
    mobileScores.length > 0
      ? Math.round((mobileScores.reduce((acc, score) => acc + score, 0) / mobileScores.length) * 100) / 100
      : null;
  const averageDesktopSeo =
    desktopScores.length > 0
      ? Math.round((desktopScores.reduce((acc, score) => acc + score, 0) / desktopScores.length) * 100) / 100
      : null;

  return {
    threshold,
    privateUrlsIndexed: input.privateUrlsIndexed,
    compliant: breaches.length === 0,
    correctiveAction: breaches.length === 0 ? 'none' : 'open-corrective-action',
    averageMobileSeo,
    averageDesktopSeo,
    routeResults,
    breaches,
  };
}
