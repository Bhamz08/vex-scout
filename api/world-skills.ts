import { TtlCache } from './_lib/proxy.js';

/**
 * GET /api/world-skills?season=<id>&grade=<High School|Middle School|College>
 *
 * The World Skills standings are not part of the documented v2 API. This forwards to the public JSON feed behind
 * the events.vex.com standings page (checked working 2026-10-12; no key needed, but it is undocumented and may change).
 * Override the URL template with VEX_WORLD_SKILLS_URL ({season} and {grade} are substituted).
 */
const DEFAULT_TEMPLATE = 'https://events.vex.com/api/seasons/{season}/skills?post_season=0&grade_level={grade}';
const cache = new TtlCache(20);
const TTL_MS = 10 * 60_000;

export async function GET(request: Request): Promise<Response> {
  const params = new URL(request.url).searchParams;
  const season = params.get('season') ?? '';
  const grade = params.get('grade') ?? '';
  if (!/^\d+$/.test(season) || !['High School', 'Middle School', 'College'].includes(grade)) {
    return Response.json({ error: 'bad_request' }, { status: 400 });
  }

  const template = process.env.VEX_WORLD_SKILLS_URL ?? DEFAULT_TEMPLATE;
  const url = template.replace('{season}', season).replace('{grade}', encodeURIComponent(grade));
  const hit = cache.get(url);
  if (hit) return new Response(hit.body, { status: 200, headers: { 'Content-Type': hit.contentType, 'X-Proxy-Cache': 'HIT' } });

  try {
    const res = await fetch(url, { headers: { Accept: 'application/json' } });
    const body = await res.text();
    if (!res.ok) return new Response(body, { status: res.status });
    cache.set(url, { expires: Date.now() + TTL_MS, status: 200, body, contentType: 'application/json' });
    return new Response(body, {
      status: 200,
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'public, s-maxage=600, stale-while-revalidate=3600' },
    });
  } catch {
    return Response.json({ error: 'upstream_unreachable' }, { status: 502 });
  }
}
