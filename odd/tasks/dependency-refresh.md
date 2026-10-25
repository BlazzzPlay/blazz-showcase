# Dependency refresh

## Objective
Update compatible dependencies and remove unused tooling without changing application features or database behavior.

## Scope and constraints
- Branch: `chore/dependency-refresh`.
- Source edits: `package.json`, `package-lock.json`, plus user-authorized type-only fix in `scripts/seo-audit.ts`.
- Remove `drizzle-kit`: tracked inventory shows declarations only; runtime initializes tables with inline SQL.
- Upgrade Astro and Node adapter together. Keep TypeScript 5; TypeScript 7 migration is out of scope.
- Preserve database schema and user files. No force audit fix, publishing, or commits without explicit user request.
- Preserve untracked `.codegraph/` created during exploration.

## Tasks
- [x] T1: Dependency refresh and Kit removal verified; typecheck now passes after T4. Work-unit commit deferred until explicit authorization.
- [x] T4: Type-only correction verified independently; compiler failure before and success after observed by writer. Unit/build passed, updated candidate review approved and acknowledged. Work-unit commit deferred until explicit authorization.
- [x] T2: Independent verification completed with environment limitations below; no candidate-caused regression observed. Work-unit commit deferred until explicit authorization.
- [x] T3: Native review approved and acknowledged; final evidence recorded. Work-unit commit deferred until explicit authorization.

## Acceptance criteria
- Kit absent from manifest and lockfile; all retained dependencies have evidenced uses.
- Compatible versions and synchronized lockfile; deterministic installation succeeds.
- Unit tests, typecheck, build, browser tests and production SSR smoke checks have observed outcomes, with environmental limitations disclosed.
- Compare audit before/after and disclose residual vulnerabilities.
- Native review acknowledged or blocking state disclosed.

## Evidence
- Initial audit: 20 vulnerable entries (1 critical, 15 high, 4 moderate).
- Baseline installation and regression checks observed; typecheck contains a pre-existing defect.
- Registry targets: Astro 7.3.8, Node adapter 11.1.7, sitemap 3.7.4, libsql 0.18.0, Drizzle ORM 0.45.4, Playwright 1.64.0, tsx 4.23.15. TypeScript stays 5.9.3.
- Host Node 24.18.0/npm 12.0.2. Node 22.23.3 Alpine Docker production installation, SSR and libsql smoke checks passed.
- RDD on globally. Native review `review-23d21b6877496529` approved and exact acknowledgement completed; authority burned for target `sha256:18646fa1bdd1a6da9584e3db42c4fb9f7e5ceb5249b55e7642302207bfcc9819`. Only package.json/package-lock.json reviewed; ODD/.codegraph excluded.
- Work-unit commits pending explicit user authorization under safety policy. Native acknowledgement is not a Git commit.

## Progress and next step
T1 implementation observed: original and updated npm ci passed; unit tests 19/19 and build passed before/after (post checks repeated after clean npm ci). Manifest/lock match; Kit and esbuild-kit loaders absent. Updated audit: zero vulnerabilities. Typecheck exits 2 before and after: TS2345 at scripts/seo-audit.ts:244:54 (correctiveAction widened to string); source unchanged. No RED/GREEN applicable to version-only refresh. npm blocked esbuild install scripts but build passed. Independent verification repeated unit19/build/audit0/diff checks successfully. Isolated candidate E2E: 17 passed, 5 skipped (exit0). Baseline: 16 passed, 1 flaky retry-success (desktop abandonment), 5 skipped (exit0). Baseline used candidate Chromium156/FFmpeg because old installer rejects Ubuntu26.04; comparison is not browser-identical. Temp copied config used spare ports; ambient Astro process remained untouched.

Host and Node22 Alpine production-only installs and SSR GET /, /sitemap-index.xml, /servicios (200 with expected markers) passed, as did libsql create/insert/select. A later repeated host install in the Docker-mounted temporary directory failed EACCES because Docker created root-owned temporary node_modules; repository files were not affected. Chromium installer removed shared cached revision1228; no restoration or cleanup attempted. Child-owned processes were stopped. Logs: /tmp/dependency-t2-h5Y0sx. Five E2E tests remained skipped by the existing suite; no claim of full coverage.

T4 complete: scripts/seo-audit.ts:222 annotates finalResult as ReturnType<typeof evaluateSeoAuditFromReports>. Existing SeoAuditSummary contract provides correctiveAction literal union; no runtime expression changed. Writer observed typecheck TS2345 exit2 before and exit0 after. Writer and independent verifier observed unit19/build/diff checks pass; writer audit0. No E2E/SSR rerun for erased annotation; prior evidence and limitations remain applicable. Updated three-file candidate native review review-cea4ebbee458d3a2 approved and exact acknowledgement completed, authority burned for sha256:d0f99d13d8153756b57d0b432588c2026a554d529ad3d9528337e33d62ca5a4f.

Next: explicit user authorization for Git commits, if desired. No source or verification blockers remain; environmental cache/temp side effects remain disclosed above. Dependency refresh is applied and verified with the disclosed exceptions; no Git commits or publishing. Engram recovery mirror: `odd/dependency-refresh/tasks`.
