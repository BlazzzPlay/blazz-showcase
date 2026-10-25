import type { Env } from './env.ts';
import { publicApi } from './public-api.ts';
import { privateBoundary } from './access-auth.ts';
import type { JWTVerifyGetKey } from 'jose';

export function createHandler(keys?: JWTVerifyGetKey) {
  return {
    async fetch(request: Request, env: Env): Promise<Response> {
      const path = new URL(request.url).pathname;
      const headers = { 'cache-control': 'no-store' };
      if (path === '/private' || path.startsWith('/private/')) {
        return privateBoundary(request, env.ACCESS_AUD, keys);
      }
      if (path === '/api/health' && request.method === 'GET') {
        try {
          const row = await env.DB.prepare('SELECT 1 AS ok').first<{ ok: number }>();
          if (row?.ok === 1) return Response.json({ ok: true }, { headers });
        } catch {
          // Never expose binding errors, SQL, credentials or submitted data.
        }
        return Response.json({ ok: false }, { status: 503, headers });
      }
      if (path === '/api/contact' || path === '/api/funnel') {
        return publicApi(request, env, path === '/api/contact');
      }
      // Unknown APIs and private paths never reach static asset fallback.
      return new Response('Not found', { status: 404, headers });
    },
  } satisfies ExportedHandler<Env>;
}

export default createHandler();
