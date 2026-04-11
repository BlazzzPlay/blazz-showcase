import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();

const config = {
  desktop: {
    before: 'docs/quality/lighthouse/before-desktop.json',
    after: 'docs/quality/lighthouse/after-desktop.json',
    minPerformanceScore: 0.9,
    minAccessibilityScore: 0.95,
    maxTtiMs: 2500,
    maxLcpMs: 2500,
    maxCls: 0.1,
    maxTbtMs: 200,
  },
  mobile: {
    before: 'docs/quality/lighthouse/before-mobile.json',
    after: 'docs/quality/lighthouse/after-mobile.json',
    minPerformanceScore: 0.7,
    minAccessibilityScore: 0.95,
    maxTtiMs: 6000,
    maxLcpMs: 6000,
    maxCls: 0.1,
    maxTbtMs: 250,
  },
};

function readReport(relativePath) {
  const filePath = path.join(root, relativePath);
  if (!fs.existsSync(filePath)) {
    throw new Error(`Missing Lighthouse artifact: ${relativePath}`);
  }

  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function valueFrom(report, categoryOrAudit, field) {
  const source = categoryOrAudit === 'performance' || categoryOrAudit === 'accessibility'
    ? report.categories?.[categoryOrAudit]
    : report.audits?.[categoryOrAudit];

  if (!source || typeof source[field] !== 'number') {
    throw new Error(`Missing numeric field ${categoryOrAudit}.${field} in report`);
  }

  return source[field];
}

const errors = [];

for (const [profile, thresholds] of Object.entries(config)) {
  const before = readReport(thresholds.before);
  const after = readReport(thresholds.after);

  const beforePerf = valueFrom(before, 'performance', 'score');
  const afterPerf = valueFrom(after, 'performance', 'score');
  const beforeA11y = valueFrom(before, 'accessibility', 'score');
  const afterA11y = valueFrom(after, 'accessibility', 'score');

  const tti = valueFrom(after, 'interactive', 'numericValue');
  const lcp = valueFrom(after, 'largest-contentful-paint', 'numericValue');
  const cls = valueFrom(after, 'cumulative-layout-shift', 'numericValue');
  const tbt = valueFrom(after, 'total-blocking-time', 'numericValue');

  console.log(`\n[${profile}]`);
  console.log(`- performance score (before -> after): ${Math.round(beforePerf * 100)} -> ${Math.round(afterPerf * 100)}`);
  console.log(`- accessibility score (before -> after): ${Math.round(beforeA11y * 100)} -> ${Math.round(afterA11y * 100)}`);
  console.log(`- TTI: ${Math.round(tti)}ms | LCP: ${Math.round(lcp)}ms | CLS: ${cls.toFixed(4)} | TBT: ${Math.round(tbt)}ms`);

  if (afterPerf < thresholds.minPerformanceScore) {
    errors.push(`[${profile}] Performance score ${afterPerf} < ${thresholds.minPerformanceScore}`);
  }
  if (afterA11y < thresholds.minAccessibilityScore) {
    errors.push(`[${profile}] Accessibility score ${afterA11y} < ${thresholds.minAccessibilityScore}`);
  }
  if (afterPerf < beforePerf) {
    errors.push(`[${profile}] Performance regressed (${beforePerf} -> ${afterPerf})`);
  }
  if (afterA11y < beforeA11y) {
    errors.push(`[${profile}] Accessibility regressed (${beforeA11y} -> ${afterA11y})`);
  }
  if (tti > thresholds.maxTtiMs) {
    errors.push(`[${profile}] TTI ${Math.round(tti)}ms > ${thresholds.maxTtiMs}ms`);
  }
  if (lcp > thresholds.maxLcpMs) {
    errors.push(`[${profile}] LCP ${Math.round(lcp)}ms > ${thresholds.maxLcpMs}ms`);
  }
  if (cls > thresholds.maxCls) {
    errors.push(`[${profile}] CLS ${cls} > ${thresholds.maxCls}`);
  }
  if (tbt > thresholds.maxTbtMs) {
    errors.push(`[${profile}] TBT ${Math.round(tbt)}ms > ${thresholds.maxTbtMs}ms`);
  }
}

if (errors.length > 0) {
  console.error('\nLighthouse assertions FAILED:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log('\nLighthouse assertions passed for desktop and mobile artifacts.');
