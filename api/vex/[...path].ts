import { DEFAULT_API_BASE, handleProxy, TtlCache } from '../_lib/proxy';

/**
 * GET /api/vex/<path>?<query> → VEX Events API v2 /<path>?<query>, with the API key added server-side.
 * Env: VEX_API_KEY (required), VEX_API_BASE (optional).
 */
const cache = new TtlCache(300);

export async function GET(request: Request): Promise<Response> {
  return handleProxy(
    request,
    {
      apiKey: process.env.VEX_API_KEY,
      baseUrl: process.env.VEX_API_BASE ?? DEFAULT_API_BASE,
      prefix: '/api/vex/',
      ttlMs: 60_000,
    },
    cache,
  );
}
