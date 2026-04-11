export interface SeoAuditInput {
  lighthouseMobileSeo: number;
  lighthouseDesktopSeo: number;
  privateUrlsIndexed: number;
}

export interface SeoAuditResult {
  compliant: boolean;
  breaches: string[];
  correctiveAction: 'none' | 'open-corrective-action';
}

export function evaluateSeoTechnicalAudit(input: SeoAuditInput): SeoAuditResult {
  const breaches: string[] = [];

  if (input.lighthouseMobileSeo < 95) {
    breaches.push(`Lighthouse mobile SEO bajo umbral: ${input.lighthouseMobileSeo} < 95`);
  }

  if (input.lighthouseDesktopSeo < 95) {
    breaches.push(`Lighthouse desktop SEO bajo umbral: ${input.lighthouseDesktopSeo} < 95`);
  }

  if (input.privateUrlsIndexed > 0) {
    breaches.push(`Se detectaron URLs privadas indexadas: ${input.privateUrlsIndexed}`);
  }

  return {
    compliant: breaches.length === 0,
    breaches,
    correctiveAction: breaches.length === 0 ? 'none' : 'open-corrective-action',
  };
}
