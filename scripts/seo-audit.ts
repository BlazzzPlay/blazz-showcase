import fs from 'node:fs';
import path from 'node:path';

import {
  defaultSeoAuditTargets,
  evaluateSeoAuditFromReports,
  pickLatestArtifactsByTarget,
  type LighthouseReport,
} from '../src/lib/seo/lighthouse-audit';

interface CliOptions {
  artifactsDir: string;
  baselineFile: string;
  outputFile: string;
  markdownFile: string;
  threshold: number;
  privateIndexed: number;
}

const defaults: CliOptions = {
  artifactsDir: 'docs/quality/lighthouse',
  baselineFile: 'docs/quality/seo-baseline-chile.md',
  outputFile: 'docs/quality/lighthouse/seo-audit-report.json',
  markdownFile: 'docs/quality/lighthouse/seo-audit-report.md',
  threshold: 95,
  privateIndexed: 0,
};

function parseArgs(argv: string[]): CliOptions {
  const options: CliOptions = { ...defaults };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    const next = argv[i + 1];

    if (arg === '--artifacts-dir' && next) {
      options.artifactsDir = next;
      i += 1;
      continue;
    }

    if (arg === '--output' && next) {
      options.outputFile = next;
      i += 1;
      continue;
    }

    if (arg === '--baseline' && next) {
      options.baselineFile = next;
      i += 1;
      continue;
    }

    if (arg === '--markdown' && next) {
      options.markdownFile = next;
      i += 1;
      continue;
    }

    if (arg === '--threshold' && next) {
      options.threshold = Number(next);
      i += 1;
      continue;
    }

    if (arg === '--private-indexed' && next) {
      options.privateIndexed = Number(next);
      i += 1;
      continue;
    }
  }

  if (!Number.isFinite(options.threshold) || options.threshold <= 0 || options.threshold > 100) {
    throw new Error('El umbral debe ser un número entre 1 y 100');
  }

  if (!Number.isFinite(options.privateIndexed) || options.privateIndexed < 0) {
    throw new Error('private-indexed debe ser un número mayor o igual a 0');
  }

  return options;
}

function readLighthouseReport(filePath: string): LighthouseReport {
  return JSON.parse(fs.readFileSync(filePath, 'utf8')) as LighthouseReport;
}

function formatScore(score: number | null): string {
  return score === null ? 'n/a' : `${score}`;
}

function ensureParentDirectory(filePath: string): void {
  const parent = path.dirname(filePath);
  fs.mkdirSync(parent, { recursive: true });
}

function validateBaselineCoverage(baselineContent: string, routes: string[]): string[] {
  const breaches: string[] = [];

  for (const route of routes) {
    if (!baselineContent.includes(`\`${route}\``) && !baselineContent.includes(`| ${route} |`)) {
      breaches.push(`Baseline sin cobertura explícita para ${route}`);
    }
  }

  return breaches;
}

function formatCorrectiveAction(breach: string): string {
  if (breach.includes('Falta artifact')) {
    return 'Generar y versionar artifact Lighthouse faltante para la URL/perfil indicado.';
  }

  if (breach.includes('URLs privadas indexadas')) {
    return 'Aplicar noindex,nofollow, excluir en sitemap y solicitar desindexación en Search Console.';
  }

  if (breach.includes('Baseline sin cobertura')) {
    return 'Actualizar docs/quality/seo-baseline-chile.md con la URL objetivo y su baseline Lighthouse.';
  }

  return 'Ajustar metadata/enlazado/contenido y re-ejecutar Lighthouse hasta cumplir umbral SEO >=95.';
}

function toMarkdownReport(data: {
  generatedAt: string;
  options: CliOptions;
  result: {
    threshold: number;
    privateUrlsIndexed: number;
    compliant: boolean;
    correctiveAction: 'none' | 'open-corrective-action';
    averageMobileSeo: number | null;
    averageDesktopSeo: number | null;
    routeResults: ReturnType<typeof evaluateSeoAuditFromReports>['routeResults'];
    breaches: string[];
  };
}): string {
  const lines: string[] = [];

  lines.push('# SEO Audit Report (T2)');
  lines.push('');
  lines.push(`- Generado: ${data.generatedAt}`);
  lines.push(`- Umbral SEO: >= ${data.options.threshold}`);
  lines.push(`- URLs privadas indexadas informadas: ${data.options.privateIndexed}`);
  lines.push(`- Estado global: ${data.result.compliant ? 'PASS' : 'FAIL'}`);
  lines.push(`- Corrective action: ${data.result.correctiveAction}`);
  lines.push('');
  lines.push('## Resultado por URL');
  lines.push('');
  lines.push('| URL | Mobile SEO | Desktop SEO | Estado | Artifacts |');
  lines.push('|---|---:|---:|---|---|');

  for (const entry of data.result.routeResults) {
    const artifacts = `m:${entry.artifacts.mobile ?? 'n/a'}<br>d:${entry.artifacts.desktop ?? 'n/a'}`;
    lines.push(
      `| \`${entry.route}\` | ${formatScore(entry.mobileSeo)} | ${formatScore(entry.desktopSeo)} | ${entry.compliant ? 'PASS' : 'FAIL'} | ${artifacts} |`,
    );
  }

  lines.push('');
  lines.push('## Breaches y acciones correctivas');
  lines.push('');

  if (data.result.breaches.length === 0) {
    lines.push('- Sin breaches.');
  } else {
    for (const breach of data.result.breaches) {
      lines.push(`- Breach: ${breach}`);
      lines.push(`  - Accion: ${formatCorrectiveAction(breach)}`);
    }
  }

  return lines.join('\n');
}

function run(): number {
  const options = parseArgs(process.argv.slice(2));
  const root = process.cwd();
  const artifactsDir = path.resolve(root, options.artifactsDir);
  const baselinePath = path.resolve(root, options.baselineFile);

  if (!fs.existsSync(artifactsDir)) {
    throw new Error(`No existe directorio de artifacts: ${options.artifactsDir}`);
  }

  if (!fs.existsSync(baselinePath)) {
    throw new Error(`No existe baseline SEO: ${options.baselineFile}`);
  }

  const files = fs.readdirSync(artifactsDir);
  const latestByTarget = pickLatestArtifactsByTarget(files);
  const baselineContent = fs.readFileSync(baselinePath, 'utf8');

  const reportsBySlug: Record<string, { mobile?: LighthouseReport; desktop?: LighthouseReport; artifacts?: { mobile?: string | null; desktop?: string | null } }> = {};

  for (const target of defaultSeoAuditTargets) {
    const picked = latestByTarget[target.slug];
    const mobilePath = picked.mobile ? path.join(artifactsDir, picked.mobile) : null;
    const desktopPath = picked.desktop ? path.join(artifactsDir, picked.desktop) : null;

    reportsBySlug[target.slug] = {
      artifacts: {
        mobile: picked.mobile,
        desktop: picked.desktop,
      },
      mobile: mobilePath ? readLighthouseReport(mobilePath) : undefined,
      desktop: desktopPath ? readLighthouseReport(desktopPath) : undefined,
    };
  }

  const result = evaluateSeoAuditFromReports({
    threshold: options.threshold,
    privateUrlsIndexed: options.privateIndexed,
    reportsBySlug,
  });
  const baselineBreaches = validateBaselineCoverage(
    baselineContent,
    defaultSeoAuditTargets.map((entry) => entry.route),
  );
  const finalBreaches = [...result.breaches, ...baselineBreaches];
  const finalCompliant = finalBreaches.length === 0;

  const finalResult = {
    ...result,
    compliant: finalCompliant,
    correctiveAction: finalCompliant ? 'none' : 'open-corrective-action',
    breaches: finalBreaches,
  };

  const generatedAt = new Date().toISOString();
  const payload = {
    generatedAt,
    options,
    result: finalResult,
  };

  const outputPath = path.resolve(root, options.outputFile);
  const markdownPath = path.resolve(root, options.markdownFile);
  ensureParentDirectory(outputPath);
  ensureParentDirectory(markdownPath);

  fs.writeFileSync(outputPath, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
  fs.writeFileSync(markdownPath, `${toMarkdownReport(payload)}\n`, 'utf8');

  console.log('SEO audit multi-URL (T2)');
  console.log(`- Umbral: >= ${options.threshold}`);
  console.log(`- URLs privadas indexadas: ${options.privateIndexed}`);
  console.log(`- Promedio mobile: ${formatScore(finalResult.averageMobileSeo)}`);
  console.log(`- Promedio desktop: ${formatScore(finalResult.averageDesktopSeo)}`);

  for (const routeResult of finalResult.routeResults) {
    console.log(
      `- ${routeResult.route} | mobile=${formatScore(routeResult.mobileSeo)} desktop=${formatScore(routeResult.desktopSeo)} | ${routeResult.compliant ? 'PASS' : 'FAIL'}`,
    );
  }

  if (!finalResult.compliant) {
    console.error('Breaches detectados:');
    for (const breach of finalResult.breaches) {
      console.error(`- ${breach}`);
      console.error(`  -> ${formatCorrectiveAction(breach)}`);
    }
    console.error(`Reporte JSON: ${options.outputFile}`);
    console.error(`Reporte MD: ${options.markdownFile}`);
    return 1;
  }

  console.log('Estado global: PASS');
  console.log(`Reporte JSON: ${options.outputFile}`);
  console.log(`Reporte MD: ${options.markdownFile}`);
  return 0;
}

try {
  process.exit(run());
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`SEO audit failed: ${message}`);
  process.exit(1);
}
