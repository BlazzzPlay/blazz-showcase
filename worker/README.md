# Isolated Worker foundation and public API

This package builds the standalone Worker with the **cloudflare operator CLI**,
without detecting the ancestor Astro app. C2b2 serves the separately built
Astro7 static frontend on the same origin as this API. No deployment or full
migration readiness is claimed; the cloud D1 database remains empty.

## Local verification

From `worker/`, using the existing locked dependencies and Node >=22.18:

```sh
node --test test/public-api.test.ts test/db.test.ts
npm run typecheck
npm run build
```

The public tests use direct Miniflare/workerd D1, apply the production migration
into fresh `.cloudflare/public-api-*` local state, and dispose the runtime.
They do not invoke cf DB commands or read the original SQLite history.
Tests verify real inserts, SQL parameterization, enums, defaults, validation,
privilege rejection, cross-origin denial, streamed byte limits and DB failures.
These test artifacts contain synthetic data only and remain local. Eight initial
RED-run directories under `test/helpers/state-*` are preserved, not deleted;
`.gitignore` excludes them. Current tests use `.cloudflare/public-api-*` instead.

## Public contract (C2b1)

| POST route | JSON fields | Successful response |
| --- | --- | --- |
| `/api/contact` | `name`, `email`, `subject`, `message` | `{success:true,message:"Solicitud registrada con éxito. ¡Hablamos pronto!"}` |
| `/api/funnel` | `sessionId`, `event`, optional `source` | `{success:true}` |

All strings are trimmed. Contact lengths are name2–100, email3–254,
subject3–200, message10–4000; email must have a valid ASCII address shape.
Session length is8–64. Events: `cta_click`, `form_start`,
`form_submit_success`. Sources: `hero`, `nav`, `contact_form` (default).
No IDs, read status, unknown fields, arbitrary SQL or administrative operations
are accepted. Contact success requires D1 success with exactly one changed row.
Contact does not insert or await funnel analytics; analytics is a separate,
best-effort client request and never determines contact completion.

Failures are `{success:false,message:string}`; invalid field values additionally
return `fieldErrors: Record<string,string[]>`. Statuses:400 invalid JSON/fields,
403 absent/mismatched Origin,405 unsupported method (Allow: POST),413 body over
16KiB counted while streaming,415 non-JSON media type,503 insert failure.
Responses are no-store. No submitted PII or DB diagnostics are logged/returned.
There is no permissive CORS or preflight authorization. POST Origin must exactly
match the request URL origin; this protects browsers, not bots or forged headers.
CAPTCHA, rate limiting and abuse infrastructure remain unimplemented decisions.

`migrations/0001_initial.sql` creates empty `contact_requests` and
`contact_funnel_events`; it never seeds/imports history. IDs retain autoincrement
integers; `is_read` retains0/1 (default0). `created_at` defaults to SQL unixepoch
**seconds**, matching the old Drizzle timestamp-mode representation. Future admin
code must convert seconds to JS Date milliseconds. DB constraints enforce funnel
enums and read status. Runtime request handlers never perform DDL.

GET `/api/health` executes `SELECT 1`, independent of any fixture table, and returns
`{ok:true}` or503 `{ok:false}`. Unknown APIs and private paths return404/no-store
from the Worker. The assets configuration reserves `/api/*`, `/admin`,
`/admin/*`, `/private` and `/private/*` as worker-first, preventing private paths
from falling through to static assets. Vite `publicDir: '../dist'` supplies real static Astro assets; this is the
verified plugin interface, not an unsupported cf `assets.directory` setting.
Integration tests compare the bundled homepage with actual `dist/index.html`,
check public metadata and reject private output/legacy database strings.
Administrative operations remain denied; the independent C3a boundary is described below.

## C3a: fail-closed Access boundary (no private panel)

`/private`, its trailing-slash alias and every descendant, for every method,
require URL origin exactly `https://blazz.cl`. Other origins return404 before
verification. `ACCESS_AUD` must contain the actual Access application's audience;
missing/blank configuration returns404. No audience has been provisioned here.
Configured missing/invalid JWTs return401 with a generic message; private responses
are `no-store` and `X-Robots-Tag: noindex`. Valid authorization still returns404:
C3b will implement private routing, panel rendering and database operations.
`/admin` and the original mark-read/delete APIs remain404, even with valid tokens.

Only `Cf-Access-Jwt-Assertion` is read (maximum16KiB). Pinned jose6.2.12 verifies
RS256 signatures, issuer `https://blazzz.cloudflareaccess.com`, configured trimmed
audience, required finite expiry and exact signed email `fabianma7@gmail.com`.
Expiry and optional nbf use five seconds of clock tolerance. Identity headers,
query keys and token jku/x5u URLs confer no trust. The module-cached remote JWKS
uses only the fixed issuer's `/cdn-cgi/access/certs`, a three-second abort timeout,
ten-minute cache and thirty-second refresh cooldown; fetch redirects are errors.
Factory-only key/fetch injection supports local tests, never request/env overrides.
No tokens, identities or upstream errors are logged.

The signed email is trusted only as an issuer claim: no nonstandard mandatory
`email_verified` claim is imposed. Login-provider/mailbox assurance, the one-user
Access policy, application/AUD provisioning and deployment verification remain
pending. `npm --prefix worker run test:access` uses ephemeral local RSA keys and
fake JWKS fetches, with no external Access traffic. C2a's CLI hang and C2b2's
intermittent local ECONNRESET remain separate delivery blockers, not fixed here.

## Foundation proof and unresolved C2a

Build Output is `.cloudflare/output/v0/config.json`; bundle/config/assets are
under `workers/default/`. Vite uses `../dist` by default. `STATIC_FIXTURE=1`
explicitly selects `test/fixtures/static` for foundation build **and** dev tests;
fixture proof must never silently exercise real Astro output.
The account78a16433f7a4e0421319f6310b5acacc and DB UUID
43a7fa88-38f6-43d0-99ea-df68bab1896e are pinned. Remote bindings/inspector are
disabled, `envDir:false` prevents dotenv loading, and no resources are provisioned.
No Wrangler dependency exists here; cf delegates builds to Vite.

C2a stays blocked: cf beta14 local SQL/migration commands print valid output but
hang, independently reproduced at60seconds. The foundation test keeps every
CLI exit-zero assertion. Direct Miniflare tests do not prove CLI termination.
The authorized integration cleanup replaces the obsolete contact404 expectation:
missing Origin yields403, invalid same-origin JSON fields yield400, and unsupported
methods yield405. Admin, private and unknown API namespaces still require404.
The bounded foundation rerun produced **2 passes / 1 failure**: configuration and
live assets/health/public validation/private denial passed. The only failure was
`cf local migration repeat-apply and runtime binding query`: initial apply and raw
SQL printed correct output but timed out at10seconds (exit143); repeat apply
returned `[]` and exit0. Real D1 still verified one probe row and one migration.
The CLI termination failure remains a failure, not readiness evidence.

The foundation invocation is `npm run test:foundation`: it builds with
`STATIC_FIXTURE=1` and passes the same explicit mode to the unchanged test.
Direct invocation also requires `STATIC_FIXTURE=1 node --test test/foundation.test.ts`
after a fixture-mode build.
It uses a spare port, starts/stops cf dev and creates `.cloudflare/proof-*` state.
`FOUNDATION_STATE` configures Vite persistence; cf DB commands use the same
absolute `--persist-to` path (both map to `v3`). Its probe migration is test-only,
never production. All cf D1 commands must include `--local` until remote work is
explicitly authorized; do not apply either migration remotely in this slice.

## Preserved tooling boundary

| Dependency | Locked version |
| --- | --- |
| cf | 1.0.0-beta.14 |
| @cloudflare/vite-plugin | 2.0.0-beta.sha-91c870c02 |
| Vite | 8.3.4 |
| TypeScript | 7.0.2 |
| @types/node | 26.6.5 |
| Miniflare | 5.20261006.1-alpha |
| workerd (transitive runtime) | 1.20261006.1 |

For manual development, `cloudflare dev` uses loopback port18797 with strictPort
and `.cloudflare/local-state`. Override `FOUNDATION_PORT` / `FOUNDATION_STATE`.
The global cf `--persist-to` flag does not configure Vite persistence. The plugin
exposes a loopback-only local Explorer, not a deployed Worker endpoint. The prior
npm install reported a blocked workerd postinstall; the existing platform runtime
was available and live tests ran. No installer or dependency change was needed.
No deploy (including dry-run), remote query/migration, provisioning, DNS or Access
command was run. This is not a packet-capture audit of the build tooling.

## C2b2 integration and rollback

From the root, build static Astro first, then build and test this package:

```sh
npm run build
npm --prefix worker run build
npm --prefix worker run test:api
npm --prefix worker run typecheck
npm --prefix worker run test:static
npm run test:e2e -- --reporter=line
```

The parent removed six legacy sources: `src/actions/index.ts`, `src/db/index.ts`,
`src/db/schema.ts`, `src/pages/admin.astro`, `src/pages/api/mark-read.ts` and
`src/pages/api/delete.ts`. Neither private routes nor SQLite queries run during
Astro build. Root Node adapter/libSQL/Drizzle dependencies are retired; Astro7
and TypeScript5 remain. Worker TypeScript7 is checked independently.

`src/lib/contact-api.ts` sends same-origin JSON and validates status/envelopes
before permitting success/reset. Inline field errors, focus, pending guards,
input preservation and analytics-independent completion remain covered by the
11 original UI regressions plus malformed-response coverage, on both projects.
`spec-gaps` reads isolated local D1 through Miniflare, never SQLite history or a
public debugging endpoint; it verifies a real browser contact and funnel rows.

`test:static` probes real assets/JSON methods/origin/private denial. Playwright's
`node scripts/test-stack.mjs` builds Astro, initializes the production schema
using direct Miniflare **test-only**, and starts child-owned `cloudflare dev` on
port4401 (or an explicitly chosen spare). It never reuses ambient4321 or an
occupied port. Fresh `worker/.cloudflare/e2e-*` state maps to `v3`, using the
exact binding UUID43a7fa88-38f6-43d0-99ea-df68bab1896e. No remote fallback exists.
Playwright requests graceful SIGTERM; the harness bounds shutdown and targets
only its detached child groups, including delegated Vite/workerd descendants.
Local synthetic state is retained. Chromium must already be available locally.

`npm run dev` at the root builds Astro and starts cf dev; rebuild/restart after
frontend edits. It does not apply SQL or provision resources. Operators remain
on cf. The intended local schema command, from `worker/`, is:

```sh
cloudflare d1 migrations apply 43a7fa88-38f6-43d0-99ea-df68bab1896e --dir migrations --local --persist-to .cloudflare/local-state
```

This command remains subject to the documented C2a termination hang. Never
remove `--local` or substitute a remote migration. `FOUNDATION_STATE` must match
that persist-to root when using another isolated local state. Without schema,
contact/funnel return503, not fabricated success. Direct test-harness migration
does not establish operator migration readiness.

Default `npm test` includes API, static and the retained foundation suite; build
real assets first. Foundation then intentionally rebuilds fixture assets, so
rebuild normal Worker assets afterwards before inspecting production output.
CI runs the explicitly scoped local API/static/browser tests without credentials;
foundation's known CLI failure remains separately reproducible, not suppressed.

### Observed C2b2 local evidence

Focused SEO was RED on both secondary canonical checks, then GREEN6/6 after
normalizing Layout's pathname before catalog/metadata resolution. Canonical and
Open Graph URLs retain homepage `/` and secondary routes without trailing slash;
both browser URL spellings are covered. A separate sitemap RED exposed the same
slash drift; Astro `trailingSlash: 'never'` aligns sitemap URLs with canonical
metadata. Bundled public HTML and sitemap match the separate frontend build.
Admin checks now require404/no-store,
exact `Not found`, no record HTML and no private files in static output.

Final full browser run: **41 passes / 5 existing viewport skips**, including all
11 retained UI regressions plus malformed responses on desktop/mobile. A real
keyboard submission verified one local contact row and three funnel event rows.
Root units19/19, independent types and separate builds passed. Static integration
has5 checks including exact public HTML asset equality, private/data exclusion,
HTTP/API/D1 proof, closed listener after child shutdown and CI/lock-root checks.
CI was checked structurally, not executed remotely; no installer ran locally.

Earlier status-only Node probes observed intermittent Vite `fetch failed`500s.
The probes now fully consume responses, without retries or changed status
assertions; subsequent repeated runs passed5/5. This does not establish the
runtime error's root cause. workerd RPC diagnostics also appeared during a
passing browser run. These are disclosed local beta-tooling risks, not cloud
readiness evidence. The foundation CLI termination failure remains distinct,
unchanged and not rerun in this correction.

C3a verification remains Worker-owned and fail closed. C3b must preserve this
boundary before panel access and every future administrative mutation.
No private HTML, key redirects or privileged Astro routes are restored here.
Do not certify CLI/deployment compatibility until C2a is resolved. Migration,
Access provisioning, deployment and DNS remain separate authorization gates.

Parent-owned rollback: revert this frontend/transport/test integration and the
six source removals together as a reviewed change, then rebuild outputs. Keep
C2b1 API/schema intact unless separately reverting that unit. Neither cloud nor
original SQLite state was mutated; leave proof state unless cleanup is authorized.

Sources: [cf projects](https://developers.cloudflare.com/cf/projects/),
[config](https://developers.cloudflare.com/cf/projects/cloudflare-config/),
[Vite plugin](https://developers.cloudflare.com/workers/vite-plugin/).
