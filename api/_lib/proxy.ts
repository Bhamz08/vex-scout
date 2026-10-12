/**
 * Server-side proxy logic shared by the Vercel functions in /api. Files under api/_lib are not
 * deployed as routes (Vercel ignores underscore-prefixed paths), and are unit-tested directly.
 *
 * The API key only ever exists here, read from an env var; the browser never sees it.
 */

export const DEFAULT_API_BASE = 'https://events.vex.com/api/v2';

/** Only plain path segments may be forwarded: no "..", no encoded tricks, no absolute URLs. */
const SAFE_PATH = /^[A-Za-z0-9_\-/]+$/;

export function buildUpstreamUrl(requestUrl: string, prefix: string, base: string): URL | null {
  const url = new URL(requestUrl);
  if (!url.pathname.startsWith(prefix)) return null;
  const rest = url.pathname.slice(prefix.length).replace(/^\/+/, '');
  if (!rest || rest.includes('..') || rest.includes('//') || !SAFE_PATH.test(rest)) return null;
  const upstream = new URL(`${base.replace(/\/+$/, '')}/${rest}`);
  url.searchParams.forEach((value, key) => upstream.searchParams.append(key, value));
  return upstream;
}

interface Entry {
  expires: number;
  status: number;
  body: string;
  contentType: string;
}

/** Tiny in-memory TTL cache. Survives between invocations while the function instance stays warm. */
export class TtlCache {
  private entries = new Map<string, Entry>();

  constructor(private readonly maxEntries = 200) {}

  get(key: string, now = Date.now()): Entry | undefined {
    const hit = this.entries.get(key);
    if (!hit) return undefined;
    if (hit.expires <= now) {
      this.entries.delete(key);
      return undefined;
    }
    return hit;
  }

  set(key: string, entry: Entry): void {
    if (this.entries.size >= this.maxEntries) {
      const oldest = this.entries.keys().next().value;
      if (oldest !== undefined) this.entries.delete(oldest);
    }
    this.entries.set(key, entry);
  }
}

export interface ProxyOptions {
  apiKey: string | undefined;
  baseUrl: string;
  prefix: string;
  ttlMs: number;
  /** ASSUMED auth scheme; verify against the API docs. */
  authHeader?: (key: string) => [string, string];
}

const json = (status: number, body: unknown, extra: Record<string, string> = {}) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json', ...extra } });

export async function handleProxy(request: Request, opts: ProxyOptions, cache: TtlCache, fetchImpl: typeof fetch = fetch): Promise<Response> {
  if (request.method !== 'GET') return json(405, { error: 'method_not_allowed' }, { Allow: 'GET' });
  if (!opts.apiKey) return json(503, { error: 'not_configured', message: 'VEX_API_KEY is not set on the server.' });

  const upstream = buildUpstreamUrl(request.url, opts.prefix, opts.baseUrl);
  if (!upstream) return json(400, { error: 'bad_path' });

  const key = upstream.toString();
  const cacheHeaders = { 'Cache-Control': `public, max-age=0, s-maxage=${Math.round(opts.ttlMs / 1000)}, stale-while-revalidate=300` };
  const hit = cache.get(key);
  if (hit) {
    return new Response(hit.body, { status: hit.status, headers: { 'Content-Type': hit.contentType, 'X-Proxy-Cache': 'HIT', ...cacheHeaders } });
  }

  const [headerName, headerValue] = (opts.authHeader ?? ((k: string) => ['Authorization', `Bearer ${k}`]))(opts.apiKey);
  let res: Response;
  try {
    res = await fetchImpl(upstream, { headers: { Accept: 'application/json', [headerName]: headerValue } });
  } catch {
    return json(502, { error: 'upstream_unreachable' });
  }

  const body = await res.text();
  const contentType = res.headers.get('Content-Type') ?? 'application/json';
  if (!res.ok) {
    const passthrough: Record<string, string> = { 'Content-Type': contentType, 'Cache-Control': 'no-store' };
    const retryAfter = res.headers.get('Retry-After');
    if (retryAfter) passthrough['Retry-After'] = retryAfter;
    return new Response(body, { status: res.status, headers: passthrough });
  }

  cache.set(key, { expires: Date.now() + opts.ttlMs, status: res.status, body, contentType });
  return new Response(body, { status: res.status, headers: { 'Content-Type': contentType, 'X-Proxy-Cache': 'MISS', ...cacheHeaders } });
}
