import { createRemoteJWKSet, customFetch, jwtVerify, type JWTVerifyGetKey } from 'jose';

const ISSUER = 'https://blazzz.cloudflareaccess.com';
const JWKS_URL = new URL(`${ISSUER}/cdn-cgi/access/certs`);
const CANONICAL_ORIGIN = 'https://blazz.cl';
const EMAIL = 'fabianma7@gmail.com';
const MAX_TOKEN_LENGTH = 16384;

// Factory injection is for local tests only; no request/env can change trust roots.
export function createAccessKeyResolver(fetcher: typeof fetch = fetch) {
  return createRemoteJWKSet(JWKS_URL, {
    timeoutDuration: 3000,
    cooldownDuration: 30000,
    cacheMaxAge: 600000,
    [customFetch]: (url, options) => fetcher(url, { ...options, redirect: 'error' }),
  });
}
const trustedKeys = createAccessKeyResolver();

function privateResponse(status: 401 | 404): Response {
  return new Response(status === 401 ? 'Unauthorized' : 'Not found', {
    status,
    headers: { 'cache-control': 'no-store', 'x-robots-tag': 'noindex' },
  });
}

// Authorized requests are handed to `next`; every denial happens before it runs.
export async function privateBoundary(
  request: Request, audience: string | undefined, keys: JWTVerifyGetKey = trustedKeys,
  next: () => Promise<Response> = async () => privateResponse(404),
): Promise<Response> {
  if (new URL(request.url).origin !== CANONICAL_ORIGIN) return privateResponse(404);
  const aud = audience?.trim();
  if (!aud) return privateResponse(404);
  const token = request.headers.get('Cf-Access-Jwt-Assertion');
  if (!token || token.length > MAX_TOKEN_LENGTH) return privateResponse(401);
  try {
    const { payload } = await jwtVerify(token, keys, {
      algorithms: ['RS256'], issuer: ISSUER, audience: aud,
      requiredClaims: ['iss', 'aud', 'exp', 'email'], clockTolerance: 5,
    });
    if (!Number.isFinite(payload.exp) || typeof payload.email !== 'string' || payload.email.toLowerCase() !== EMAIL) return privateResponse(401);
  } catch {
    // Do not log JWTs, identities or upstream errors.
    return privateResponse(401);
  }
  return next();
}
