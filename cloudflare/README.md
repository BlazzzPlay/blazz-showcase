# Cloudflare zone hardening (blazz.cl)

Applied 2026-11-05 with the `cf` CLI. `backup-before-hardening.json` holds the previous values.

| Setting | Before | After |
| --- | --- | --- |
| Always Use HTTPS | off | on (http -> 301 https) |
| Minimum TLS | 1.0 | 1.2 |
| HSTS | off | 6 months (15552000 s), nosniff; no subdomains, no preload |
| Bot Fight Mode | off | on (JS detections on) |
| AI bots protection | block | block |
| SSL mode | strict | strict (unchanged) |

Rulesets created:
- `waf-custom-rules.json` (phase `http_request_firewall_custom`): blocks vulnerability probes (`/wp-`, `xmlrpc.php`, `/.env`, `/.git`, `phpmyadmin`, `/cgi-bin`, `*.php`, `/vendor/phpunit`) and empty or attack-tool user agents.
- `rate-limit-rules.json` (phase `http_ratelimit`, the single free-plan rule): `POST /api/*` limited to 5 requests per 10 s per IP, then blocked for 10 s.

Verified live: pages 200, `/private` 302 (Access), probes and empty/sqlmap/GPTBot UA 403, Googlebot 200, TLS 1.1 refused, 6th API POST in 10 s gets 429.

Subdomains are not covered by HSTS on purpose: the zone has many CNAMEs whose HTTPS status was not checked.
