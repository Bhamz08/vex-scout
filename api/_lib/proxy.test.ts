import { describe, expect, it, vi } from 'vitest';
import { buildUpstreamUrl, handleProxy, TtlCache } from './proxy';

const BASE = 'https://events.example.com/api/v2';
const opts = { apiKey: 'secret', baseUrl: BASE, prefix: '/api/vex/', ttlMs: 60_000 };

describe('buildUpstreamUrl', () => {
  it('maps the path and keeps repeated query params', () => {
    const url = buildUpstreamUrl('https://app.test/api/vex/events/1/teams?season[]=1&season[]=2', '/api/vex/', BASE);
    expect(url?.toString()).toBe(`${BASE}/events/1/teams?season%5B%5D=1&season%5B%5D=2`);
  });

  it.each(['/api/vex/', '/api/vex/../secrets', '/api/vex/a//b', '/api/vex/a%2F..%2Fb', '/other/teams'])('rejects %s', (path) => {
    expect(buildUpstreamUrl(`https://app.test${path}`, '/api/vex/', BASE)).toBeNull();
  });
});

describe('handleProxy', () => {
  it('returns 503 when no key is configured', async () => {
    const res = await handleProxy(new Request('https://app.test/api/vex/teams'), { ...opts, apiKey: undefined }, new TtlCache());
    expect(res.status).toBe(503);
  });

  it('adds the auth header server-side and caches successful responses', async () => {
    const fetchImpl = vi.fn(async () => new Response('{"ok":true}', { status: 200, headers: { 'Content-Type': 'application/json' } }));
    const cache = new TtlCache();
    const req = () => new Request('https://app.test/api/vex/teams?number[]=1A');

    const first = await handleProxy(req(), opts, cache, fetchImpl as unknown as typeof fetch);
    const second = await handleProxy(req(), opts, cache, fetchImpl as unknown as typeof fetch);

    expect(first.headers.get('X-Proxy-Cache')).toBe('MISS');
    expect(second.headers.get('X-Proxy-Cache')).toBe('HIT');
    expect(await second.text()).toBe('{"ok":true}');
    expect(fetchImpl).toHaveBeenCalledTimes(1);
    const init = (fetchImpl.mock.calls[0] as unknown as [URL, RequestInit])[1];
    expect((init.headers as Record<string, string>).Authorization).toBe('Bearer secret');
  });

  it('passes rate-limit errors through without caching', async () => {
    const fetchImpl = vi.fn(async () => new Response('slow down', { status: 429, headers: { 'Retry-After': '30' } }));
    const res = await handleProxy(new Request('https://app.test/api/vex/teams'), opts, new TtlCache(), fetchImpl as unknown as typeof fetch);
    expect(res.status).toBe(429);
    expect(res.headers.get('Retry-After')).toBe('30');
  });

  it('expires cache entries after the TTL', () => {
    const cache = new TtlCache();
    cache.set('k', { expires: 1000, status: 200, body: '', contentType: 'x' });
    expect(cache.get('k', 999)).toBeDefined();
    expect(cache.get('k', 1000)).toBeUndefined();
  });
});
